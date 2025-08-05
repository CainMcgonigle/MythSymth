package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"mythsmith-backend/database"
	"mythsmith-backend/models"

	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all routes for node-related operations
func SetupRoutes(r *gin.Engine, db *database.DB) {
	h := NewNodeHandler(db)

	r.GET("/health", h.Health())
	r.GET("/nodes", h.GetNodes)
	r.GET("/nodes/:id", h.GetNode)
	r.POST("/nodes", h.CreateNode)
	r.PUT("/nodes/:id", h.UpdateNode)
	r.PUT("/nodes/positions", h.UpdateNodePositions)
	r.DELETE("/nodes/:id", h.DeleteNode)

	r.GET("/edges", h.GetEdges)
	r.PUT("/map", h.SaveMap)
}

// NodeHandler holds the database instance
type NodeHandler struct {
	db *database.DB
}

// NewNodeHandler returns a NodeHandler instance
func NewNodeHandler(db *database.DB) *NodeHandler {
	return &NodeHandler{db: db}
}

// Health returns a gin.HandlerFunc that checks the health of the application, including database connectivity.
func (h *NodeHandler) Health() gin.HandlerFunc {
	return func(c *gin.Context) {
		err := h.db.DB.Ping()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":    "unhealthy",
				"message":   fmt.Sprintf("Database connection failed: %v", err),
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"message":   "Application and database are healthy",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
}

// GetNodes retrieves all nodes, optionally filtered by type
func (h *NodeHandler) GetNodes(c *gin.Context) {
	nodeType := c.Query("type")

	query := `
        SELECT id, name, type, description, x, y, connection_direction, created_at, updated_at
        FROM nodes
    `
	args := []interface{}{}

	if nodeType != "" {
		query += " WHERE type = ?"
		args = append(args, nodeType)
	}

	query += " ORDER BY created_at DESC"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve nodes"})
		return
	}
	defer rows.Close()

	var reactFlowNodes []models.ReactFlowNode
	for rows.Next() {
		var node models.Node
		err := rows.Scan(
			&node.ID, &node.Name, &node.Type, &node.Description,
			&node.X, &node.Y, &node.ConnectionDirection, &node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan node data"})
			return
		}
		reactFlowNodes = append(reactFlowNodes, node.ToReactFlowNode())
	}

	c.JSON(http.StatusOK, gin.H{
		"nodes": reactFlowNodes,
		"count": len(reactFlowNodes),
	})
}

// GetNode retrieves a single node by ID
func (h *NodeHandler) GetNode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	var node models.Node
	query := `
        SELECT id, name, type, description, x, y, connection_direction, created_at, updated_at
        FROM nodes
        WHERE id = ?
    `
	err = h.db.QueryRow(query, id).Scan(
		&node.ID, &node.Name, &node.Type, &node.Description,
		&node.X, &node.Y, &node.ConnectionDirection, &node.CreatedAt, &node.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve node"})
		}
		return
	}

	c.JSON(http.StatusOK, node.ToReactFlowNode())
}

