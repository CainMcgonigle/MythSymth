package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"mythsmith-backend/database"
	"mythsmith-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type MapHandler struct {
	db *database.DB
}

func NewMapHandler(db *database.DB) *MapHandler {
	return &MapHandler{db: db}
}

func (h *MapHandler) SaveMap(c *gin.Context) {
	var req models.MapData
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get existing node IDs
	existingNodeIDs, err := h.getExistingIDs(tx, "nodes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing node IDs"})
		return
	}

	// Get received node IDs
	receivedNodeIDs := make(map[string]bool)
	for _, node := range req.Nodes {
		receivedNodeIDs[node.ID] = true
	}

	// Delete nodes that weren't sent
	for id := range existingNodeIDs {
		if !receivedNodeIDs[id] {
			if _, err := tx.Exec("DELETE FROM nodes WHERE id = ?", id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old nodes"})
				return
			}
		}
	}

	// Update/insert nodes
	for _, node := range req.Nodes {
		if err := h.upsertNode(tx, node); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Handle edges similarly
	existingEdgeIDs, err := h.getExistingIDs(tx, "edges")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing edge IDs"})
		return
	}

	receivedEdgeIDs := make(map[string]bool)
	for _, edgeMap := range req.Edges {
		edgeID, _ := edgeMap["id"].(string)
		if edgeID != "" {
			receivedEdgeIDs[edgeID] = true
		}

		if err := h.upsertEdge(tx, edgeMap); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// Delete edges that weren't sent
	for id := range existingEdgeIDs {
		if !receivedEdgeIDs[id] {
			if _, err := tx.Exec("DELETE FROM edges WHERE id = ?", id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old edges"})
				return
			}
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Map synchronized successfully"})
}

// Helper methods
func (h *MapHandler) getExistingIDs(tx *sql.Tx, table string) (map[string]bool, error) {
	rows, err := tx.Query(fmt.Sprintf("SELECT id FROM %s", table))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make(map[string]bool)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids[id] = true
	}
	return ids, nil
}

func (h *MapHandler) upsertNode(tx *sql.Tx, node models.MapNode) error {
	// Extract basic fields
	name, _ := node.Data["name"].(string)
	nodeType, _ := node.Data["type"].(string)
	description, _ := node.Data["description"].(string)
	connectionDirection, _ := node.Data["connectionDirection"].(string)

	// Extract extended properties
	basicFields := map[string]bool{
		"id": true, "name": true, "type": true, "description": true, "connectionDirection": true,
	}
	properties := make(map[string]interface{})
	for key, value := range node.Data {
		if !basicFields[key] {
			properties[key] = value
		}
	}

	// Convert properties to JSON
	propertiesJSON, err := json.Marshal(properties)
	if err != nil {
		return fmt.Errorf("failed to marshal properties: %v", err)
	}

	// Update node
	_, err = tx.Exec(
		`UPDATE nodes SET x = ?, y = ?, name = ?, type = ?, description = ?, 
         connection_direction = ?, properties = ?, updated_at = ? WHERE id = ?`,
		node.Position.X, node.Position.Y, name, nodeType, description,
		connectionDirection, string(propertiesJSON), time.Now(), node.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update node: %v", err)
	}

	return nil
}

func (h *MapHandler) upsertEdge(tx *sql.Tx, edgeMap map[string]interface{}) error {
	edgeID, _ := edgeMap["id"].(string)
	source, _ := edgeMap["source"].(string)
	target, _ := edgeMap["target"].(string)
	sourceHandle, _ := edgeMap["sourceHandle"].(string)
	targetHandle, _ := edgeMap["targetHandle"].(string)
	relationship, _ := edgeMap["relationship"].(string)

	// Extract properties
	basicFields := map[string]bool{
		"id": true, "source": true, "target": true, "sourceHandle": true,
		"targetHandle": true, "relationship": true, "data": true,
	}
	properties := make(map[string]interface{})
	for key, value := range edgeMap {
		if !basicFields[key] {
			properties[key] = value
		}
	}

	// Merge edge.data fields into properties
	if dataMap, ok := edgeMap["data"].(map[string]interface{}); ok {
		for k, v := range dataMap {
			properties[k] = v
		}
	}

	propertiesJSON, err := json.Marshal(properties)
	if err != nil {
		return fmt.Errorf("failed to marshal properties: %v", err)
	}

	if edgeID == "" {
		// Create new edge with a generated ID
		edgeID = fmt.Sprintf("edge_%d", time.Now().UnixNano())
		_, err = tx.Exec(
			`INSERT INTO edges (id, source_node_id, target_node_id, source_handle, 
             target_handle, relationship, properties, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			edgeID, source, target, sourceHandle, targetHandle, relationship,
			string(propertiesJSON), time.Now(),
		)
	} else {
		// Update existing edge
		_, err = tx.Exec(
			`UPDATE edges SET source_node_id = ?, target_node_id = ?, 
             source_handle = ?, target_handle = ?, relationship = ?, 
             properties = ? WHERE id = ?`,
			source, target, sourceHandle, targetHandle, relationship,
			string(propertiesJSON), edgeID,
		)
	}

	if err != nil {
		return fmt.Errorf("failed to upsert edge: %v", err)
	}

	return nil
}
