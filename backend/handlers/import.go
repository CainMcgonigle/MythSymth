package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"mythsmith-backend/database"
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

// Define the import data structures based on your actual JSON
type ImportNodeData struct {
	Name                string                 `json:"name"`
	Type                string                 `json:"type"`
	Description         string                 `json:"description"`
	ConnectionDirection string                 `json:"connectionDirection"`
	ID                  string                 `json:"id"`
	Properties          map[string]interface{} `json:"properties,omitempty"`
}

type ImportNode struct {
	ID       string         `json:"id"`
	Data     ImportNodeData `json:"data"`
	Position struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
}

type ImportData struct {
	Nodes []ImportNode             `json:"nodes"`
	Edges []map[string]interface{} `json:"edges"`
}

type ImportRequest struct {
	Strategy string     `json:"strategy"`
	Data     ImportData `json:"data"`
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
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request format: %v", err)})
		return
	}

	// Validate request data
	if len(req.Data.Nodes) == 0 && len(req.Data.Edges) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No data to import"})
		return
	}

	// Validate strategy
	if req.Strategy != "replace" && req.Strategy != "merge" {
		req.Strategy = "replace" // Default to replace
	}

	response := ImportResponse{
		Conflicts: []string{},
		Warnings:  []string{},
	}

	// Start transaction with proper error handling
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		if tx != nil {
			tx.Rollback()
		}
	}()

	// Set transaction timeout
	if _, err := tx.Exec("PRAGMA busy_timeout = 10000"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set timeout"})
		return
	}

	// Handle replace strategy
	if req.Strategy == "replace" {
		if err := h.clearExistingData(tx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to clear existing data: %v", err)})
			return
		}
	}

	// Get existing nodes for merge conflict detection
	existingNodes := make(map[string]bool)
	if req.Strategy == "merge" {
		existingNodes, err = h.getExistingNodeIDs(tx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing nodes"})
			return
		}
	}

	now := time.Now()
	nodeIdMapping := make(map[string]string)
	tempIdToNodeId := make(map[string]string)

	// Process nodes
	if err := h.processNodes(tx, req.Data.Nodes, existingNodes, nodeIdMapping, tempIdToNodeId, req.Strategy, now, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to process nodes: %v", err)})
		return
	}

	// Process edges
	if err := h.processEdges(tx, req.Data.Edges, nodeIdMapping, tempIdToNodeId, req.Strategy, now, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to process edges: %v", err)})
		return
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}
	tx = nil // Prevent rollback in defer

	response.Message = fmt.Sprintf("Import completed successfully: %d nodes, %d edges created",
		response.NodesCreated, response.EdgesCreated)

	c.JSON(http.StatusOK, response)
}

func (h *ImportHandler) clearTable(tx *sql.Tx, tableName string) error {
	// Check if table exists
	var exists bool
	query := "SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name=?)"
	if err := tx.QueryRow(query, tableName).Scan(&exists); err != nil {
		return err
	}

	if !exists {
		return nil // Table doesn't exist, nothing to clear
	}

	// Clear the table with retry logic
	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		if _, err := tx.Exec(fmt.Sprintf("DELETE FROM %s", tableName)); err != nil {
			if i == maxRetries-1 {
				return err
			}
			time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
			continue
		}
		break
	}

	return nil
}

func (h *ImportHandler) getExistingNodeIDs(tx *sql.Tx) (map[string]bool, error) {
	existing := make(map[string]bool)

	rows, err := tx.Query("SELECT id FROM nodes")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		existing[id] = true
	}

	return existing, rows.Err()
}

