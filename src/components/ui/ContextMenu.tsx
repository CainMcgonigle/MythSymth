import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { LucideIcon } from 'lucide-react';

export interface ContextMenuOption {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [onClose]);

  // Ensure menu stays within viewport
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 180; // Approximate width
    const menuHeight = options.length * 40; // Approximate height per option
    
    let adjustedX = x;
    let adjustedY = y;
    
    // Adjust horizontal position if too close to right edge
    if (x + menuWidth > window.innerWidth) {
      adjustedX = x - menuWidth;
    }
    
    // Adjust vertical position if too close to bottom edge  
    if (y + menuHeight > window.innerHeight) {
      adjustedY = y - menuHeight;
    }
    
    return { x: Math.max(0, adjustedX), y: Math.max(0, adjustedY) };
  }, [x, y, options.length]);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px] z-[999999]"
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {options.map((option, index) => {
        const Icon = option.icon;
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (!option.disabled) {
                option.onClick();
                onClose();
              }
            }}
            disabled={option.disabled}
            className={`
              flex items-center space-x-2 w-full px-3 py-2 text-sm transition-colors
              ${option.disabled
                ? 'text-gray-500 cursor-not-allowed'
                : option.className || 'text-white hover:bg-gray-700'
              }
            `}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
};

export default ContextMenu;