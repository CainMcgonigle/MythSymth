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
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  restoreWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  isWindowMaximized(): Promise<boolean>;
  onWindowStateChange(callback: (isMaximized: boolean) => void): void;
  removeWindowStateListener(): void;
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

// Re-export all node types for convenience
export type {
  CharacterNodeData,
  FactionNodeData,
  CityNodeData,
  EventNodeData,
  LocationNodeData,
} from "./nodeTypes";

// Export edge types if you have them
export * from "./edgeTypes";

// Export graph types if you have them
export * from "./graphTypes";

// Additional utility types that might be useful
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

// Toast notification types
export type ToastType = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Filter and search types
export interface FilterOptions {
  nodeTypes: NodeType[];
  searchQuery: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Import/Export types
export interface ExportOptions {
  includeNodes: boolean;
  includeEdges: boolean;
  format: "json" | "csv" | "xml";
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ImportResult {
  success: boolean;
  nodesImported: number;
  edgesImported: number;
  errors: string[];
}

// Analytics types
export interface NodeStatistics {
  totalNodes: number;
  nodesByType: Record<NodeType, number>;
  totalEdges: number;
  averageConnections: number;
  mostConnectedNode?: Node;
}

export interface ConnectionAnalytics {
  totalConnections: number;
  connectionsByType: Record<string, number>;
  strongestConnections: Array<{
    source: Node;
    target: Node;
    strength: number;
  }>;
}

// UI State types
export interface UIState {
  sidebarVisible: boolean;
  analyticsOpen: boolean;
  selectedNodeId: string | null;
  filter: NodeType | "all";
  isLoading: boolean;
  error: string | null;
}

// Theme types
export type Theme = "dark" | "light" | "auto";

export interface ThemeConfig {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
  fontSize: "small" | "medium" | "large";
}

// User preferences
export interface UserPreferences {
  theme: ThemeConfig;
  autoSave: boolean;
  showMinimap: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultNodeType: NodeType;
}

// Error types
export interface APIError {
  message: string;
  code?: string | number;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MythSmithEdgeData {
  customColor: string;
  customIconName: string;
  label?: string;
  type:
    | "friendship"
    | "rivalry"
    | "alliance"
    | "conflict"
    | "location"
    | "event"
    | "family"
    | "trade"
    | "custom";
  strength: "weak" | "moderate" | "strong";
  description?: string;
  bidirectional?: boolean;
  animated?: boolean;
}
