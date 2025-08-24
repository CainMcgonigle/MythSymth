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
        gradient: "from-blue-500 to-blue-700",
        borderClass: "border-blue-600/30",
        shadowClass: "shadow-[0_20px_40px_rgba(37,99,235,0.25)] hover:shadow-[0_25px_50px_rgba(37,99,235,0.35)]",
        icon: <User size={18} />,
        badge: <Crown size={11} />,
        handleBg: "bg-blue-600",
        handleGlow: "rgba(37,99,235,0.4)",
        accentColor: "#2563eb",
      },
      faction: {
        gradient: "from-red-500 to-red-700",
        borderClass: "border-red-600/30",
        shadowClass: "shadow-[0_20px_40px_rgba(220,38,38,0.25)] hover:shadow-[0_25px_50px_rgba(220,38,38,0.35)]",
        icon: <Swords size={18} />,
        badge: <Shield size={11} />,
        handleBg: "bg-red-600",
        handleGlow: "rgba(220,38,38,0.4)",
        accentColor: "#dc2626",
      },
      city: {
        gradient: "from-yellow-500 to-yellow-700",
        borderClass: "border-yellow-600/30",
        shadowClass: "shadow-[0_20px_40px_rgba(217,119,6,0.25)] hover:shadow-[0_25px_50px_rgba(217,119,6,0.35)]",
        icon: <Building size={18} />,
        badge: <Home size={11} />,
        handleBg: "bg-yellow-600",
        handleGlow: "rgba(217,119,6,0.4)",
        accentColor: "#d97706",
      },
      event: {
        gradient: "from-emerald-500 to-emerald-700",
        borderClass: "border-emerald-600/30",
        shadowClass: "shadow-[0_20px_40px_rgba(5,150,105,0.25)] hover:shadow-[0_25px_50px_rgba(5,150,105,0.35)]",
        icon: <Calendar size={18} />,
        badge: <Zap size={11} />,
        handleBg: "bg-emerald-600",
        handleGlow: "rgba(5,150,105,0.4)",
        accentColor: "#059669",
      },
      location: {
        gradient: "from-purple-500 to-purple-700",
        borderClass: "border-purple-600/30",
        shadowClass: "shadow-[0_20px_40px_rgba(147,51,234,0.25)] hover:shadow-[0_25px_50px_rgba(147,51,234,0.35)]",
        icon: <MapPin size={18} />,
        badge: <Mountain size={11} />,
        handleBg: "bg-purple-600",
        handleGlow: "rgba(147,51,234,0.4)",
        accentColor: "#9333ea",
      },
    }[type || "character"];
  };

  const s = stylesByType(nodeData.type);

  const handlePos: Record<string, React.CSSProperties> = {
    top: { top: "-8px", left: "50%", transform: "translateX(-50%)" },
    bottom: { bottom: "-8px", left: "50%", transform: "translateX(-50%)" },
    left: { left: "-8px", top: "50%", transform: "translateY(-50%)" },
    right: { right: "-8px", top: "50%", transform: "translateY(-50%)" },
  };

  const handleClass =
    `w-4 h-4 rounded-full border-2 border-gray-900/20 transition-all duration-300 ease-out ` +
    `group-hover:scale-125 hover:scale-150 focus:scale-150 hover:border-gray-900/40 ` +
    `${s.handleBg} z-50 backdrop-blur-md shadow-lg hover:shadow-xl ` +
    `ring-0 hover:ring-2 hover:ring-white/30 focus:ring-2 focus:ring-white/50 ` +
    `relative overflow-hidden`;

  const handleBoxShadow = (rgba: string) =>
    `0 4px 20px ${rgba}, 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)`;

  const renderStyledHandle = (type: "target" | "source", position: Position, handleId: string, positionStyle: React.CSSProperties) => (
    <Handle
      type={type}
      position={position}
      id={handleId}
      className={handleClass}
      style={{
        ...positionStyle,
        boxShadow: handleBoxShadow(s.handleGlow),
        background: `linear-gradient(135deg, ${s.accentColor}, ${s.accentColor}DD)`,
      }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 hover:opacity-100 transition-all duration-300 bg-gradient-to-br from-white/15 via-white/5 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 rounded-full bg-white/0 hover:bg-white/10 transition-all duration-200 pointer-events-none"></div>
    </Handle>
  );

  return (
    <div className="relative group" style={{ overflow: "visible" }}>
      {}
      {(nodeData.connectionDirection === "vertical" ||
        nodeData.connectionDirection === "all") && (
        <>
          {renderStyledHandle("target", Position.Top, `top-target-${id}`, handlePos.top)}
          {renderStyledHandle("source", Position.Top, `top-source-${id}`, handlePos.top)}
          {renderStyledHandle("target", Position.Bottom, `bottom-target-${id}`, handlePos.bottom)}
          {renderStyledHandle("source", Position.Bottom, `bottom-source-${id}`, handlePos.bottom)}
        </>
      )}

      {(nodeData.connectionDirection === "horizontal" ||
        nodeData.connectionDirection === "all") && (
        <>
          {renderStyledHandle("target", Position.Left, `left-target-${id}`, handlePos.left)}
          {renderStyledHandle("source", Position.Left, `left-source-${id}`, handlePos.left)}
          {renderStyledHandle("target", Position.Right, `right-target-${id}`, handlePos.right)}
          {renderStyledHandle("source", Position.Right, `right-source-${id}`, handlePos.right)}
        </>
      )}

      <div
        className={`
          relative rounded-xl p-4 min-w-[200px] max-w-[280px]
          bg-gradient-to-br ${s.gradient}
          ${s.borderClass} border
          ${s.shadowClass}
          transition-all duration-300 ease-out
          hover:scale-[1.02] hover:-translate-y-1 cursor-pointer
          backdrop-blur-sm
          before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r 
          before:from-white/5 before:to-transparent before:pointer-events-none
        `}
        style={{
          background: `linear-gradient(135deg, ${s.accentColor}E6, ${s.accentColor}CC)`,
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="relative">
                <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                  <div className="text-white drop-shadow-sm">
                    {s.icon}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <div className="text-white/90">
                    {s.badge}
                  </div>
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="font-semibold text-white truncate text-sm leading-tight drop-shadow-sm">
                  {nodeData.name}
                </h3>
                <div className="flex items-center space-x-1 text-white/80 text-xs mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                  <span className="capitalize font-medium">{nodeData.type}</span>
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
                className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center 
                         hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/40
                         hover:scale-105 active:scale-95"
              >
                <div className="text-white/90">
                  {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
            )}
          </div>

          {nodeData.description && (
            <div
              className={`grid transition-all duration-300 ease-out ${
                expanded
                  ? "grid-rows-[1fr] opacity-100 mt-3"
                  : "grid-rows-[0fr] opacity-0 mt-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="bg-black/15 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-white/95 leading-relaxed">
                    {nodeData.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MythSmithNode;
