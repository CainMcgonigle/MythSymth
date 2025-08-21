import React, { useState } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeProps,
  EdgeLabelRenderer,
  useReactFlow,
} from "reactflow";
import { createPortal } from "react-dom";
import ConnectionModal from "../ConnectionModal";
import ConnectionDetailsCard from "./edges/connectionDetailsCard";
import EdgeContextMenu from "./edges/edgeContextMenu";
import { MythSmithEdgeData } from "@/types";
import {
  hexToRgba,
  calculateBezierAngleAtT,
  getBidirectionalPaths,
} from "@/utils/edgeUtils";

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
    const [detailsCardVisible, setDetailsCardVisible] = useState(false);
    const [detailsCardPosition, setDetailsCardPosition] = useState({
      x: 0,
      y: 0,
    });

    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

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

    const [upperPath, lowerPath] = data?.bidirectional
      ? getBidirectionalPaths(
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          10
        )
      : [edgePath, edgePath];

    const edgeStyles = (() => {
      const baseStyle = { strokeWidth: 2, ...style };
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
      const strengthWidths = { weak: 2, moderate: 3, strong: 4 };
      const color = typeColors[data?.type || "custom"];
      const width = strengthWidths[data?.strength || "moderate"];

      return {
        ...baseStyle,
        stroke: color,
        strokeWidth: width,
        strokeDasharray: data?.animated ? "8,4" : "none",
        strokeDashoffset: 0,
        animation: data?.animated ? "dash-flow 2s linear infinite" : "none",
        opacity: selected ? 1 : 0.8,
      };
    })();

    const edgeColor = edgeStyles.stroke;

    const getMarkers = () =>
      data?.bidirectional
        ? {
            markerStart: `url(#arrow-start-${id})`,
            markerEnd: `url(#arrow-end-${id})`,
          }
        : { markerEnd: `url(#arrow-end-${id})` };

    const handleEdgeClick = (evt: React.MouseEvent) => evt.stopPropagation();
    const handleEdgeContextMenu = (evt: React.MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      setContextMenu({ x: evt.clientX, y: evt.clientY });
    };
    const handleLabelClick = (evt: React.MouseEvent) => {
      evt.preventDefault();
      evt.stopPropagation();
      setDetailsCardPosition({ x: evt.clientX, y: evt.clientY });
      setDetailsCardVisible(true);
    };
    const handleDeleteEdge = () => {
      setEdges((eds) => eds.filter((edge) => edge.id !== id));
    };
    const handleEditEdge = () => setIsEditModalOpen(true);
    const handleViewDetails = () => {
      setDetailsCardPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      setDetailsCardVisible(true);
    };
    const handleToggleAnimation = () => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === id
            ? {
                ...edge,
                data: { ...edge.data, animated: !edge.data?.animated },
              }
            : edge
        )
      );
    };

    const interactionPathProps = {
      fill: "none",
      stroke: "transparent",
      strokeWidth: 40,
      pointerEvents: "all",
      className: "cursor-pointer",
    };

    return (
      <>
        <style>{`
          @keyframes dash-flow { 0% { stroke-dashoffset: 12; } 100% { stroke-dashoffset: 0; } }
          @keyframes dash-flow-reverse { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 12; } }
        `}</style>

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

        {/* Render edges */}
        {(data?.bidirectional ? [upperPath, lowerPath] : [edgePath]).map(
          (path, idx) => (
            <path
              key={idx}
              d={path}
              fill="none"
              stroke={edgeColor}
              strokeWidth={edgeStyles.strokeWidth}
              strokeDasharray={edgeStyles.strokeDasharray}
              style={{
                animation: data?.animated
                  ? idx === 0
                    ? "dash-flow 2s linear infinite"
                    : "dash-flow-reverse 2s linear infinite"
                  : "none",
                opacity: edgeStyles.opacity,
                pointerEvents: "none",
              }}
              {...(data?.bidirectional
                ? idx === 0
                  ? {
                      markerStart: `url(#arrow-start-${id})`,
                      markerEnd: `url(#arrow-end-${id})`,
                    }
                  : {
                      markerStart: `url(#arrow-end-${id})`,
                      markerEnd: `url(#arrow-start-${id})`,
                    }
                : getMarkers())}
            />
          )
        )}

        {/* Invisible paths for interaction */}
        {(data?.bidirectional ? [upperPath, lowerPath] : [edgePath]).map(
          (path, idx) => (
            <path
              key={`interaction-${idx}`}
              d={path}
              {...interactionPathProps}
              onClick={handleEdgeClick}
              onContextMenu={handleEdgeContextMenu}
            />
          )
        )}

        {/* Label */}
        {data?.label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                fontSize: 14,
                pointerEvents: "all",
                userSelect: "none",
                backgroundColor: hexToRgba(edgeColor, 0.75),
                padding: "2px 6px",
                borderRadius: 50,
                borderColor: hexToRgba(edgeColor, 0.75, 0.5),
                borderWidth: 1,
                color: "#fff",
                cursor: "pointer",
              }}
              className="nodrag nopan"
              onClick={handleLabelClick}
              onContextMenu={handleEdgeContextMenu} // <--- add this
              title="Click to view connection details"
            >
              {data.label}
            </div>
          </EdgeLabelRenderer>
        )}

        {/* Context menu */}
        {contextMenu && (
          <EdgeContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isAnimated={!!data?.animated}
            onToggleAnimation={handleToggleAnimation}
            onEdit={handleEditEdge}
            onDelete={handleDeleteEdge}
            onViewDetails={handleViewDetails}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Details card */}
        {data && (
          <ConnectionDetailsCard
            isVisible={detailsCardVisible}
            data={data}
            position={detailsCardPosition}
            onClose={() => setDetailsCardVisible(false)}
          />
        )}

        {/* Edit modal */}
        {isEditModalOpen &&
          createPortal(
            <ConnectionModal
              isOpen={isEditModalOpen}
              isEdit
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
