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
	"github.com/google/uuid"
)

type NodeHandler struct {
	db *database.DB
}

func NewNodeHandler(db *database.DB) *NodeHandler {
	return &NodeHandler{db: db}
}

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

func (h *NodeHandler) GetNodes(c *gin.Context) {
	nodeType := c.Query("type")
	query := `
        SELECT id, name, type, description, x, y, connection_direction, 
               COALESCE(properties, '{}') as properties, created_at, updated_at
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

	var nodes []models.Node
	for rows.Next() {
		var node models.Node
		var propertiesJSON string
		err := rows.Scan(
			&node.ID, &node.Name, &node.Type, &node.Description,
			&node.X, &node.Y, &node.ConnectionDirection, &propertiesJSON,
			&node.CreatedAt, &node.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan node data"})
			return
		}

		// Parse JSON properties
		if propertiesJSON != "" {
			if err := json.Unmarshal([]byte(propertiesJSON), &node.Properties); err != nil {
				node.Properties = make(models.ExtendedProperties)
			}
		} else {
			node.Properties = make(models.ExtendedProperties)
		}

		nodes = append(nodes, node)
	}

	// Convert to ReactFlow format
	reactFlowNodes := make([]models.ReactFlowNode, len(nodes))
	for i, node := range nodes {
		reactFlowNodes[i] = node.ToReactFlowNode()
	}

	c.JSON(http.StatusOK, gin.H{
		"nodes": reactFlowNodes,
		"count": len(reactFlowNodes),
	})
}

func (h *NodeHandler) GetNode(c *gin.Context) {
	id := c.Param("id")

	var node models.Node
	var propertiesJSON string
	query := `
		SELECT id, name, type, description, x, y, connection_direction, 
			   COALESCE(properties, '{}') as properties, created_at, updated_at
		FROM nodes
		WHERE id = ?
	`
	err := h.db.QueryRow(query, id).Scan(
		&node.ID, &node.Name, &node.Type, &node.Description,
		&node.X, &node.Y, &node.ConnectionDirection, &propertiesJSON,
		&node.CreatedAt, &node.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve node"})
		}
		return
	}

	// Parse JSON properties
	if propertiesJSON != "" {
		if err := json.Unmarshal([]byte(propertiesJSON), &node.Properties); err != nil {
			node.Properties = make(models.ExtendedProperties)
		}
	} else {
		node.Properties = make(models.ExtendedProperties)
	}

	c.JSON(http.StatusOK, node.ToReactFlowNode())
}

func (h *NodeHandler) CreateNode(c *gin.Context) {
	var req models.CreateNodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.ConnectionDirection == "" {
		req.ConnectionDirection = models.ConnectionDirectionAll
	}

	id := uuid.NewString()
	now := time.Now()

	// Convert properties to JSON
	propertiesJSON, err := json.Marshal(req.Properties)
	if err != nil {
		propertiesJSON = []byte("{}")
	}

	query := `
		INSERT INTO nodes (id, name, type, description, x, y, connection_direction, properties, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = h.db.Exec(query, id, req.Name, req.Type, req.Description,
		req.Position.X, req.Position.Y, req.ConnectionDirection,
		string(propertiesJSON), now, now)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create node"})
		return
	}

	node := models.Node{
		ID:                  id,
		Name:                req.Name,
		Type:                req.Type,
		Description:         req.Description,
		X:                   req.Position.X,
		Y:                   req.Position.Y,
		ConnectionDirection: req.ConnectionDirection,
		Properties:          req.Properties,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	c.JSON(http.StatusCreated, node.ToReactFlowNode())
}

func (h *NodeHandler) UpdateNode(c *gin.Context) {
	id := c.Param("id")

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

	// Handle properties update
	if len(req.Properties) > 0 {
		// Get current properties first, then merge
		var currentPropertiesJSON string
		getCurrentQuery := "SELECT COALESCE(properties, '{}') FROM nodes WHERE id = ?"
		err := h.db.QueryRow(getCurrentQuery, id).Scan(&currentPropertiesJSON)
		if err != nil && err != sql.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get current properties"})
			return
		}

		// Parse current properties
		var currentProperties models.ExtendedProperties
		if currentPropertiesJSON != "" {
			json.Unmarshal([]byte(currentPropertiesJSON), &currentProperties)
		}
		if currentProperties == nil {
			currentProperties = make(models.ExtendedProperties)
		}

		// Merge with new properties
		for key, value := range req.Properties {
			currentProperties[key] = value
		}

		// Convert back to JSON
		propertiesJSON, err := json.Marshal(currentProperties)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal properties"})
			return
		}

		setParts = append(setParts, "properties = ?")
		args = append(args, string(propertiesJSON))
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
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

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

func (h *NodeHandler) DeleteNode(c *gin.Context) {
	id := c.Param("id")

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
