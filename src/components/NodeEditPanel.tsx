import React, { useState, useEffect } from "react";
import { Node, NodeType, UpdateNodeRequest } from "@/types";
import {
  X,
  Save,
  Trash2,
  User,
  Swords,
  Building,
  CloudLightning,
  MapPin,
  Globe,
  Key,
  KeyIcon,
} from "lucide-react";
import ConfirmationDialog from "./ui/ConfirmationDialog";

interface NodeEditPanelProps {
  node: Node;
  onUpdate: (updatedNode: Node) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "character" as NodeType,
    description: "",
  });

  // Get the appropriate icon for the node type
  const getNodeIcon = (type: NodeType) => {
    const iconSize = 18;
    switch (type) {
      case "character":
        return <User size={iconSize} />;
      case "faction":
        return <Swords size={iconSize} />;
      case "city":
        return <Building size={iconSize} />;
      case "event":
        return <CloudLightning size={iconSize} />;
      case "location":
        return <MapPin size={iconSize} />;
      default:
        return <Globe size={iconSize} />;
    }
  };

  // Initialize form data when node changes
  useEffect(() => {
    if (node) {
      setFormData({
        name: node.data.name || "",
        type: node.data.type || "character",
        description: node.data.description || "",
      });
    }
  }, [node]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!node) return;
    setIsSaving(true);
    try {
      const updatedNode: Node = {
        ...node,
        data: {
          ...node.data,
          ...formData,
        },
      };
      await onUpdate(updatedNode);
    } catch (error) {
      console.error("Failed to update node:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!node) throw new Error("Node not found");
      await onDelete(node.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete node:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const getNodeColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      character: "text-blue-400",
      faction: "text-red-400",
      city: "text-orange-400",
      event: "text-green-400",
      location: "text-purple-400",
    };
    return colors[type] || "text-gray-400";
  };

  const getNodeBgColor = (type: NodeType) => {
    const colors: Record<NodeType, string> = {
      character: "bg-blue-900/20",
      faction: "bg-red-900/20",
      city: "bg-orange-900/20",
      event: "bg-green-900/20",
      location: "bg-purple-900/20",
    };
    return colors[type] || "bg-gray-900/20";
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <span className={`mr-2 ${getNodeColor(node.data.type)}`}>
              {getNodeIcon(node.data.type)}
            </span>
            Edit Node
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Node name"
            />
          </div>

          {/* Type Field */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Type
            </label>
            <div className="relative">
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="character">Character</option>
                <option value="faction">Faction</option>
                <option value="city">City</option>
                <option value="event">Event</option>
                <option value="location">Location</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                {getNodeIcon(formData.type)}
              </div>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Node description"
            />
          </div>
        </div>

        {/* Bottom Section: Position Info + Action Buttons */}
        <div className="border-t border-gray-700">
          {/* Position Info */}
          <div className="px-4 pt-3 text-sm text-gray-400">
            <p className="flex items-center pr-1">
              <MapPin size={14} className="mr-1" />[
              {Math.round(node.position.x)}, {Math.round(node.position.y)}]
            </p>
            <p className="flex items-center pr-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
              <Key size={14} className="mr-1 flex-shrink-0" />
              <span className="truncate" title={node.id}>
                {node.id}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  {/* Spinner */}
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Node"
        message={`Are you sure you want to delete "${node.data.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </>
  );
};

export default NodeEditPanel;
