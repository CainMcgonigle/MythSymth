import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { User, Shield, Home, Calendar, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { NodeType, Node as MythSmithNodeType, ConnectionDirection } from "@/types";

const MythSmithNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as {
    name: string;
    type: NodeType;
    description: string;
    connectionDirection: ConnectionDirection;
  };

  const [expanded, setExpanded] = useState(false);

  const getNodeColor = (type: NodeType): string => {
    const colors = {
      character: "bg-blue-300",
      faction: "bg-red-300",
      city: "bg-orange-300",
      event: "bg-emerald-300",
      location: "bg-purple-300",
    };
    return colors[type] || "bg-gray-200";
  };

  const getNodeIcon = (type: NodeType) => {
    const icons = {
      character: <User size={20} />,
      faction: <Shield size={20} />,
      city: <Home size={20} />,
      event: <Calendar size={20} />,
      location: <MapPin size={20} />,
    };
    return icons[type] || <User size={20} />;
  };

  return (
    <div
      className={`
        relative p-3 rounded-lg border-2 border-gray-800 text-gray-800 shadow-sm
        transform transition-transform duration-200 ease-in-out hover:scale-105 hover:shadow-md
        // Default width is fixed, height is automatic based on content
        w-40 h-auto
        ${getNodeColor(nodeData.type)}
      `}
    >
      {/* Conditionally render Handles based on connectionDirection prop */}
      {(nodeData.connectionDirection === 'vertical' || nodeData.connectionDirection === 'all') && (
        <>
          <Handle type="target" position={Position.Top} id="top-target" />
          <Handle type="source" position={Position.Bottom} id="bottom-source" />
        </>
      )}

      {(nodeData.connectionDirection === 'horizontal' || nodeData.connectionDirection === 'all') && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="left-source"
            style={{ background: '#555', left: -5 }}
          />
          <Handle
            type="target"
            position={Position.Right}
            id="right-target"
            style={{ background: '#555', right: -5 }}
          />
        </>
      )}

      <div className="flex max-width-10 items-center justify-between space-x-2 mb-1">
        <div className="flex items-center space-x-2">
          <div>{getNodeIcon(nodeData.type)}</div>
          <div className="flex flex-col text-left">
            <div className="font-bold text-sm truncate max-w-[100px]" title={nodeData.name}>{nodeData.name}</div>
            <div className="text-xs opacity-80 capitalize">{nodeData.type}</div>
          </div>
        </div>

        {nodeData.description && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="flex-shrink-0 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 rounded-full p-1"
            aria-expanded={expanded}
            aria-controls={`description-${nodeData.name}`}
            title={expanded ? "Hide description" : "Show description"}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* This container's height is animated to show/hide the description */}
      <div
        className={`
          grid transition-[grid-template-rows] duration-300 ease-in-out
          ${expanded ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'}
        `}
      >
        <div className="overflow-hidden">
          <div 
            className="text-[11px] opacity-70 border-t border-gray-400 pt-2"
          >
            <p>{nodeData.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MythSmithNode;