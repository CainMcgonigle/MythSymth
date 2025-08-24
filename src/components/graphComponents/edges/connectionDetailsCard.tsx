import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { MythSmithEdgeData } from '@/types';
import * as Icons from 'lucide-react';

interface ConnectionDetailsCardProps {
  isVisible: boolean;
  data: MythSmithEdgeData;
  position: { x: number; y: number };
  onClose: () => void;
}

const ConnectionDetailsCard: React.FC<ConnectionDetailsCardProps> = ({
  isVisible,
  data,
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

  const getConnectionStyles = (type: MythSmithEdgeData["type"]) => {
    const styleMap = {
      friendship: {
        color: '#10b981',
        label: 'Friendship'
      },
      rivalry: {
        color: '#ef4444',
        label: 'Rivalry'
      },
      alliance: {
        color: '#3b82f6',
        label: 'Alliance'
      },
      conflict: {
        color: '#f59e0b',
        label: 'Conflict'
      },
      location: {
        color: '#8b5cf6',
        label: 'Location'
      },
      event: {
        color: '#06b6d4',
        label: 'Event'
      },
      family: {
        color: '#ec4899',
        label: 'Family'
      },
      trade: {
        color: '#84cc16',
        label: 'Trade'
      },
      custom: {
        color: data?.customColor || '#6b7280',
        label: 'Custom'
      },
    };
    return styleMap[type] || styleMap.custom;
  };

  const strengthLabels = {
    weak: "Weak",
    moderate: "Moderate",
    strong: "Strong",
  };

  const connectionStyles = getConnectionStyles(data?.type || "custom");

  const renderIcon = () => {
    if (!data?.customIconName) {
      return (
        data?.label?.[0]?.toUpperCase() || connectionStyles.label[0]
      );
    }
    const IconComponent = Icons[data.customIconName as keyof typeof Icons] as
      | React.ComponentType<React.SVGProps<SVGSVGElement>>
      | undefined;
    return IconComponent ? (
      <IconComponent className="w-5 h-5 text-white" />
    ) : null;
  };

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
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px ${connectionStyles.color}40`,
        }}
      >
        {/* Header */}
        <div
          className="relative p-4 text-white overflow-hidden border-b border-gray-700"
          style={{
            background: `linear-gradient(135deg, ${connectionStyles.color}, ${connectionStyles.color}dd)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                {renderIcon()}
              </div>
              <div>
                <h3 className="font-semibold text-lg leading-tight">
                  {data?.label || connectionStyles.label}
                </h3>
                <div className="flex items-center space-x-2 text-white/70 text-sm">
                  <span>{connectionStyles.label}</span>
                  <span>•</span>
                  <span>{strengthLabels[data?.strength || "moderate"]}</span>
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
          {/* Strength Bars */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-medium">
                Connection Strength
              </span>
              <span className="text-white text-sm font-semibold capitalize">
                {data?.strength || "moderate"}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    (data?.strength === "strong" && level <= 3) ||
                    (data?.strength === "moderate" && level <= 2) ||
                    (data?.strength === "weak" && level <= 1)
                      ? "opacity-100"
                      : "opacity-20"
                  }`}
                  style={{
                    backgroundColor: connectionStyles.color,
                  }}
                />
              ))}
            </div>
          </div>

          {data?.description ? (
            <div className="space-y-2">
              <span className="text-gray-300 text-sm font-medium">Description</span>
              <div className="text-white text-sm leading-relaxed p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                {data.description}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic p-3 bg-gray-700/30 rounded-lg border border-gray-600">
              No description provided
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {data?.bidirectional && (
                <div className="flex items-center px-3 py-2 bg-blue-900/30 text-blue-300 rounded-lg text-xs font-medium border border-blue-800/50">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  Two-way Connection
                </div>
              )}
              {data?.animated && (
                <div className="flex items-center px-3 py-2 bg-green-900/30 text-green-300 rounded-lg text-xs font-medium border border-green-800/50">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                  Animated Flow
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${connectionStyles.color}, ${connectionStyles.color}80, ${connectionStyles.color})`,
          }}
        />
      </div>
    </div>,
    document.body
  );
};

export default ConnectionDetailsCard;