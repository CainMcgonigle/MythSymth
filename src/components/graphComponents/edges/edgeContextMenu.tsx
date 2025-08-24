import React from "react";
import { Edit, Trash2, FastForward, SquarePause, Eye } from "lucide-react";
import ContextMenu, { ContextMenuOption } from '@/components/ui/ContextMenu';

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
  const options: ContextMenuOption[] = [
    {
      icon: Eye,
      label: 'View Details',
      onClick: onViewDetails,
    },
    {
      icon: isAnimated ? SquarePause : FastForward,
      label: 'Toggle Animation',
      onClick: onToggleAnimation,
    },
    {
      icon: Edit,
      label: 'Edit',
      onClick: onEdit,
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: onDelete,
      className: 'text-red-400 hover:bg-gray-700',
    },
  ];

  return <ContextMenu x={x} y={y} options={options} onClose={onClose} />;
};

export default EdgeContextMenu;
