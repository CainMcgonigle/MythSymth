package handlers

import (
	"mythsmith-backend/database"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine, db *database.DB) {
	// Health check
	r.GET("/health", NewNodeHandler(db).Health())

	// Node routes
	nodeGroup := r.Group("/nodes")
	{
		nodeHandler := NewNodeHandler(db)
		nodeGroup.GET("", nodeHandler.GetNodes)
		nodeGroup.GET("/:id", nodeHandler.GetNode)
		nodeGroup.POST("", nodeHandler.CreateNode)
		nodeGroup.PUT("/:id", nodeHandler.UpdateNode)
		nodeGroup.PUT("/positions", nodeHandler.UpdateNodePositions)
		nodeGroup.DELETE("/:id", nodeHandler.DeleteNode)
	}

	// Edge routes
	edgeGroup := r.Group("/edges")
	{
		edgeHandler := NewEdgeHandler(db)
		edgeGroup.GET("", edgeHandler.GetEdges)
	}

	// Map routes
	mapGroup := r.Group("/map")
	{
		mapHandler := NewMapHandler(db)
		mapGroup.PUT("", mapHandler.SaveMap)
	}

	// Import routes
	importGroup := r.Group("/import")
	{
		importHandler := NewImportHandler(db)
		importGroup.POST("/map", importHandler.ImportMap)
	}
}
