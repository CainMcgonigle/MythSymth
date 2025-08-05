import React, { useState, useEffect } from "react";
import { NodeType, CreateNodeRequest, ConnectionDirection } from "../types";

interface NodeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (node: CreateNodeRequest) => Promise<void>;
  initialPosition?: { x: number; y: number };
}

export const NodeCreationModal: React.FC<NodeCreationModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  initialPosition = { x: 0, y: 0 },
}) => {
  const [formData, setFormData] = useState<CreateNodeRequest>({
    name: "",
    type: "character",
    description: "",
    connectionDirection: "all",
    position: {
      x: initialPosition.x,
      y: initialPosition.y,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        type: "character",
        description: "",
        connectionDirection: "all",
        position: {
          x: initialPosition.x + Math.random() * 100 - 50,
          y: initialPosition.y + Math.random() * 100 - 50,
        },
      });
    }
  }, [isOpen, initialPosition.x, initialPosition.y]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error("Failed to create node:", error);
      alert("Failed to create node. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal only if clicking on backdrop (outside modal container)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div
        className="bg-white p-8 rounded-xl w-[420px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-lg"
        onClick={(e) => e.stopPropagation()} // prevent closing modal when clicking inside
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800">
            Create New Node
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none font-bold cursor-pointer"
            aria-label="Close modal"
            type="button"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Name */}
          <div>
            <label
              htmlFor="node-name"
              className="block mb-1 font-semibold text-gray-700"
            >
              Name *
            </label>
            <input
              id="node-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter node name"
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-sm text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="node-type"
              className="block mb-1 font-semibold text-gray-700"
            >
              Type
            </label>
            <select
              id="node-type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as NodeType })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-sm text-gray-900
                bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="character">Character</option>
              <option value="faction">Faction</option>
              <option value="city">City</option>
              <option value="event">Event</option>
              <option value="location">Location</option>
            </select>
          </div>

          {/* New: Connection Direction */}
          <div>
            <label
              htmlFor="connection-direction"
              className="block mb-1 font-semibold text-gray-700"
            >
              Connections
            </label>
            <select
              id="connection-direction"
              value={formData.connectionDirection}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  connectionDirection: e.target.value as ConnectionDirection,
                })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-sm text-gray-900
                bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="all">All</option>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="node-description"
              className="block mb-1 font-semibold text-gray-700"
            >
              Description
            </label>
            <textarea
              id="node-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Optional description"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-sm text-gray-900
                resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold
                hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className={`flex-1 py-3 rounded-md font-semibold text-white transition
                ${
                  isSubmitting || !formData.name.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                }`}
            >
              {isSubmitting ? "Creating..." : "Create Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
