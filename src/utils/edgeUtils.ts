import { Edge, getBezierPath, Position } from "reactflow";
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

export function hexToRgba(hex?: string, alpha = 1, darken = 0): string {
  if (!hex) {
    return `rgba(107, 114, 128, ${alpha})`; // fallback to gray (#6b7280)
  }

  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16) * (1 - darken)}, ${parseInt(result[2], 16) * (1 - darken)}, ${
        parseInt(result[3], 16) * (1 - darken)
      }, ${alpha})`
    : `rgba(107, 114, 128, ${alpha})`; // fallback if invalid hex
}

// Helper function to calculate angle at start/end of Bezier curve
export function calculateBezierAngleAtT(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  t: number
): number {
  const offset = 20;
  let sourceControlX = sourceX;
  let sourceControlY = sourceY;
  let targetControlX = targetX;
  let targetControlY = targetY;

  // Control points based on handle side
  switch (sourcePosition) {
    case Position.Right:
      sourceControlX += offset;
      break;
    case Position.Left:
      sourceControlX -= offset;
      break;
    case Position.Top:
      sourceControlY -= offset;
      break;
    case Position.Bottom:
      sourceControlY += offset;
      break;
  }
  switch (targetPosition) {
    case Position.Right:
      targetControlX += offset;
      break;
    case Position.Left:
      targetControlX -= offset;
      break;
    case Position.Top:
      targetControlY -= offset;
      break;
    case Position.Bottom:
      targetControlY += offset;
      break;
  }

  // Bezier points
  const P0 = { x: sourceX, y: sourceY };
  const P1 = { x: sourceControlX, y: sourceControlY };
  const P2 = { x: targetControlX, y: targetControlY };
  const P3 = { x: targetX, y: targetY };

  // Derivative of cubic Bézier at arbitrary t
  const dx =
    3 * (1 - t) * (1 - t) * (P1.x - P0.x) +
    6 * (1 - t) * t * (P2.x - P1.x) +
    3 * t * t * (P3.x - P2.x);
  const dy =
    3 * (1 - t) * (1 - t) * (P1.y - P0.y) +
    6 * (1 - t) * t * (P2.y - P1.y) +
    3 * t * t * (P3.y - P2.y);

  return Math.atan2(dy, dx) * (180 / Math.PI);
}

// Helper function to calculate a point on a cubic bezier curve
export function getPointOnCubicBezier(
  t: number,
  startX: number,
  startY: number,
  cp1X: number,
  cp1Y: number,
  cp2X: number,
  cp2Y: number,
  endX: number,
  endY: number
): { x: number; y: number } {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * startX + 3 * uu * t * cp1X + 3 * u * tt * cp2X + ttt * endX;
  const y = uuu * startY + 3 * uu * t * cp1Y + 3 * u * tt * cp2Y + ttt * endY;

  return { x, y };
}

// robust number parser (handles negatives/decimals)
const NUM_RE = /-?\d*\.?\d+/g;

// tangent of cubic bezier at t
function getCubicBezierTangent(
  t: number,
  startX: number,
  startY: number,
  cp1X: number,
  cp1Y: number,
  cp2X: number,
  cp2Y: number,
  endX: number,
  endY: number
): { x: number; y: number } {
  const u = 1 - t;
  const dx =
    3 * u * u * (cp1X - startX) +
    6 * u * t * (cp2X - cp1X) +
    3 * t * t * (endX - cp2X);
  const dy =
    3 * u * u * (cp1Y - startY) +
    6 * u * t * (cp2Y - cp1Y) +
    3 * t * t * (endY - cp2Y);
  return { x: dx, y: dy };
}

// NEW: build two parallel-ish curves by offsetting both control points along the normal at mid
export function getBidirectionalPaths(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  offset: number
): [string, string] {
  // get original cubic path
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // parse: M sx,sy C c1x,c1y c2x,c2y ex,ey
  const nums = path.match(NUM_RE);
  if (!nums || nums.length < 8) return [path, path];

  const sx = parseFloat(nums[0]);
  const sy = parseFloat(nums[1]);
  const c1x = parseFloat(nums[2]);
  const c1y = parseFloat(nums[3]);
  const c2x = parseFloat(nums[4]);
  const c2y = parseFloat(nums[5]);
  const ex = parseFloat(nums[6]);
  const ey = parseFloat(nums[7]);

  // normal at midpoint
  const tan = getCubicBezierTangent(0.5, sx, sy, c1x, c1y, c2x, c2y, ex, ey);
  let nx = -tan.y;
  let ny = tan.x;
  let len = Math.hypot(nx, ny);

  // fallback if degenerate
  if (len < 1e-6) {
    nx = -(ey - sy);
    ny = ex - sx;
    len = Math.hypot(nx, ny) || 1;
  }
  nx /= len;
  ny /= len;

  // offset both control points along the same normal
  const ox = nx * offset;
  const oy = ny * offset;

  // upper curve ( +offset )
  const u1x = c1x + ox;
  const u1y = c1y + oy;
  const u2x = c2x + ox;
  const u2y = c2y + oy;

  // lower curve ( -offset )
  const l1x = c1x - ox;
  const l1y = c1y - oy;
  const l2x = c2x - ox;
  const l2y = c2y - oy;

  const upper = `M${sx},${sy} C${u1x},${u1y} ${u2x},${u2y} ${ex},${ey}`;
  const lower = `M${sx},${sy} C${l1x},${l1y} ${l2x},${l2y} ${ex},${ey}`;

  return [upper, lower];
}
