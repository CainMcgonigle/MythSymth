import React, { useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow,
} from "reactflow";
import MythSmithNode from "@/components/graphComponents/MythSmithNode";
import MythSmithEdge from "@/components/graphComponents/MythSmithEdge";

const nodeTypes = { mythsmith: MythSmithNode };
const edgeTypes = { mythsmith: MythSmithEdge };

interface GraphPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  edges: Edge[];
}

// Inner component that uses useReactFlow hook
const GraphPreviewContent = ({ 
  nodes, 
  edges 
}: { 
  nodes: Node[]; 
  edges: Edge[]; 
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const reactFlowInstance = useReactFlow();

  const handleZoomIn = () => {
    const newZoom = Math.min(2, zoomLevel + 0.1);
    reactFlowInstance.zoomTo(newZoom);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.2, zoomLevel - 0.1);
    reactFlowInstance.zoomTo(newZoom);
    setZoomLevel(newZoom);
  };

  const handleResetView = () => {
    reactFlowInstance.fitView({ padding: 0.2 });
    setZoomLevel(1);
  };

  const handleMoveEnd = () => {
    const viewport = reactFlowInstance.getViewport();
    setZoomLevel(viewport.zoom);
  };

  return (
    <div className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ width: "100%", height: "100%", backgroundColor: "#1a202c" }}
        attributionPosition="bottom-left"
        onMoveEnd={handleMoveEnd}
      >
        <Background variant={BackgroundVariant.Lines} gap={20} color="#2d3748" />
      </ReactFlow>
      
      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center space-y-2 bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-white"
          title="Zoom In"
        >
          +
        </button>
        <div className="text-white text-xs w-12 text-center">
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={handleZoomOut}
          className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-white"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={handleResetView}
          className="bg-gray-700 hover:bg-gray-600 rounded w-8 h-8 flex items-center justify-center text-white text-xs"
          title="Reset View"
        >
          ⌂
        </button>
      </div>
    </div>
  );
};

const GraphPreviewModal: React.FC<GraphPreviewModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* Modal Wrapper */}
      <div
        className="bg-gray-900 rounded-xl w-[80vw] h-[80vh] shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
          <h2 className="text-white font-semibold text-lg">Graph Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>
        
        {/* Stats Bar */}
        <div className="px-4 py-2 bg-gray-800 flex items-center justify-between text-sm text-gray-300">
          <div>
            Showing {nodes.length} nodes and {edges.length} edges
          </div>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Character</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>City</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Faction</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Event</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Location</span>
            </div>
          </div>
        </div>
        
        {/* React Flow */}
        <ReactFlowProvider>
          <GraphPreviewContent nodes={nodes} edges={edges} />
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default GraphPreviewModal;