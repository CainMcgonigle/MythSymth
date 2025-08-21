import React, { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  User,
  Swords,
  Home,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building,
  Crown,
  Shield,
  Zap,
  Mountain,
} from "lucide-react";
import type { NodeType, ConnectionDirection } from "@/types";

const MythSmithNode: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as {
    name: string;
    type: NodeType;
    description?: string;
    connectionDirection: ConnectionDirection;
  };
  const [expanded, setExpanded] = useState(false);

  const stylesByType = (type: NodeType) => {
    return {
      character: {
        gradient: "from-blue-400 to-blue-600",
        borderClass: "border-blue-700",
        shadowClass: "shadow-[0_12px_30px_rgba(59,130,246,0.18)]",
        icon: <User size={20} />,
        badge: <Crown size={12} />,
        handleBg: "bg-blue-500",
        handleGlow: "rgba(59,130,246,0.28)",
      },
      faction: {
        gradient: "from-red-400 to-red-600",
        borderClass: "border-red-700",
        shadowClass: "shadow-[0_12px_30px_rgba(239,68,68,0.18)]",
        icon: <Swords size={20} />,
        badge: <Shield size={12} />,
        handleBg: "bg-red-500",
        handleGlow: "rgba(239,68,68,0.28)",
      },
      city: {
        gradient: "from-orange-400 to-amber-500",
        borderClass: "border-orange-700",
        shadowClass: "shadow-[0_12px_30px_rgba(249,115,22,0.18)]",
        icon: <Building size={20} />,
        badge: <Home size={12} />,
        handleBg: "bg-orange-500",
        handleGlow: "rgba(249,115,22,0.28)",
      },
      event: {
        gradient: "from-emerald-400 to-green-500",
        borderClass: "border-emerald-700",
        shadowClass: "shadow-[0_12px_30px_rgba(16,185,129,0.18)]",
        icon: <Calendar size={20} />,
        badge: <Zap size={12} />,
        handleBg: "bg-emerald-500",
        handleGlow: "rgba(16,185,129,0.28)",
      },
      location: {
        gradient: "from-purple-400 to-purple-600",
        borderClass: "border-purple-700",
        shadowClass: "shadow-[0_12px_30px_rgba(139,92,246,0.18)]",
        icon: <MapPin size={20} />,
        badge: <Mountain size={12} />,
        handleBg: "bg-purple-500",
        handleGlow: "rgba(139,92,246,0.28)",
      },
    }[type || "character"];
  };

  const s = stylesByType(nodeData.type);

  const handlePos: Record<string, React.CSSProperties> = {
    top: { top: "-10px", left: "50%", transform: "translateX(-50%)" },
    bottom: { bottom: "-10px", left: "50%", transform: "translateX(-50%)" },
    left: { left: "-3px", top: "50%", transform: "translateY(-50%)" },
    right: { right: "-3px", top: "50%", transform: "translateY(-50%)" },
  };

  const handleClass =
    `w-4 h-4 rounded-full border-2 border-white transition-transform duration-150 ease-out ` +
    `group-hover:scale-125 hover:scale-150 focus:scale-150 ${s.handleBg} z-50`;

  const handleBoxShadow = (rgba: string) =>
    `0 10px 22px ${rgba}, inset 0 0 0 1px rgba(255,255,255,0.04)`;

  return (
    <div className="relative group" style={{ overflow: "visible" }}>
      {}
      {(nodeData.connectionDirection === "vertical" ||
        nodeData.connectionDirection === "all") && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id={`top-target-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.top as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
          <Handle
            type="source"
            position={Position.Top}
            id={`top-source-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.top as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />

          <Handle
            type="target"
            position={Position.Bottom}
            id={`bottom-target-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.bottom as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id={`bottom-source-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.bottom as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
        </>
      )}

      {(nodeData.connectionDirection === "horizontal" ||
        nodeData.connectionDirection === "all") && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id={`left-target-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.left as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
          <Handle
            type="source"
            position={Position.Left}
            id={`left-source-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.left as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />

          <Handle
            type="target"
            position={Position.Right}
            id={`right-target-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.right as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={`right-source-${id}`}
            className={handleClass}
            style={{
              ...(handlePos.right as any),
              boxShadow: handleBoxShadow(s.handleGlow),
            }}
          />
        </>
      )}

      {}
      <div
        className={`
          relative rounded-2xl p-4 min-w-[180px]
          bg-gradient-to-br ${s.gradient}
          ${s.borderClass} border-2
          ${s.shadowClass}
          transition-all duration-200 ease-in-out
          hover:scale-[1.03] cursor-pointer
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {s.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white truncate text-sm">
                {nodeData.name}
              </span>
              <div className="flex items-center space-x-2 text-white/90 text-xs mt-0.5">
                {s.badge}
                <span className="capitalize">{nodeData.type}</span>
              </div>
            </div>
          </div>

          {nodeData.description && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((p) => !p);
              }}
              aria-expanded={expanded}
              className="w-7 h-7 rounded-full bg-white/18 flex items-center justify-center hover:bg-white/25"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div
          className={`grid transition-all duration-250 ease-in-out ${
            expanded
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="bg-black/20 rounded-md p-2">
              <p className="text-xs text-white leading-relaxed">
                {nodeData.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MythSmithNode;
