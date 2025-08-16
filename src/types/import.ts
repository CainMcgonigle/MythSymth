import { Node, Edge } from ".";

export interface ImportRequest {
  strategy: "replace" | "merge";
  data: {
    version: string;
    exportDate: string;
    metadata: {
      nodeCount: number;
      edgeCount: number;
      appVersion?: string;
    };
    nodes: Node[];
    edges: Edge[];
  };
}

export interface ImportResponse {
  message: string;
  nodesCreated: number;
  edgesCreated: number;
  conflicts?: string[];
  warnings?: string[];
}