func (h *ImportHandler) processNodes(tx *sql.Tx, nodes []ImportNode, existingNodes map[string]bool,
	nodeIdMapping, tempIdToNodeId map[string]string, strategy string, now time.Time, response *ImportResponse) error {

	for _, importNode := range nodes {
		nodeId := importNode.ID
		originalId := nodeId

		// Validate node ID
		if nodeId == "" {
			return fmt.Errorf("node missing ID")
		}

		// Handle ID conflicts in merge mode
		if strategy == "merge" && existingNodes[nodeId] {
			nodeId = fmt.Sprintf("%s_imported_%d", originalId, now.Unix())
			nodeIdMapping[originalId] = nodeId
			response.Conflicts = append(response.Conflicts,
				fmt.Sprintf("Node %s renamed to %s due to conflict", originalId, nodeId))
		}

		// Extract and validate node data from the actual JSON structure
		name := importNode.Data.Name
		if name == "" {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Node %s missing name, using ID as name", nodeId))
			name = nodeId
		}

		nodeType := importNode.Data.Type
		if nodeType == "" {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Node %s missing type, using default 'character'", nodeId))
			nodeType = "character"
		}

		description := importNode.Data.Description
		connectionDirection := importNode.Data.ConnectionDirection
		if connectionDirection == "" {
			connectionDirection = "all"
		}

		// Handle properties - start with existing properties
		properties := make(map[string]interface{})
		if importNode.Data.Properties != nil {
			for k, v := range importNode.Data.Properties {
				properties[k] = v
			}
		}

		// Add metadata for tracking
		properties["originalId"] = originalId
		if nodeId != originalId {
			properties["importedAs"] = nodeId
		}

		// Store tempId mapping if present
		if tempId, ok := properties["tempId"].(string); ok {
			tempIdToNodeId[tempId] = nodeId
		}

		propertiesJSON, err := json.Marshal(properties)
		if err != nil {
			return fmt.Errorf("failed to marshal properties for node %s: %v", nodeId, err)
		}

		// Insert node
		_, err = tx.Exec(`
            INSERT INTO nodes (id, name, type, description, x, y, connection_direction, properties, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, nodeId, name, nodeType, description,
			importNode.Position.X, importNode.Position.Y, connectionDirection,
			string(propertiesJSON), now, now)

		if err != nil {
			return fmt.Errorf("failed to insert node %s: %v", nodeId, err)
		}

		response.NodesCreated++
	}

	return nil
}

func (h *ImportHandler) processEdges(tx *sql.Tx, edges []map[string]interface{},
	nodeIdMapping, tempIdToNodeId map[string]string, strategy string, now time.Time, response *ImportResponse) error {

	// Get existing edge IDs for conflict detection in merge mode
	existingEdges := make(map[string]bool)
	if strategy == "merge" {
		rows, err := tx.Query("SELECT id FROM edges")
		if err != nil {
			return fmt.Errorf("failed to get existing edges: %v", err)
		}
		defer rows.Close()

		for rows.Next() {
			var id string
			if err := rows.Scan(&id); err != nil {
				return fmt.Errorf("failed to scan edge ID: %v", err)
			}
			existingEdges[id] = true
		}

		if err := rows.Err(); err != nil {
			return fmt.Errorf("error iterating edge rows: %v", err)
		}
	}

	for i, edgeMap := range edges {
		// Extract or generate edge ID
		edgeId, hasId := edgeMap["id"].(string)
		if !hasId || edgeId == "" {
			edgeId = fmt.Sprintf("edge_%d_%d", now.UnixNano(), i)
		}

		originalEdgeId := edgeId

		// Extract source and target
		source, hasSource := edgeMap["source"].(string)
		target, hasTarget := edgeMap["target"].(string)

		if !hasSource || !hasTarget || source == "" || target == "" {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Edge %s missing source or target, skipping", edgeId))
			continue
		}

		// Handle source ID mapping
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

		// Handle target ID mapping
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

		// Handle edge ID conflicts in merge mode
		if strategy == "merge" && existingEdges[edgeId] {
			edgeId = fmt.Sprintf("%s_imported_%d", originalEdgeId, now.Unix())
			response.Conflicts = append(response.Conflicts,
				fmt.Sprintf("Edge %s renamed to %s due to conflict", originalEdgeId, edgeId))
		}

		// Extract handles
		sourceHandle, _ := edgeMap["sourceHandle"].(string)
		targetHandle, _ := edgeMap["targetHandle"].(string)

		// Get relationship from data.type or data.relationship or fallback
		var relationship string
		if dataMap, ok := edgeMap["data"].(map[string]interface{}); ok {
			if dataType, ok := dataMap["type"].(string); ok {
				relationship = dataType
			} else if dataRel, ok := dataMap["relationship"].(string); ok {
				relationship = dataRel
			}
		}
		if relationship == "" {
			if edgeType, ok := edgeMap["type"].(string); ok && edgeType != "mythsmith" {
				relationship = edgeType
			}
		}
		if relationship == "" {
			relationship = "custom"
		}

		// Build properties map - exclude basic edge fields
		basicFields := map[string]bool{
			"id": true, "source": true, "target": true,
			"sourceHandle": true, "targetHandle": true, "type": true,
			"animated": true, "selected": true, // React Flow specific fields
		}

		properties := make(map[string]interface{})

		// Add top-level properties (excluding basic fields)
		for key, value := range edgeMap {
			if !basicFields[key] {
				properties[key] = value
			}
		}

		// Merge data properties if they exist
		if dataMap, ok := edgeMap["data"].(map[string]interface{}); ok {
			for k, v := range dataMap {
				properties[k] = v
			}
		}

		// Add metadata for tracking
		properties["originalId"] = originalEdgeId
		if edgeId != originalEdgeId {
			properties["importedAs"] = edgeId
		}

		// Convert properties to JSON
		propertiesJSON, err := json.Marshal(properties)
		if err != nil {
			return fmt.Errorf("failed to marshal properties for edge %s: %v", edgeId, err)
		}

		// Verify that source and target nodes exist
		var sourceExists, targetExists bool
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM nodes WHERE id = ?)", source).Scan(&sourceExists)
		if err != nil {
			return fmt.Errorf("failed to check source node existence: %v", err)
		}
		err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM nodes WHERE id = ?)", target).Scan(&targetExists)
		if err != nil {
			return fmt.Errorf("failed to check target node existence: %v", err)
		}

		if !sourceExists {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Edge %s references non-existent source node %s, skipping", edgeId, source))
			continue
		}
		if !targetExists {
			response.Warnings = append(response.Warnings,
				fmt.Sprintf("Edge %s references non-existent target node %s, skipping", edgeId, target))
			continue
		}

		// Insert edge
		_, err = tx.Exec(`
            INSERT INTO edges (id, source_node_id, target_node_id, source_handle, target_handle, relationship, properties, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, edgeId, source, target, sourceHandle, targetHandle, relationship, string(propertiesJSON), now)

		if err != nil {
			return fmt.Errorf("failed to insert edge %s: %v", edgeId, err)
		}

		response.EdgesCreated++
	}

	return nil
}

func (h *ImportHandler) clearExistingData(tx *sql.Tx) error {
	// Check and clear edges first (foreign key dependency)
	if err := h.clearTable(tx, "edges"); err != nil {
		return fmt.Errorf("failed to clear edges: %v", err)
	}

	// Then clear nodes
	if err := h.clearTable(tx, "nodes"); err != nil {
		return fmt.Errorf("failed to clear nodes: %v", err)
	}

	return nil
}
