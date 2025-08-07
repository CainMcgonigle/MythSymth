package models

import (
	"time"
)

// NodeType represents the type of a node (e.g., character, faction)
type NodeType string

const (
	NodeTypeCharacter NodeType = "character"
	NodeTypeFaction   NodeType = "faction"
	NodeTypeCity      NodeType = "city"
	NodeTypeEvent     NodeType = "event"
	NodeTypeLocation  NodeType = "location"
)

// ConnectionDirection represents the allowed connection directions for a node
type ConnectionDirection string

const (
	ConnectionDirectionAll        ConnectionDirection = "all"
	ConnectionDirectionVertical   ConnectionDirection = "vertical"
	ConnectionDirectionHorizontal ConnectionDirection = "horizontal"
)

// Node represents a node in the graph, as stored in the database
type Node struct {
	ID                  string              `json:"id"`
	Name                string              `json:"name"`
	Type                NodeType            `json:"type"`
	Description         string              `json:"description"`
	X                   float64             `json:"x"`
	Y                   float64             `json:"y"`
	ConnectionDirection ConnectionDirection `json:"connectionDirection"`
	CreatedAt           time.Time           `json:"createdAt"`
	UpdatedAt           time.Time           `json:"updatedAt"`
}

// ReactFlowNode is a simplified struct for the frontend
type ReactFlowNode struct {
	ID       string `json:"id"`
	Position struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
	Data struct {
		ID                  string              `json:"id"`
		Name                string              `json:"name"`
		Type                NodeType            `json:"type"`
		Description         string              `json:"description"`
		ConnectionDirection ConnectionDirection `json:"connectionDirection"`
	} `json:"data"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToReactFlowNode converts a backend Node to a ReactFlowNode
func (n *Node) ToReactFlowNode() ReactFlowNode {
	return ReactFlowNode{
		ID: n.ID,
		Position: struct {
			X float64 `json:"x"`
			Y float64 `json:"y"`
		}{X: n.X, Y: n.Y},
		Data: struct {
			ID                  string              `json:"id"`
			Name                string              `json:"name"`
			Type                NodeType            `json:"type"`
			Description         string              `json:"description"`
			ConnectionDirection ConnectionDirection `json:"connectionDirection"`
		}{
			ID:                  n.ID,
			Name:                n.Name,
			Type:                n.Type,
			Description:         n.Description,
			ConnectionDirection: n.ConnectionDirection,
		},
		CreatedAt: n.CreatedAt,
		UpdatedAt: n.UpdatedAt,
	}
}

// CreateNodeRequest represents the request body for creating a new node
type CreateNodeRequest struct {
	Name        string   `json:"name" binding:"required"`
	Type        NodeType `json:"type" binding:"required"`
	Description string   `json:"description"`
	Position    struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
	ConnectionDirection ConnectionDirection `json:"connectionDirection"`
}

// UpdateNodeRequest represents the request body for updating an existing node
type UpdateNodeRequest struct {
	Name        *string   `json:"name"`
	Type        *NodeType `json:"type"`
	Description *string   `json:"description"`
	Position    *struct {
		X *float64 `json:"x"`
		Y *float64 `json:"y"`
	} `json:"position"`
	ConnectionDirection *ConnectionDirection `json:"connectionDirection"`
}

// UpdatePositionsRequest represents the request body for updating multiple node positions
type UpdatePositionsRequest struct {
	Nodes []struct {
		ID string  `json:"id"`
		X  float64 `json:"x"`
		Y  float64 `json:"y"`
	} `json:"nodes" binding:"required"`
}

// Edge represents an edge in the graph, as stored in the database
type Edge struct {
	ID           string    `json:"id"`
	SourceNodeID string    `json:"source"`
	TargetNodeID string    `json:"target"`
	SourceHandle string    `json:"sourceHandle"`
	TargetHandle string    `json:"targetHandle"`
	Relationship string    `json:"relationship"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// MapData is the full data structure sent by the frontend for synchronization
type MapData struct {
	Nodes []struct {
		ID       string `json:"id"`
		Position struct {
			X float64 `json:"x"`
			Y float64 `json:"y"`
		} `json:"position"`
		Data struct {
			Name                string              `json:"name"`
			Type                NodeType            `json:"type"`
			Description         string              `json:"description"`
			ConnectionDirection ConnectionDirection `json:"connectionDirection"`
		} `json:"data"`
	} `json:"nodes"`
	Edges []struct {
		ID           string `json:"id"`
		SourceNodeID string `json:"source"`
		TargetNodeID string `json:"target"`
		SourceHandle string `json:"sourceHandle"`
		TargetHandle string `json:"targetHandle"`
		Relationship string `json:"relationship"`
	} `json:"edges"`
}
