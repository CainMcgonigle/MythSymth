package main

import (
    "log"

    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"

    "mythsmith-backend/database"
    "mythsmith-backend/handlers"
)

func main() {
    r := gin.Default()
    r.Use(cors.Default())

    db, err := database.InitDB("data/mythsmith.db")
    if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }

    handlers.SetupRoutes(r, db)

    r.Run(":8080")
}
