import React, { useState, useEffect } from 'react';
import { Node, NodeType, UpdateNodeRequest, ConnectionDirection } from '../types';
import { apiService } from '../services/api';
import { X, Save, Trash2, Globe, User, Shield, Home, Calendar, MapPin, Loader2 } from 'lucide-react';

interface NodeEditPanelProps {
  node: Node | null;
  onUpdate: (updatedNode: Node) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'character' as NodeType,
    description: '',
    connectionDirection: 'all' as ConnectionDirection,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData({
        name: node.data.name,
        type: node.data.type,
        description: node.data.description || '',
        connectionDirection: node.data.connectionDirection || 'all',
      });
      setHasChanges(false);
      setIsPanelOpen(true);
    } else {
      setIsPanelOpen(false);
    }
  }, [node]);

  useEffect(() => {
    if (node) {
      const changed =
        formData.name !== node.data.name ||
        formData.type !== node.data.type ||
        formData.description !== (node.data.description || '') ||
        formData.connectionDirection !== (node.data.connectionDirection || 'all');
      setHasChanges(changed);
    }
  }, [formData, node]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!node || !formData.name.trim()) return;

    try {
      setIsUpdating(true);
      const updateData: UpdateNodeRequest = {};

      if (formData.name !== node.data.name) updateData.name = formData.name;
      if (formData.type !== node.data.type) updateData.type = formData.type;
      if (formData.description !== (node.data.description || '')) updateData.description = formData.description;
      if (formData.connectionDirection !== (node.data.connectionDirection || 'all')) {
        updateData.connectionDirection = formData.connectionDirection;
      }

      if (Object.keys(updateData).length > 0) {
        const updatedNode = await apiService.updateNode(node.id, updateData);
        onUpdate(updatedNode);
        setHasChanges(false);
      }
    } catch (error) {
            console.error('Failed to update node:', error);
            alert('Failed to update node. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!node) return;

        if (confirm(`Are you sure you want to delete "${node.data.name}"?\n\nThis action cannot be undone.`)) {
            try {
                await apiService.deleteNode(node.id);
                onDelete(node.id.toString());
                onClose();
            } catch (error) {
                console.error('Failed to delete node:', error);
                alert('Failed to delete node. Please try again.');
            }
        }
    };

    const handleClose = () => {
        setIsPanelOpen(false);
        setTimeout(() => onClose(), 300); // Wait for slide-out transition
    }

    const getNodeIconComponent = (type: NodeType) => {
        const icons = {
            character: <User size={20} />,
            faction: <Shield size={20} />,
            city: <Home size={20} />,
            event: <Calendar size={20} />,
            location: <MapPin size={20} />,
        };
        return icons[type] || <Globe size={20} />;
    };
    
    // The panel now just handles its own open/close state via width
    const panelClasses = `
      flex flex-col flex-shrink-0
      bg-gray-800  border border-gray-700 text-gray-200 
      transition-all duration-300 ease-in-out
      ${isPanelOpen ? 'w-96' : 'w-0 overflow-hidden'}
    `;

    return (
        <div className={panelClasses}>
            {/* The content is only rendered if a node exists */}
            {node && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700 rounded-t-lg">
                        <div className="flex items-center gap-2">
                            {getNodeIconComponent(node.data.type)}
                            <h3 className="m-0 text-gray-200 text-base font-semibold">
                                Edit {node.data.type}
                            </h3>
                            {hasChanges && (
                                <span className="text-xs font-semibold text-yellow-300 bg-yellow-950 px-2 py-0.5 rounded-full border border-yellow-800">
                                    Unsaved
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 rounded-md text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Form */}
                    <div className="p-5 flex-1 overflow-y-auto">
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-200 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md bg-gray-900 text-gray-200 border-gray-700 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 transition duration-150 ease-in-out"
                                    required
                                    placeholder="Enter node name"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-200 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as NodeType })}
                                    className="w-full px-3 py-2 rounded-md bg-gray-900 text-gray-200 border-gray-700 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 transition duration-150 ease-in-out appearance-none"
                                >
                                    <option value="character">Character</option>
                                    <option value="faction">Faction</option>
                                    <option value="city">City</option>
                                    <option value="event">Event</option>
                                    <option value="location">Location</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-200 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-3 py-2 rounded-md bg-gray-900 text-gray-200 border-gray-700 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 transition duration-150 ease-in-out"
                                    placeholder="Enter description"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-200 mb-1">Connections</label>
                                <select
                                    value={formData.connectionDirection}
                                    onChange={(e) => setFormData({ ...formData, connectionDirection: e.target.value as ConnectionDirection })}
                                    className="w-full px-3 py-2 rounded-md bg-gray-900 text-gray-200 border-gray-700 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 transition duration-150 ease-in-out appearance-none"
                                >
                                    <option value="all">All Sides (Top, Bottom, Left, Right)</option>
                                    <option value="vertical">Vertical Only (Top, Bottom)</option>
                                    <option value="horizontal">Horizontal Only (Left, Right)</option>
                                </select>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg mb-5">
                                <h4 className="m-0 mb-3 text-sm font-semibold text-gray-200">
                                    Node Information
                                </h4>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div><strong>ID:</strong> {node.id}</div>
                                    <div><strong>Position:</strong> ({Math.round(node.position.x)}, {Math.round(node.position.y)})</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isUpdating || !formData.name.trim() || !hasChanges}
                                    className="flex-1 flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                                >
                                    {isUpdating ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 p-4 bg-red-950/20 border border-red-900 rounded-lg">
                            <h4 className="m-0 mb-2 text-sm font-semibold text-red-400">
                                Danger Zone
                            </h4>
                            <p className="m-0 mb-3 text-xs text-red-200 leading-tight">
                                Deleting this node will permanently remove it from your world. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDelete}
                                className="flex items-center justify-center rounded-md px-3 py-2 text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition duration-150 ease-in-out"
                            >
                                <Trash2 size={14} className="mr-1" />
                                Delete Node
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};