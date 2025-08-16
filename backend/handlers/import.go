package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"mythsmith-backend/database"
	"mythsmith-backend/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ImportHandler struct {
	db *database.DB
}

func NewImportHandler(db *database.DB) *ImportHandler {
	return &ImportHandler{db: db}
}

type ImportRequest struct {
	Strategy string            `json:"strategy"`
	Data     models.ImportData `json:"data"`
}

type ImportResponse struct {
	Message      string   `json:"message"`
	NodesCreated int      `json:"nodesCreated"`
	EdgesCreated int      `json:"edgesCreated"`
	Conflicts    []string `json:"conflicts,omitempty"`
	Warnings     []string `json:"warnings,omitempty"`
}

func (h *ImportHandler) ImportMap(c *gin.Context) {
	var req ImportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := ImportResponse{
		Conflicts: []string{},
		Warnings:  []string{},
	}

	// Start with a fresh transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// Set a timeout for the transaction to prevent hanging
	_, err = tx.Exec("PRAGMA busy_timeout = 5000") // 5 seconds timeout
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set timeout"})
		return
	}

	// Handle nodes
	if req.Strategy == "replace" {
		// First, let's check if we have any active transactions by trying to commit
		// This should release any locks
		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit initial transaction"})
			return
		}

		// Start a new transaction for the actual work
		tx, err = h.db.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start new transaction"})
			return
		}

		// Set timeout again
		_, err = tx.Exec("PRAGMA busy_timeout = 5000")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set timeout"})
			return
		}

		// Try to clear existing data with retry logic
		maxRetries := 3
		for i := 0; i < maxRetries; i++ {
			// Check if tables exist first
			var tableExists bool
			err = tx.QueryRow("SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='edges')").Scan(&tableExists)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to check edges table: %v", err)})
				return
			}

			if tableExists {
				// Try to delete edges
				_, err = tx.Exec("DELETE FROM edges")
				if err != nil {
					if i == maxRetries-1 {
						// Last attempt failed
						tx.Rollback()
						c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to clear existing edges after %d attempts: %v", maxRetries, err)})
						return
					}
					// Wait before retrying
					time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
					continue
				}
			}

			// Check if nodes table exists
			err = tx.QueryRow("SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='nodes')").Scan(&tableExists)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to check nodes table: %v", err)})
				return
			}

			if tableExists {
				// Try to delete nodes
				_, err = tx.Exec("DELETE FROM nodes")
				if err != nil {
					if i == maxRetries-1 {
						// Last attempt failed
						tx.Rollback()
						c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to clear existing nodes after %d attempts: %v", maxRetries, err)})
						return
					}
					// Wait before retrying
					time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
					continue
				}
			}

			// Success, break out of retry loop
			break
		}
	}

	// Get existing node IDs for conflict detection
	existingNodes := make(map[string]bool)
	if req.Strategy == "merge" {
		rows, err := tx.Query("SELECT id FROM nodes")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing nodes"})
			return
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			existingNodes[id] = true
		}
	}

	now := time.Now()
	nodeIdMapping := make(map[string]string)  // old ID -> new ID for conflicts
	tempIdToNodeId := make(map[string]string) // tempId -> real ID mapping

	// Process imported nodes
	for _, importNode := range req.Data.Nodes {
		nodeId := importNode.ID
		originalId := nodeId

		// Handle ID conflicts in merge mode
		if req.Strategy == "merge" && existingNodes[nodeId] {
			nodeId = fmt.Sprintf("%s_imported_%d", originalId, now.Unix())
			nodeIdMapping[originalId] = nodeId
			response.Conflicts = append(response.Conflicts,
				fmt.Sprintf("Node %s renamed to %s due to conflict", originalId, nodeId))
		}

		// Extract data from the struct fields
		name := importNode.Data.Name
		if name == "" {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Node %s missing name, using ID as name", nodeId))
			name = nodeId
		}

		nodeType := string(importNode.Data.Type)
		if nodeType == "" {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Node %s missing type, using default 'character'", nodeId))
			nodeType = "character"
		}

		description := importNode.Data.Description
		connectionDirection := string(importNode.Data.ConnectionDirection)
		if connectionDirection == "" {
			connectionDirection = "all"
		}

		// Get extended properties from the Properties field
		properties := importNode.Data.Properties
		if properties == nil {
			properties = make(map[string]interface{})
		}

		// Store tempId mapping if present
		if tempId, ok := properties["tempId"].(string); ok {
			tempIdToNodeId[tempId] = nodeId
		}

		propertiesJSON, err := json.Marshal(properties)
		if err != nil {
			propertiesJSON = []byte("{}")
		}

		// Insert node
		_, err = tx.Exec(`
            INSERT INTO nodes (id, name, type, description, x, y, connection_direction, properties, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, nodeId, name, nodeType, description,
			importNode.Position.X, importNode.Position.Y, connectionDirection,
			string(propertiesJSON), now, now)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to import node %s: %v", nodeId, err),
			})
			return
		}
		response.NodesCreated++
	}

	// Process edges
	for _, edgeMap := range req.Data.Edges {
		// Extract edge ID or generate one
		edgeId, hasId := edgeMap["id"].(string)
		if !hasId {
			edgeId = fmt.Sprintf("edge_%d", now.UnixNano())
		}

		// Get source and target
		source, _ := edgeMap["source"].(string)
		target, _ := edgeMap["target"].(string)

		// Handle source ID - check if it's a tempId or needs remapping
		if strings.HasPrefix(source, "temp_") {
			if realId, ok := tempIdToNodeId[source]; ok {
				source = realId
			} else {
				response.Warnings = append(response.Warnings,
					fmt.Sprintf("Edge %s references non-existent source node %s", edgeId, source))
				continue
			}
		} else if remappedId, ok := nodeIdMapping[source]; ok {
			source = remappedId
		}

		// Handle target ID - check if it's a tempId or needs remapping
		if strings.HasPrefix(target, "temp_") {
			if realId, ok := tempIdToNodeId[target]; ok {
				target = realId
			} else {
				response.Warnings = append(response.Warnings,
					fmt.Sprintf("Edge %s references non-existent target node %s", edgeId, target))
				continue
			}
		} else if remappedId, ok := nodeIdMapping[target]; ok {
			target = remappedId
		}

		// Get handles
		sourceHandle, _ := edgeMap["sourceHandle"].(string)
		targetHandle, _ := edgeMap["targetHandle"].(string)

		// Extract edge properties
		basicFields := map[string]bool{
			"id": true, "source": true, "target": true,
			"sourceHandle": true, "targetHandle": true, "relationship": true, "data": true,
		}
		properties := make(map[string]interface{})
		for key, value := range edgeMap {
			if !basicFields[key] {
				properties[key] = value
			}
		}

		// Merge data properties
		if dataMap, ok := edgeMap["data"].(map[string]interface{}); ok {
			for k, v := range dataMap {
				properties[k] = v
			}
		}

		propertiesJSON, err := json.Marshal(properties)
		if err != nil {
			propertiesJSON = []byte("{}")
		}

		// Get relationship type
		relationship, _ := properties["type"].(string)
		if relationship == "" {
			relationship = "custom"
		}

		// Insert edge
		_, err = tx.Exec(`
            INSERT INTO edges (id, source_node_id, target_node_id, source_handle, target_handle, relationship, properties, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, edgeId, source, target, sourceHandle, targetHandle, relationship, string(propertiesJSON), now)

		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": fmt.Sprintf("Failed to import edge %s: %v", edgeId, err),
			})
			return
		}
		response.EdgesCreated++
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit import transaction"})
		return
	}

	response.Message = fmt.Sprintf("Import completed: %d nodes, %d edges",
		response.NodesCreated, response.EdgesCreated)
	c.JSON(http.StatusOK, response)
}

