import React, { useState, useRef } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeProps,
  EdgeLabelRenderer,
  useReactFlow,
  Position,
} from "reactflow";
import { Edit, Trash2, FastForward, SquarePause } from "lucide-react";
import ConnectionModal from "../ConnectionModal";
import { createPortal } from "react-dom";

function hexToRgba(hex: string, opacity: number): string {
  let r = 0,
    g = 0,
    b = 0;
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Helper function to calculate angle at start/end of Bezier curve
function calculateBezierAngleAtT(
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
function getPointOnCubicBezier(
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
function getBidirectionalPaths(
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

interface ContextMenuProps {
  x: number;
  y: number;
  isAnimated: boolean;
  onToggleAnimation: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isAnimated,
  onToggleAnimation,
  onEdit,
  onDelete,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[120px]"
      style={{ left: x, top: y, zIndex: 999999 }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleAnimation();
          onClose();
        }}
        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
      >
        {isAnimated ? (
          <SquarePause className="w-4 h-4" />
        ) : (
          <FastForward className="w-4 h-4" />
        )}
        <span>Toggle Animation</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
      >
        <Edit className="w-4 h-4" />
        <span>Edit</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        <span>Delete</span>
      </button>
    </div>,
    document.body
  );
};

const MythSmithEdge: React.FC<EdgeProps<MythSmithEdgeData>> = React.memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
    selected,
  }) => {
    const { setEdges } = useReactFlow();
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    // Calculate angles for proper marker orientation
    const startAngle = calculateBezierAngleAtT(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      0.025
    );
    const endAngle = calculateBezierAngleAtT(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      0.9875
    );

    // Calculate bidirectional paths that split in the middle
    const [upperPath, lowerPath] = data?.bidirectional
      ? getBidirectionalPaths(
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          10 // 10px offset at midpoint
        )
      : [edgePath, edgePath];

    const onEdgeClick = (evt: React.MouseEvent) => {
      evt.stopPropagation();
    };

    const onEdgeContextMenu = (evt: React.MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      setContextMenu({ x: evt.clientX, y: evt.clientY });
    };

    const onDeleteEdge = (evt?: React.MouseEvent) => {
      if (evt) evt.stopPropagation();
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
    };

    const onEditEdge = () => {
      setIsEditModalOpen(true);
    };

    const onToggleAnimation = () => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  animated: !edge.data?.animated,
                },
              }
            : edge
        )
      );
    };

    const getEdgeStyles = () => {
      const baseStyle = {
        strokeWidth: 2,
        ...style,
      };
      const typeColors: Record<MythSmithEdgeData["type"], string> = {
        friendship: "#10b981",
        rivalry: "#ef4444",
        alliance: "#3b82f6",
        conflict: "#f59e0b",
        location: "#8b5cf6",
        event: "#06b6d4",
        family: "#ec4899",
        trade: "#84cc16",
        custom: data?.customColor || "#6b7280",
      };
      const strengthWidths = {
        weak: 2,
        moderate: 3,
        strong: 4,
      };
      if (data?.animated) {
        return {
          ...baseStyle,
          stroke: typeColors[data?.type || "custom"],
          strokeWidth: strengthWidths[data?.strength || "moderate"],
          strokeDasharray: "8,4",
          strokeDashoffset: 0,
          opacity: selected ? 1 : 0.8,
        };
      } else {
        return {
          ...baseStyle,
          stroke: typeColors[data?.type || "custom"],
          strokeWidth: strengthWidths[data?.strength || "moderate"],
          strokeDasharray: "none",
          animation: "none",
          opacity: selected ? 1 : 0.8,
        };
      }
    };

    const getMarkers = () => {
      if (data?.bidirectional) {
        return {
          markerStart: `url(#arrow-start-${id})`,
          markerEnd: `url(#arrow-end-${id})`,
        };
      }
      return {
        markerEnd: `url(#arrow-end-${id})`,
      };
    };

    const edgeStyles = getEdgeStyles();
    const edgeColor = edgeStyles.stroke;

    return (
      <>
        <style>
          {`
        @keyframes dash-flow {
          0% { stroke-dashoffset: 12; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes dash-flow-reverse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 12; }
        }
      `}
        </style>

        {/* Arrow markers */}
        <defs>
          <marker
            id={`arrow-start-${id}`}
            viewBox="0 0 10 10"
            refX="1"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient={startAngle}
            markerUnits="strokeWidth"
          >
            <path d="M9,1 L9,9 L1,5 z" fill={edgeColor} />
          </marker>
          <marker
            id={`arrow-end-${id}`}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient={endAngle}
            markerUnits="strokeWidth"
          >
            <path d="M1,1 L1,9 L9,5 z" fill={edgeColor} />
          </marker>
        </defs>

        {/* Render bidirectional edges with paths that split in the middle */}
        {data?.bidirectional ? (
          <>
            {/* Upper path (source → target) */}
            <path
              d={upperPath}
              fill="none"
              stroke={edgeColor}
              strokeWidth={edgeStyles.strokeWidth}
              strokeDasharray={edgeStyles.strokeDasharray}
              strokeDashoffset={edgeStyles.strokeDashoffset}
              style={{
                animation: data?.animated
                  ? "dash-flow 2s linear infinite"
                  : "none",
                opacity: selected ? 1 : 0.8,
                pointerEvents: "none",
              }}
              markerStart={`url(#arrow-start-${id})`}
              markerEnd={`url(#arrow-end-${id})`}
            />

            {/* Lower path (target → source by swapping markers) */}
            <path
              d={lowerPath}
              fill="none"
              stroke={edgeColor}
              strokeWidth={edgeStyles.strokeWidth}
              strokeDasharray={edgeStyles.strokeDasharray}
              strokeDashoffset={edgeStyles.strokeDashoffset}
              style={{
                animation: data?.animated
                  ? "dash-flow-reverse 2s linear infinite"
                  : "none",
                opacity: selected ? 1 : 0.8,
                pointerEvents: "none",
              }}
              markerStart={`url(#arrow-end-${id})`}
              markerEnd={`url(#arrow-start-${id})`}
            />
          </>
        ) : (
          /* Regular unidirectional edge */
          <BaseEdge
            path={edgePath}
            style={{ ...edgeStyles, pointerEvents: "none" }}
            {...getMarkers()}
          />
        )}

        {/* Invisible wide path(s) for interaction */}
        {data?.bidirectional ? (
          <>
            <path
              d={upperPath}
              fill="none"
              stroke="transparent"
              strokeWidth={40}
              pointerEvents="all"
              className="cursor-pointer"
              onContextMenu={onEdgeContextMenu}
              onClick={onEdgeClick}
            />
            <path
              d={lowerPath}
              fill="none"
              stroke="transparent"
              strokeWidth={40}
              pointerEvents="all"
              className="cursor-pointer"
              onContextMenu={onEdgeContextMenu}
              onClick={onEdgeClick}
            />
          </>
        ) : (
          <path
            d={edgePath}
            fill="none"
            stroke="transparent"
            strokeWidth={40}
            pointerEvents="all"
            className="cursor-pointer"
            onContextMenu={onEdgeContextMenu}
            onClick={onEdgeClick}
          />
        )}

        {/* Edge label */}
        {data?.label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                fontSize: 12,
                pointerEvents: "none",
                userSelect: "none",
                backgroundColor: hexToRgba(edgeColor, 0.9),
                padding: "2px 6px",
                borderRadius: 5,
                color: "#fff",
              }}
              className="nodrag nopan"
            >
              {data?.label || ""}
            </div>
          </EdgeLabelRenderer>
        )}

        {/* Context menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isAnimated={!!data?.animated}
            onToggleAnimation={onToggleAnimation}
            onEdit={onEditEdge}
            onDelete={onDeleteEdge}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Edit modal */}
        {isEditModalOpen &&
          createPortal(
            <ConnectionModal
              isOpen={isEditModalOpen}
              isEdit={true}
              initialData={data}
              onClose={() => setIsEditModalOpen(false)}
              onUpdate={(updatedData) => {
                setEdges((eds) =>
                  eds.map((edge) =>
                    edge.id === id ? { ...edge, data: updatedData } : edge
                  )
                );
                setIsEditModalOpen(false);
              }}
            />,
            document.body
          )}
      </>
    );
  }
);

MythSmithEdge.displayName = "MythSmithEdge";
export default MythSmithEdge;
