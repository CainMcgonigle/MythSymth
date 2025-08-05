package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

// InitDB initializes the SQLite database with required tables
func InitDB(dbPath string) (*DB, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	// Create tables
	if err := createTables(db); err != nil {
		return nil, err
	}

	log.Printf("Database initialized at: %s", dbPath)
	return &DB{db}, nil
}

func createTables(db *sql.DB) error {
	// Create nodes table
	nodesTable := `
    CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT DEFAULT '',
        x REAL DEFAULT 0,
        y REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`

	if _, err := db.Exec(nodesTable); err != nil {
		return err
	}

	// Create edges table for future relationship features
	edgesTable := `
	CREATE TABLE IF NOT EXISTS edges (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		source_node_id INTEGER NOT NULL,
		target_node_id INTEGER NOT NULL,
		source_handle TEXT,
		target_handle TEXT,
		relationship TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
		FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE
	);`

	if _, err := db.Exec(edgesTable); err != nil {
		return err
	}

	// Create indices for better performance
	indices := []string{
		"CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);",
		"CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_node_id);",
		"CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_node_id);",
	}

	for _, index := range indices {
		if _, err := db.Exec(index); err != nil {
			return err
		}
	}

	return nil
}
