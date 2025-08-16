import { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import { Node, CreateNodeRequest, UpdateNodeRequest, Edge } from "@/types";

export interface PendingChanges {
  newNodes: string[];
  updatedNodes: string[];
  deletedNodes: string[];
  newEdges: string[];
  updatedEdges: string[];
  deletedEdges: string[];
}

export interface WorldGraphProps {
  onNodeSelect?: (node: Node | null) => void;
  onNodesUpdated?: (nodes: Node[]) => void;
  onEdgesUpdated?: (edges: Edge[]) => void;
}

export interface WorldGraphRef {
  addNode: (nodeData: CreateNodeRequest) => Promise<FlowNode>;
  deleteNode: (nodeId: string) => Promise<void>;
  loadNodes: () => Promise<void>;
  updateNode: (nodeId: string, updates: UpdateNodeRequest) => Promise<Node>;
  saveMap: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
  undo: () => void;
  redo: () => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
  getAutoSaveEnabled: () => boolean;
  getAutoSaveInterval: () => number;
}

export type CreateNodeMutationVariables = CreateNodeRequest & {
  tempId: string;
};
export type HistoryState = { nodes: FlowNode[]; edges: FlowEdge[] }[];
