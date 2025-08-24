import React, { useState, useEffect } from "react";
import { Node, NodeType } from "../types";
import {
  User,
  Swords,
  Building,
  CloudLightning,
  MapPin,
  Menu,
  Plus,
  Trash2,
  HelpCircle,
  PanelLeftClose,
} from "lucide-react";

interface ToolbarProps {
  onCreateNode: () => void;
  onToggleSidebar: () => void;
  onQuickCreate: (type: NodeType) => void;
  selectedNode: Node | null;
  isSidebarOpen: boolean;
  onDragStart: (type: NodeType) => void; // New prop for drag start
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onCreateNode,
  onToggleSidebar,
  onQuickCreate,
  selectedNode,
  isSidebarOpen,
  onDragStart, // Add the new prop
}) => {
  const [isThinView, setIsThinView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsThinView(window.innerWidth < 1450);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const quickCreateOptions = [
    {
      type: "character" as NodeType,
      label: "Character",
      icon: <User size={16} />,
      title: "Create Character (Drag to Canvas)",
      accentColor: "#2563eb",
      bgClass: "bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20 hover:border-blue-600/40",
      textClass: "text-blue-300 hover:text-blue-200",
      shadowClass: "hover:shadow-lg hover:shadow-blue-600/20",
    },
    {
      type: "faction" as NodeType,
      label: "Faction",
      icon: <Swords size={16} />,
      title: "Create Faction (Drag to Canvas)",
      accentColor: "#dc2626",
      bgClass: "bg-red-600/10 hover:bg-red-600/20 border-red-600/20 hover:border-red-600/40",
      textClass: "text-red-300 hover:text-red-200",
      shadowClass: "hover:shadow-lg hover:shadow-red-600/20",
    },
    {
      type: "city" as NodeType,
      label: "City",
      icon: <Building size={16} />,
      title: "Create City (Drag to Canvas)",
      accentColor: "#d97706",
      bgClass: "bg-yellow-600/10 hover:bg-yellow-600/20 border-yellow-600/20 hover:border-yellow-600/40",
      textClass: "text-yellow-300 hover:text-yellow-200",
      shadowClass: "hover:shadow-lg hover:shadow-yellow-600/20",
    },
    {
      type: "event" as NodeType,
      label: "Event",
      icon: <CloudLightning size={16} />,
      title: "Create Event (Drag to Canvas)",
      accentColor: "#059669",
      bgClass: "bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/20 hover:border-emerald-600/40",
      textClass: "text-emerald-300 hover:text-emerald-200",
      shadowClass: "hover:shadow-lg hover:shadow-emerald-600/20",
    },
    {
      type: "location" as NodeType,
      label: "Location",
      icon: <MapPin size={16} />,
      title: "Create Location (Drag to Canvas)",
      accentColor: "#9333ea",
      bgClass: "bg-purple-600/10 hover:bg-purple-600/20 border-purple-600/20 hover:border-purple-600/40",
      textClass: "text-purple-300 hover:text-purple-200",
      shadowClass: "hover:shadow-lg hover:shadow-purple-600/20",
    },
  ];

  return (
    <div className="relative flex justify-between items-center bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 
                    border-b border-gray-700/50 shadow-xl backdrop-blur-sm h-[64px] px-6">
      <div className="flex items-center gap-3 h-full">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/50 hover:bg-gray-700/70 
                     text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 
                     border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm"
        >
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
        </button>

        <div className="h-8 w-px bg-gray-600/50"></div>

        <button
          onClick={onCreateNode}
          title="Create New Node"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium 
                     bg-gradient-to-r from-blue-600/20 to-blue-700/20 hover:from-blue-600/30 hover:to-blue-700/30
                     text-blue-300 hover:text-blue-200 border border-blue-600/30 hover:border-blue-500/50
                     transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm
                     shadow-lg hover:shadow-blue-600/20"
        >
          <Plus size={16} />
          {!isThinView && <span>New Node</span>}
        </button>

        <div className="flex gap-2">
          {quickCreateOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => onQuickCreate(option.type)}
              title={option.title}
              draggable
              onDragStart={() => onDragStart(option.type)}
              className={`
                flex items-center justify-center font-medium transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm
                hover:scale-105 active:scale-95 border cursor-move
                ${isThinView 
                  ? "w-10 h-10 rounded-xl" 
                  : "gap-2 px-3 py-2 rounded-xl"}
                ${option.bgClass} ${option.textClass} ${option.shadowClass}
              `}
            >
              {option.icon}
              {!isThinView && <span className="text-xs font-medium">{option.label}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center select-none pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-600/10 to-amber-600/10 
                        border border-orange-500/20 backdrop-blur-sm">
          <img
            src="/assets/android-chrome-192x192.png"
            alt="MythSmith logo"
            className="w-6 h-6 drop-shadow-sm"
          />
          {!isThinView && (
            <span className="font-semibold text-orange-300 text-sm tracking-wide">
              MythSmith
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {selectedNode && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/30 border border-gray-600/30 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="text-sm text-gray-300">
              <span className="text-gray-400">Selected:</span>
              <span className="font-medium text-white ml-1 truncate max-w-xs">
                {selectedNode.data.name}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => {
            alert(
              "MythSmith - A worldbuilding engine for writers and RPG designers.\n\nFeatures:\n• Visual node-based world creation\n• Character, faction, city, event, and location management\n• Drag and drop interface\n• Persistent storage"
            );
          }}
          title="About MythSmith"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium
                     bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30
                     text-indigo-300 hover:text-indigo-200 border border-indigo-600/30 hover:border-indigo-500/50
                     transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm
                     shadow-lg hover:shadow-indigo-600/20"
        >
          <HelpCircle size={16} />
          {!isThinView && <span className="text-sm">Help</span>}
        </button>
      </div>
    </div>
  );
};