// CreateNode creates a new node
func (h *NodeHandler) CreateNode(c *gin.Context) {
	var req models.CreateNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ConnectionDirection == "" {
		req.ConnectionDirection = models.ConnectionDirectionAll
	}

	now := time.Now()
	query := `
        INSERT INTO nodes (name, type, description, x, y, connection_direction, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
	result, err := h.db.Exec(query, req.Name, req.Type, req.Description, req.Position.X, req.Position.Y, req.ConnectionDirection, now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create node"})
		return
	}

	id, _ := result.LastInsertId()
	node := models.Node{
		ID:                  int(id),
		Name:                req.Name,
		Type:                req.Type,
		Description:         req.Description,
		X:                   req.Position.X,
		Y:                   req.Position.Y,
		ConnectionDirection: req.ConnectionDirection,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	c.JSON(http.StatusCreated, node.ToReactFlowNode())
}

// UpdateNode updates an existing node
func (h *NodeHandler) UpdateNode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	var req models.UpdateNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setParts := []string{"updated_at = ?"}
	args := []interface{}{time.Now()}

	if req.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *req.Name)
	}
	if req.Type != nil {
		setParts = append(setParts, "type = ?")
		args = append(args, *req.Type)
	}
	if req.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *req.Description)
	}
	if req.ConnectionDirection != nil {
		setParts = append(setParts, "connection_direction = ?")
		args = append(args, *req.ConnectionDirection)
	}
	if req.Position != nil {
		if req.Position.X != nil {
			setParts = append(setParts, "x = ?")
			args = append(args, *req.Position.X)
		}
		if req.Position.Y != nil {
			setParts = append(setParts, "y = ?")
			args = append(args, *req.Position.Y)
		}
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE nodes SET %s WHERE id = ?", strings.Join(setParts, ", "))

	result, err := h.db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update node"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		return
	}

	h.GetNode(c)
}

// UpdateNodePositions batch updates positions of nodes
func (h *NodeHandler) UpdateNodePositions(c *gin.Context) {
	var req models.UpdatePositionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("UPDATE nodes SET x = ?, y = ?, updated_at = ? WHERE id = ?")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to prepare statement"})
		return
	}
	defer stmt.Close()

	now := time.Now()
	for _, pos := range req.Nodes {
		_, err := stmt.Exec(pos.X, pos.Y, now, pos.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update position"})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Node positions updated successfully",
		"updated": len(req.Nodes),
	})
}

// DeleteNode deletes a node by ID
func (h *NodeHandler) DeleteNode(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid node ID"})
		return
	}

	result, err := h.db.Exec("DELETE FROM nodes WHERE id = ?", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete node"})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Node deleted successfully"})
}

// GetEdges retrieves all edges
func (h *NodeHandler) GetEdges(c *gin.Context) {
	query := `
        SELECT id, source_node_id, target_node_id, source_handle, target_handle, relationship
        FROM edges
    `
	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve edges"})
		return
	}
	defer rows.Close()

	var edges []models.Edge
	for rows.Next() {
		var edge models.Edge
		// Scan the new columns into the Edge struct
		err := rows.Scan(&edge.ID, &edge.SourceNodeID, &edge.TargetNodeID, &edge.SourceHandle, &edge.TargetHandle, &edge.Relationship)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan edge data"})
			return
		}
		edges = append(edges, edge)
	}

	c.JSON(http.StatusOK, gin.H{
		"edges": edges,
		"count": len(edges),
	})
}

// SaveMap synchronizes all nodes and edges with the database
func (h *NodeHandler) SaveMap(c *gin.Context) {
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
	defer tx.Rollback()

	// Nodes Synchronization (This section looks correct and doesn't need changes)
	var existingNodeIDs []int
	rows, err := tx.Query("SELECT id FROM nodes")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing node IDs"})
		return
	}
	for rows.Next() {
		var id int
		rows.Scan(&id)
		existingNodeIDs = append(existingNodeIDs, id)
	}
	rows.Close()

	var receivedNodeIDs = make(map[int]bool)
	for _, node := range req.Nodes {
		receivedNodeIDs[node.ID] = true
	}

	for _, id := range existingNodeIDs {
		if !receivedNodeIDs[id] {
			if _, err := tx.Exec("DELETE FROM nodes WHERE id = ?", id); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old nodes"})
				return
			}
		}
	}

	// Now update nodes with the correctly bound data
	for _, node := range req.Nodes {
		if _, err := tx.Exec(
			`UPDATE nodes SET x = ?, y = ?, name = ?, type = ?, description = ?, connection_direction = ?, updated_at = ? WHERE id = ?`,
			node.Position.X, node.Position.Y, node.Data.Name, node.Data.Type, node.Data.Description, node.Data.ConnectionDirection, time.Now(), node.ID,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update node data"})
			return
		}
	}

	// Edges Synchronization
	var existingEdgeIDs = make(map[int]bool)
	rows, err = tx.Query("SELECT id FROM edges")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get existing edge IDs"})
		return
	}
	for rows.Next() {
		var id int
		rows.Scan(&id)
		existingEdgeIDs[id] = true
	}
	rows.Close()

	var receivedEdgeIDs = make(map[int]bool)
	now := time.Now()
	for _, edge := range req.Edges {
		id, err := strconv.Atoi(edge.ID)
		if err != nil { // This is a new edge
			relationship := edge.Relationship
			if relationship == "" {
				relationship = ""
			}
			if _, err := tx.Exec(
				// Insert the new handle data
				`INSERT INTO edges (source_node_id, target_node_id, source_handle, target_handle, relationship, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
				edge.SourceNodeID, edge.TargetNodeID, edge.SourceHandle, edge.TargetHandle, relationship, now,
			); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create new edge: %v", err)})
				return
			}
		} else { // Existing edge, no update logic needed here for now
			receivedEdgeIDs[id] = true
		}
	}

	// Delete edges from the database that were not in the received list
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
