import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, FastForward, SquarePause, Eye } from "lucide-react";

interface EdgeContextMenuProps {
  x: number;
  y: number;
  isAnimated: boolean;
  onToggleAnimation: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  x,
  y,
  isAnimated,
  onToggleAnimation,
  onEdit,
  onDelete,
  onViewDetails,
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
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[140px]"
      style={{ left: x, top: y, zIndex: 999999 }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
          onClose();
        }}
        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span>View Details</span>
      </button>
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

export default EdgeContextMenu;
