package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

// InitDB initializes the SQLite database with required tables
func InitDB(dbPath string) (*DB, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Create tables
	if err := createTables(db); err != nil {
		return nil, fmt.Errorf("failed to create tables: %v", err)
	}

	log.Printf("Database initialized at: %s", dbPath)
	return &DB{db}, nil
}

func createTables(db *sql.DB) error {
	// Create nodes table with TEXT column for extended properties
	nodesTable := `
        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT DEFAULT '',
            x REAL DEFAULT 0,
            y REAL DEFAULT 0,
            connection_direction TEXT DEFAULT 'all',
            properties TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`
	if _, err := db.Exec(nodesTable); err != nil {
		return fmt.Errorf("failed to create nodes table: %v", err)
	}

	// Add the properties column to existing tables (migration)
	// This will fail silently if the column already exists
	if _, err := db.Exec("ALTER TABLE nodes ADD COLUMN properties TEXT DEFAULT '{}'"); err != nil {
		// Check if the error is because the column already exists
		if !isDuplicateColumnError(err) {
			return fmt.Errorf("failed to add properties column: %v", err)
		}
	}

	// Create edges table for relationship features
	edgesTable := `
        CREATE TABLE IF NOT EXISTS edges (
            id TEXT PRIMARY KEY,
            source_node_id TEXT NOT NULL,
            target_node_id TEXT NOT NULL,
            source_handle TEXT,
            target_handle TEXT,
            relationship TEXT,
            properties TEXT DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
            FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
        );`
	if _, err := db.Exec(edgesTable); err != nil {
		return fmt.Errorf("failed to create edges table: %v", err)
	}

	// Add the properties column to edges table if it doesn't exist
	if _, err := db.Exec("ALTER TABLE edges ADD COLUMN properties TEXT DEFAULT '{}'"); err != nil {
		if !isDuplicateColumnError(err) {
			return fmt.Errorf("failed to add properties column to edges: %v", err)
		}
	}

	// Create indices for better performance
	indices := []string{
		"CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);",
		"CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_node_id);",
		"CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_node_id);",
		"CREATE INDEX IF NOT EXISTS idx_edges_relationship ON edges(relationship);",
	}

	for _, index := range indices {
		if _, err := db.Exec(index); err != nil {
			return fmt.Errorf("failed to create index: %v", err)
		}
	}

	// Create trigger to automatically update updated_at timestamp
	trigger := `
        CREATE TRIGGER IF NOT EXISTS update_nodes_timestamp 
        AFTER UPDATE ON nodes
        FOR EACH ROW
        BEGIN
            UPDATE nodes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;`
	if _, err := db.Exec(trigger); err != nil {
		return fmt.Errorf("failed to create update trigger: %v", err)
	}

	return nil
}

// isDuplicateColumnError checks if the error is due to a duplicate column
func isDuplicateColumnError(err error) bool {
	return err != nil && (err.Error() == "duplicate column name: properties" ||
		err.Error() == "SQL logic error: duplicate column name: properties (1)")
}

// Begin starts a transaction
func (db *DB) Begin() (*sql.Tx, error) {
	return db.DB.Begin()
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}

// GetStats returns database statistics
func (db *DB) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Get node count
	var nodeCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM nodes").Scan(&nodeCount); err != nil {
		return nil, fmt.Errorf("failed to get node count: %v", err)
	}
	stats["nodeCount"] = nodeCount

	// Get edge count
	var edgeCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM edges").Scan(&edgeCount); err != nil {
		return nil, fmt.Errorf("failed to get edge count: %v", err)
	}
	stats["edgeCount"] = edgeCount

	// Get database size
	var pageSize, pageCount int
	if err := db.QueryRow("PRAGMA page_size").Scan(&pageSize); err != nil {
		return nil, fmt.Errorf("failed to get page size: %v", err)
	}
	if err := db.QueryRow("PRAGMA page_count").Scan(&pageCount); err != nil {
		return nil, fmt.Errorf("failed to get page count: %v", err)
	}
	stats["sizeBytes"] = pageSize * pageCount

	return stats, nil
}

// Health checks the database connection
func (db *DB) Health() error {
	if err := db.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %v", err)
	}

	// Simple query to verify database is readable
	var now time.Time
	if err := db.QueryRow("SELECT CURRENT_TIMESTAMP").Scan(&now); err != nil {
		return fmt.Errorf("database query failed: %v", err)
	}

	return nil
}
