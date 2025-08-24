import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Building, MapPin, Calendar, Crown, Shield, Home, Zap, Mountain } from 'lucide-react';
import { Node, NodeType } from '@/types';

interface NodeDetailsCardProps {
  isVisible: boolean;
  node: Node;
  position: { x: number; y: number };
  onClose: () => void;
}

const NodeDetailsCard: React.FC<NodeDetailsCardProps> = ({
  isVisible,
  node,
  position,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isVisible) return;
    
    if (cardRef.current) {
      cardRef.current.focus();
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isVisible, handleClickOutside, handleKeyDown]);

  if (!isVisible) return null;

  const getNodeStyles = (type: NodeType) => {
    const styleMap = {
      character: {
        color: '#2563eb',
        icon: User,
        badge: Crown,
        label: 'Character'
      },
      faction: {
        color: '#dc2626',
        icon: Building,
        badge: Shield,
        label: 'Faction'
      },
      city: {
        color: '#d97706',
        icon: Building,
        badge: Home,
        label: 'City'
      },
      event: {
        color: '#059669',
        icon: Calendar,
        badge: Zap,
        label: 'Event'
      },
      location: {
        color: '#9333ea',
        icon: MapPin,
        badge: Mountain,
        label: 'Location'
      },
    };
    return styleMap[type] || styleMap.character;
  };

  const nodeStyles = getNodeStyles(node.data.type);
  const Icon = nodeStyles.icon;
  const BadgeIcon = nodeStyles.badge;

  const maxWidth = 320;
  const adjustedX = position.x;
  const adjustedY = position.y;

  return createPortal(
    <div
      ref={cardRef}
      className="fixed z-[100000] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 outline-none"
      style={{
        left: adjustedX,
        top: adjustedY,
        maxWidth: `${maxWidth}px`,
        transition: 'left 0.3s ease-out, top 0.3s ease-out',
      }}
      tabIndex={-1}
    >
      {/* Card */}
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
        style={{
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px ${nodeStyles.color}40`,
        }}
      >
        {/* Header */}
        <div
          className="relative p-4 text-white overflow-hidden border-b border-gray-700"
          style={{
            background: `linear-gradient(135deg, ${nodeStyles.color}, ${nodeStyles.color}dd)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">
                  {node.data.name}
                </h3>
                <div className="flex items-center space-x-2 text-white/70 text-sm">
                  <BadgeIcon className="w-4 h-4" />
                  <span>{nodeStyles.label}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Description */}
          {node.data.description ? (
            <div className="space-y-2">
              <span className="text-gray-300 text-sm font-medium">Description</span>
              <div className="text-white text-sm leading-relaxed p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                {node.data.description}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic p-3 bg-gray-700/30 rounded-lg border border-gray-600">
              No description provided
            </div>
          )}

          {/* Creation Date */}
          {node.createdAt && (
            <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="text-gray-300 font-medium text-sm">Created</div>
              <div className="text-white text-xs mt-1">
                {new Date(node.createdAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Node ID */}
          <div className="pt-2 border-t border-gray-600">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Node ID</span>
              <span className="text-gray-300 font-mono">{node.id}</span>
            </div>
          </div>
        </div>

        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${nodeStyles.color}, ${nodeStyles.color}80, ${nodeStyles.color})`,
          }}
        />
      </div>
    </div>,
    document.body
  );
};

export default NodeDetailsCard;