// Helper method for processing edges
func (h *ImportHandler) processEdges(tx *sql.Tx, req ImportRequest, nodeIdMapping map[string]string, now time.Time, response *ImportResponse) error {
	// Get existing edge IDs for conflict detection
	existingEdges := make(map[string]bool)
	if req.Strategy == "merge" {
		rows, err := tx.Query("SELECT id FROM edges")
		if err != nil {
			return fmt.Errorf("failed to get existing edges")
		}
		defer rows.Close()
		for rows.Next() {
			var id string
			rows.Scan(&id)
			existingEdges[id] = true
		}
	}

	// Process imported edges
	for _, edgeMap := range req.Data.Edges {
		edgeId, _ := edgeMap["id"].(string)
		source, _ := edgeMap["source"].(string)
		target, _ := edgeMap["target"].(string)
		sourceHandle, _ := edgeMap["sourceHandle"].(string)
		targetHandle, _ := edgeMap["targetHandle"].(string)
		relationship, _ := edgeMap["relationship"].(string)

		// Update source/target if they were remapped due to conflicts
		if newSource, exists := nodeIdMapping[source]; exists {
			source = newSource
		}
		if newTarget, exists := nodeIdMapping[target]; exists {
			target = newTarget
		}

		// Handle edge ID conflicts
		originalEdgeId := edgeId
		if req.Strategy == "merge" && existingEdges[edgeId] {
			edgeId = fmt.Sprintf("%s_imported_%d", originalEdgeId, now.Unix())
			response.Conflicts = append(response.Conflicts,
				fmt.Sprintf("Edge %s renamed to %s due to conflict", originalEdgeId, edgeId))
		}

		// Extract edge properties
		basicFields := map[string]bool{
			"id": true, "source": true, "target": true,
			"sourceHandle": true, "targetHandle": true, "relationship": true, "data": true,
		}
		properties := make(map[string]interface{})
		for key, value := range edgeMap {
			if !basicFields[key] {
				properties[key] = value
			}
		}

		// Merge data properties
		if dataMap, ok := edgeMap["data"].(map[string]interface{}); ok {
			for k, v := range dataMap {
				properties[k] = v
			}
		}

		propertiesJSON, err := json.Marshal(properties)
		if err != nil {
			propertiesJSON = []byte("{}")
		}

		// Insert edge
		_, err = tx.Exec(`
            INSERT INTO edges (id, source_node_id, target_node_id, source_handle, target_handle, relationship, properties, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, edgeId, source, target, sourceHandle, targetHandle, relationship, string(propertiesJSON), now)
		if err != nil {
			return fmt.Errorf("failed to import edge %s: %v", edgeId, err)
		}
		response.EdgesCreated++
	}

	return nil
}
