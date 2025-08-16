package handlers

import (
	"encoding/json"
	"mythsmith-backend/database"
	"mythsmith-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type EdgeHandler struct {
	db *database.DB
}

func NewEdgeHandler(db *database.DB) *EdgeHandler {
	return &EdgeHandler{db: db}
}

func (h *EdgeHandler) GetEdges(c *gin.Context) {
	query := `
        SELECT id, source_node_id, target_node_id, source_handle, target_handle, relationship
       , COALESCE(properties, '{}') as properties
       FROM edges
    `
	rows, err := h.db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve edges"})
		return
	}
	defer rows.Close()

	var edges []map[string]interface{}
	for rows.Next() {
		var edge models.Edge
		var propertiesJSON string
		err := rows.Scan(&edge.ID, &edge.SourceNodeID, &edge.TargetNodeID,
			&edge.SourceHandle, &edge.TargetHandle, &edge.Relationship, &propertiesJSON)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan edge data"})
			return
		}

		// Unmarshal properties
		props := make(map[string]interface{})
		if propertiesJSON != "" {
			if err := json.Unmarshal([]byte(propertiesJSON), &props); err != nil {
				props = make(map[string]interface{})
			}
		}

		// Compose full edge map
		edgeMap := map[string]interface{}{
			"id":           edge.ID,
			"source":       edge.SourceNodeID,
			"target":       edge.TargetNodeID,
			"sourceHandle": edge.SourceHandle,
			"targetHandle": edge.TargetHandle,
			"relationship": edge.Relationship,
		}

		// Merge properties into root
		for k, v := range props {
			edgeMap[k] = v
		}
		edges = append(edges, edgeMap)
	}

	c.JSON(http.StatusOK, gin.H{
		"edges": edges,
		"count": len(edges),
	})
}
