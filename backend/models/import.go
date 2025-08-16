package models

// Add this to your models package (models.go or similar):
type ImportData struct {
	Version    string                   `json:"version"`
	ExportDate string                   `json:"exportDate"`
	Metadata   ImportMetadata           `json:"metadata"`
	Nodes      []ReactFlowNode          `json:"nodes"`
	Edges      []map[string]interface{} `json:"edges"`
}

type ImportMetadata struct {
	NodeCount  int    `json:"nodeCount"`
	EdgeCount  int    `json:"edgeCount"`
	AppVersion string `json:"appVersion,omitempty"`
}
