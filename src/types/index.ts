import {
  CharacterNodeData,
  FactionNodeData,
  CityNodeData,
  EventNodeData,
  LocationNodeData,
} from "./nodeTypes";

export type ExtendedNodeData =
  | CharacterNodeData
  | FactionNodeData
  | CityNodeData
  | EventNodeData
  | LocationNodeData;

export type NodeType = "character" | "faction" | "city" | "event" | "location";
export type ConnectionDirection = "vertical" | "horizontal" | "all";

export interface NodeData {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  connectionDirection?: ConnectionDirection;
}

export interface Node {
  id: string;
  position: { x: number; y: number };
  data: ExtendedNodeData;
  createdAt?: string;
  updatedAt?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MapData {
  nodes: Array<Partial<Node>>;
  edges: Array<Partial<Edge>>;
}

export interface CreateNodeRequest {
  id?: string;
  name: string;
  type: NodeType;
  description?: string;
  position?: { x: number; y: number };
  connectionDirection?: ConnectionDirection | "all";
}

export interface UpdateNodeRequest {
  name?: string;
  type?: NodeType;
  description?: string;
  position?: { x: number; y: number };
  connectionDirection?: ConnectionDirection;
}

export interface ApiResponse<T> {
  nodes?: T[];
  edges?: T[];
  count?: number;
  message?: string;
}

export interface ElectronAPI {
  getBackendUrl(): Promise<string>;
  getBackendStatus(): Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export interface NodeFormProps {
  data: CreateNodeRequest;
  setData: React.Dispatch<React.SetStateAction<CreateNodeRequest>>;
}
