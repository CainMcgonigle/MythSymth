// models/map.go
package models

// MapNode represents a node in the map data structure
type MapNode struct {
	ID       string `json:"id"`
	Position struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	} `json:"position"`
	Data map[string]interface{} `json:"data"`
}

// MapData is the full data structure sent by the frontend for synchronization
type MapData struct {
	Nodes []MapNode                `json:"nodes"`
	Edges []map[string]interface{} `json:"edges"`
}
