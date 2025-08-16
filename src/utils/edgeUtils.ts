import { Edge } from "reactflow";
import {
  ConnectionType,
  ConnectionStrength,
  EdgeData,
  CONNECTION_TYPE_CONFIGS,
} from "../types/edgeTypes";

export const createEdgeData = (
  type: ConnectionType,
  options: Partial<EdgeData> = {}
): EdgeData => {
  const config = CONNECTION_TYPE_CONFIGS[type];

  return {
    type,
    strength: options.strength || config.defaultStrength,
    bidirectional: options.bidirectional || false,
    animated: options.animated || false,
    label: options.label,
    description: options.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...options,
  };
};

export const getEdgeStyle = (data: EdgeData) => {
  const config = CONNECTION_TYPE_CONFIGS[data.type];
  const strengthWidths = { weak: 2, moderate: 3, strong: 4 };

  return {
    stroke: config.color,
    strokeWidth: strengthWidths[data.strength],
    strokeDasharray:
      data.type === "rivalry" || data.type === "conflict" ? "5,5" : undefined,
  };
};

export const validateEdgeConnection = (
  sourceType: string,
  targetType: string,
  connectionType: ConnectionType
): boolean => {
  const config = CONNECTION_TYPE_CONFIGS[connectionType];

  if (!config.allowedSourceTypes || !config.allowedTargetTypes) {
    return true; 
  }

  return (
    config.allowedSourceTypes.includes(sourceType) &&
    config.allowedTargetTypes.includes(targetType)
  );
};

export const getAvailableConnectionTypes = (
  sourceType: string,
  targetType: string
): ConnectionType[] => {
  return Object.keys(CONNECTION_TYPE_CONFIGS).filter((type) =>
    validateEdgeConnection(sourceType, targetType, type as ConnectionType)
  ) as ConnectionType[];
};

export const formatEdgeLabel = (data: EdgeData): string => {
  if (data.label) return data.label;

  const config = CONNECTION_TYPE_CONFIGS[data.type];
  return `${config.icon} ${config.label}`;
};


export interface EdgeAnalytics {
  totalEdges: number;
  edgesByType: Record<ConnectionType, number>;
  edgesByStrength: Record<ConnectionStrength, number>;
  bidirectionalCount: number;
  animatedCount: number;
  mostConnectedNodes: Array<{ nodeId: string; connectionCount: number }>;
  connectionMatrix: Record<string, Record<string, number>>;
}

export const analyzeEdges = (edges: Edge[], nodes: any[]): EdgeAnalytics => {
  const analytics: EdgeAnalytics = {
    totalEdges: edges.length,
    edgesByType: {} as Record<ConnectionType, number>,
    edgesByStrength: {} as Record<ConnectionStrength, number>,
    bidirectionalCount: 0,
    animatedCount: 0,
    mostConnectedNodes: [],
    connectionMatrix: {},
  };

  
  Object.keys(CONNECTION_TYPE_CONFIGS).forEach((type) => {
    analytics.edgesByType[type as ConnectionType] = 0;
  });

  ["weak", "moderate", "strong"].forEach((strength) => {
    analytics.edgesByStrength[strength as ConnectionStrength] = 0;
  });

  
  nodes.forEach((node) => {
    analytics.connectionMatrix[node.data.type] = {};
    nodes.forEach((targetNode) => {
      analytics.connectionMatrix[node.data.type][targetNode.data.type] = 0;
    });
  });

  
  const nodeConnections: Record<string, number> = {};

  edges.forEach((edge) => {
    const data = edge.data as EdgeData;

    if (data) {
      
      analytics.edgesByType[data.type]++;

      
      analytics.edgesByStrength[data.strength]++;

      
      if (data.bidirectional) {
        analytics.bidirectionalCount++;
      }

      
      if (data.animated) {
        analytics.animatedCount++;
      }
    }

    
    nodeConnections[edge.source] = (nodeConnections[edge.source] || 0) + 1;
    nodeConnections[edge.target] = (nodeConnections[edge.target] || 0) + 1;

    
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (sourceNode && targetNode) {
      analytics.connectionMatrix[sourceNode.data.type][targetNode.data.type]++;
    }
  });

  
  analytics.mostConnectedNodes = Object.entries(nodeConnections)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nodeId, count]) => ({ nodeId, connectionCount: count }));

  return analytics;
};
