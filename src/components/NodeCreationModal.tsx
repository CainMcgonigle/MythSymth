import React, { useEffect, useState, useCallback, useMemo } from "react";
import { CreateNodeRequest, NodeType, ConnectionDirection } from "@/types";
import { defaultCharacterData } from "@/schemas/characterSchema";
import { defaultFactionData } from "@/schemas/factionSchema";
import { defaultCityData } from "@/schemas/citySchema";
import { defaultEventData } from "@/schemas/eventSchema";
import { defaultLocationData } from "@/schemas/locationSchema";

import {
  CharacterForm,
  FactionForm,
  CityForm,
  EventForm,
  LocationForm,
} from "@/components/nodeForms";

const defaultSchemas: Record<NodeType, () => Partial<CreateNodeRequest>> = {
  character: defaultCharacterData,
  faction: defaultFactionData,
  city: defaultCityData,
  event: defaultEventData,
  location: defaultLocationData,
};

const formComponents: Record<
  NodeType,
  React.FC<{
    data: CreateNodeRequest;
    setData: React.Dispatch<React.SetStateAction<CreateNodeRequest>>;
  }>
> = {
  character: CharacterForm,
  faction: FactionForm,
  city: CityForm,
  event: EventForm,
  location: LocationForm,
};

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
  const createBaseState = useCallback(
    (type: NodeType = "character"): CreateNodeRequest => {
      const schema = defaultSchemas[type]();
      return {
        ...schema,
        name: "",
        type,
        position: {
          x: initialPosition.x + Math.random() * 100 - 50,
          y: initialPosition.y + Math.random() * 100 - 50,
        },
        connectionDirection: "all",
      } as CreateNodeRequest;
    },
    [initialPosition]
  );

  const [formData, setFormData] = useState<CreateNodeRequest>(
    createBaseState("character")
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(createBaseState("character"));
    }
  }, [isOpen, createBaseState]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      setIsSubmitting(true);
      await onCreate(formData);
      onClose();
    } catch (err) {
      console.error("Failed to create node:", err);
      alert("Failed to create node. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as NodeType;
    setFormData((prev) => {
      const schema = defaultSchemas[selected]();
      return {
        ...schema,
        name: prev.name,
        position: prev.position,
        connectionDirection: prev.connectionDirection,
        type: selected,
      } as CreateNodeRequest;
    });
  };

  const FormComponent = useMemo(
    () => formComponents[formData.type],
    [formData.type]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 p-6 rounded-xl w-[460px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Create Node</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter name"
              required
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={handleTypeChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="character">Character</option>
              <option value="faction">Faction</option>
              <option value="city">City</option>
              <option value="event">Event</option>
              <option value="location">Location</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Connections
            </label>
            <select
              value={formData.connectionDirection}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  connectionDirection: e.target.value as ConnectionDirection,
                })
              }
              className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          {FormComponent && (
            <div className="border-t border-gray-700 pt-4">
              <FormComponent data={formData} setData={setFormData} />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className={`flex-1 py-2 rounded-md font-semibold transition text-white ${
                isSubmitting || !formData.name.trim()
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
