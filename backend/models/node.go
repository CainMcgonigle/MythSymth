package models

import (
	"encoding/json"
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

// ExtendedProperties holds type-specific properties
type ExtendedProperties map[string]interface{}

// Node represents a node in the graph, as stored in the database
type Node struct {
	ID                  string              `json:"id"`
	Name                string              `json:"name"`
	Type                NodeType            `json:"type"`
	Description         string              `json:"description"`
	X                   float64             `json:"x"`
	Y                   float64             `json:"y"`
	ConnectionDirection ConnectionDirection `json:"connectionDirection"`
	Properties          ExtendedProperties  `json:"properties"`
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
		// Include all extended properties at the root level of Data
		Properties map[string]interface{} `json:"-"` // This will be flattened
	} `json:"data"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToReactFlowNode converts a backend Node to a ReactFlowNode
func (n *Node) ToReactFlowNode() ReactFlowNode {
	reactFlowNode := ReactFlowNode{
		ID: n.ID,
		Position: struct {
			X float64 `json:"x"`
			Y float64 `json:"y"`
		}{X: n.X, Y: n.Y},
		Data: struct {
			ID                  string                 `json:"id"`
			Name                string                 `json:"name"`
			Type                NodeType               `json:"type"`
			Description         string                 `json:"description"`
			ConnectionDirection ConnectionDirection    `json:"connectionDirection"`
			Properties          map[string]interface{} `json:"-"`
		}{
			ID:                  n.ID,
			Name:                n.Name,
			Type:                n.Type,
			Description:         n.Description,
			ConnectionDirection: n.ConnectionDirection,
			Properties:          n.Properties,
		},
		CreatedAt: n.CreatedAt,
		UpdatedAt: n.UpdatedAt,
	}

	return reactFlowNode
}

// MarshalJSON custom marshaling to flatten properties into data
func (rfn ReactFlowNode) MarshalJSON() ([]byte, error) {
	// Create a temporary struct for marshaling
	temp := struct {
		ID       string `json:"id"`
		Position struct {
			X float64 `json:"x"`
			Y float64 `json:"y"`
		} `json:"position"`
		Data      map[string]interface{} `json:"data"`
		CreatedAt time.Time              `json:"createdAt"`
		UpdatedAt time.Time              `json:"updated_at"`
	}{
		ID:        rfn.ID,
		Position:  rfn.Position,
		CreatedAt: rfn.CreatedAt,
		UpdatedAt: rfn.UpdatedAt,
		Data:      make(map[string]interface{}),
	}

	// Add basic data fields
	temp.Data["id"] = rfn.Data.ID
	temp.Data["name"] = rfn.Data.Name
	temp.Data["type"] = rfn.Data.Type
	temp.Data["description"] = rfn.Data.Description
	temp.Data["connectionDirection"] = rfn.Data.ConnectionDirection

	// Add extended properties
	for key, value := range rfn.Data.Properties {
		temp.Data[key] = value
	}

	return json.Marshal(temp)
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
	ConnectionDirection ConnectionDirection    `json:"connectionDirection"`
	Properties          map[string]interface{} `json:"-"` // Will be extracted from other fields
}

// UnmarshalJSON custom unmarshaling to extract extended properties
func (cnr *CreateNodeRequest) UnmarshalJSON(data []byte) error {
	// First unmarshal into a temporary map
	var temp map[string]interface{}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}

	// Extract basic fields
	if name, ok := temp["name"].(string); ok {
		cnr.Name = name
	}
	if nodeType, ok := temp["type"].(string); ok {
		cnr.Type = NodeType(nodeType)
	}
	if description, ok := temp["description"].(string); ok {
		cnr.Description = description
	}
	if connDir, ok := temp["connectionDirection"].(string); ok {
		cnr.ConnectionDirection = ConnectionDirection(connDir)
	}

	// Handle position
	if positionData, ok := temp["position"].(map[string]interface{}); ok {
		if x, ok := positionData["x"].(float64); ok {
			cnr.Position.X = x
		}
		if y, ok := positionData["y"].(float64); ok {
			cnr.Position.Y = y
		}
	}

	// Extract extended properties (everything else)
	basicFields := map[string]bool{
		"name": true, "type": true, "description": true,
		"connectionDirection": true, "position": true, "id": true,
	}

	cnr.Properties = make(map[string]interface{})
	for key, value := range temp {
		if !basicFields[key] {
			cnr.Properties[key] = value
		}
	}

	return nil
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
	ConnectionDirection *ConnectionDirection   `json:"connectionDirection"`
	Properties          map[string]interface{} `json:"-"` // Will be extracted from other fields
}

// UnmarshalJSON custom unmarshaling for UpdateNodeRequest
func (unr *UpdateNodeRequest) UnmarshalJSON(data []byte) error {
	// First unmarshal into a temporary map
	var temp map[string]interface{}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}

	// Extract basic fields (only if present)
	if name, ok := temp["name"].(string); ok {
		unr.Name = &name
	}
	if nodeType, ok := temp["type"].(string); ok {
		nt := NodeType(nodeType)
		unr.Type = &nt
	}
	if description, ok := temp["description"].(string); ok {
		unr.Description = &description
	}
	if connDir, ok := temp["connectionDirection"].(string); ok {
		cd := ConnectionDirection(connDir)
		unr.ConnectionDirection = &cd
	}

	// Handle position
	if positionData, ok := temp["position"].(map[string]interface{}); ok {
		unr.Position = &struct {
			X *float64 `json:"x"`
			Y *float64 `json:"y"`
		}{}
		if x, ok := positionData["x"].(float64); ok {
			unr.Position.X = &x
		}
		if y, ok := positionData["y"].(float64); ok {
			unr.Position.Y = &y
		}
	}

	// Extract extended properties (everything else)
	basicFields := map[string]bool{
		"name": true, "type": true, "description": true,
		"connectionDirection": true, "position": true, "id": true,
	}

	unr.Properties = make(map[string]interface{})
	for key, value := range temp {
		if !basicFields[key] {
			unr.Properties[key] = value
		}
	}

	return nil
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
	ID           string                 `json:"id"`
	SourceNodeID string                 `json:"source"`
	TargetNodeID string                 `json:"target"`
	SourceHandle string                 `json:"sourceHandle"`
	TargetHandle string                 `json:"targetHandle"`
	Relationship string                 `json:"relationship"`
	Properties   map[string]interface{} `json:"properties"`
	CreatedAt    time.Time              `json:"createdAt"`
	UpdatedAt    time.Time              `json:"updatedAt"`
}

// Custom marshal to flatten properties at the root level
func (e Edge) MarshalJSON() ([]byte, error) {
	type Alias Edge
	m := map[string]interface{}{
		"id":           e.ID,
		"source":       e.SourceNodeID,
		"target":       e.TargetNodeID,
		"sourceHandle": e.SourceHandle,
		"targetHandle": e.TargetHandle,
		"relationship": e.Relationship,
		"createdAt":    e.CreatedAt,
		"updatedAt":    e.UpdatedAt,
	}
	for k, v := range e.Properties {
		m[k] = v
	}
	return json.Marshal(m)
}

// Custom unmarshal to extract extra properties
func (e *Edge) UnmarshalJSON(data []byte) error {
	type Alias Edge
	var alias Alias
	if err := json.Unmarshal(data, &alias); err != nil {
		return err
	}
	*e = Edge(alias)
	// Now extract extra fields
	var temp map[string]interface{}
	if err := json.Unmarshal(data, &temp); err != nil {
		return err
	}
	basic := map[string]bool{
		"id": true, "source": true, "target": true, "sourceHandle": true, "targetHandle": true, "relationship": true, "createdAt": true, "updatedAt": true,
	}
	e.Properties = make(map[string]interface{})
	for k, v := range temp {
		if !basic[k] {
			e.Properties[k] = v
		}
	}
	return nil
}
