import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Node, NodeType, CreateNodeRequest } from "@/types";
import {
  CharacterNodeData,
  FactionNodeData,
  CityNodeData,
  EventNodeData,
  LocationNodeData,
} from "@/types/nodeTypes";
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
  Eye,
  Edit3,
  ChevronDown,
  ChevronRight,
  Move,
} from "lucide-react";
import ConfirmationDialog from "./ui/ConfirmationDialog";
import CharacterNodeView from "./nodeViews/CharacterNodeView";
import CityNodeView from "./nodeViews/CityNodeView";
import EventNodeView from "./nodeViews/EventNodeView";
import FactionNodeView from "./nodeViews/FactionNodeView";
import LocationNodeView from "./nodeViews/LocationNodeView";
import CharacterForm from "./nodeForms/CharacterForm";
import CityForm from "./nodeForms/CityForm";
import EventForm from "./nodeForms/EventForm";
import FactionForm from "./nodeForms/FactionForm";
import LocationForm from "./nodeForms/LocationForm";

interface NodeEditPanelProps {
  node: Node;
  onUpdate: (updatedNode: Node) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

// Use CreateNodeRequest directly as our form data type
type FormDataType = CreateNodeRequest;

const NodeEditPanel: React.FC<NodeEditPanelProps> = React.memo(
  ({ node, onUpdate, onDelete, onClose }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
    const [isFormExpanded, setIsFormExpanded] = useState(true);

    // Separate state for form data and position to handle them differently
    const [formData, setFormData] = useState<FormDataType>(
      node.data as FormDataType
    );
    const [positionData, setPositionData] = useState(node.position);

    // Keep track of the current node ID to detect node changes
    const currentNodeIdRef = useRef(node.id);
    // Store temporary form data that persists across node position updates
    const tempFormDataRef = useRef<FormDataType | null>(null);

    // Memoize icon and color functions
    const getNodeIcon = useCallback((type: NodeType) => {
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
    }, []);

    const getNodeColor = useCallback((type: NodeType) => {
      const colors: Record<NodeType, string> = {
        character: "text-blue-400",
        faction: "text-red-400",
        city: "text-orange-400",
        event: "text-green-400",
        location: "text-purple-400",
      };
      return colors[type] || "text-gray-400";
    }, []);

    // Memoize change detection
    const hasChanges = useMemo(() => {
      const dataChanged =
        JSON.stringify(formData) !== JSON.stringify(node.data);
      const positionChanged =
        positionData.x !== node.position.x ||
        positionData.y !== node.position.y;
      return dataChanged || positionChanged;
    }, [formData, positionData, node.data, node.position]);

    // Memoize event handlers
    const handleInputChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      ) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value } as FormDataType;
        setFormData(newFormData);
        // Store in temp ref to persist across node updates
        tempFormDataRef.current = newFormData;
      },
      [formData]
    );

    const handlePositionChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = parseFloat(value) || 0;
        setPositionData((prev) => ({ ...prev, [name]: numericValue }));
      },
      []
    );

    const handleSave = useCallback(async () => {
      if (!node || !hasChanges) return;

      setIsSaving(true);
      try {
        const updatedNode: Node = {
          ...node,
          data: { ...node.data, ...formData },
          position: positionData,
        };
        await onUpdate(updatedNode);
        // Clear temp form data after successful save
        tempFormDataRef.current = null;
      } catch (error) {
        console.error("Failed to update node:", error);
      } finally {
        setIsSaving(false);
      }
    }, [node, hasChanges, formData, positionData, onUpdate]);

    const handleDeleteClick = useCallback(() => {
      setShowDeleteConfirm(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
      try {
        if (!node) throw new Error("Node not found");
        await onDelete(node.id);
        // Clear temp form data on delete
        tempFormDataRef.current = null;
        onClose();
      } catch (error) {
        console.error("Failed to delete node:", error);
      } finally {
        setShowDeleteConfirm(false);
      }
    }, [node, onDelete, onClose]);

    // Memoize render functions
    const renderNodeView = useCallback(() => {
      // Use current form data for the view to show unsaved changes
      // But ensure the type matches the node type for proper typing
      const baseViewData = { ...node.data, ...formData };

      switch (node.data.type) {
        case "character": {
          const viewData = {
            ...baseViewData,
            type: "character" as const,
          } as CharacterNodeData;
          return <CharacterNodeView data={viewData} />;
        }
        case "city": {
          const viewData = {
            ...baseViewData,
            type: "city" as const,
          } as CityNodeData;
          return <CityNodeView data={viewData} />;
        }
        case "event": {
          const viewData = {
            ...baseViewData,
            type: "event" as const,
          } as EventNodeData;
          return <EventNodeView data={viewData} />;
        }
        case "faction": {
          const viewData = {
            ...baseViewData,
            type: "faction" as const,
          } as FactionNodeData;
          return <FactionNodeView data={viewData} />;
        }
        case "location": {
          const viewData = {
            ...baseViewData,
            type: "location" as const,
          } as LocationNodeData;
          return <LocationNodeView data={viewData} />;
        }
        default:
          return <div className="text-gray-400 p-4">Unknown node type</div>;
      }
    }, [node.data, formData]);

    // Create a setData function that works with CreateNodeRequest
    const createSetData = useCallback((): React.Dispatch<
      React.SetStateAction<CreateNodeRequest>
    > => {
      return (newData) => {
        if (typeof newData === "function") {
          setFormData((prevFormData) => {
            const updatedData = newData(prevFormData);
            tempFormDataRef.current = updatedData;
            return updatedData;
          });
        } else {
          setFormData(newData);
          tempFormDataRef.current = newData;
        }
      };
    }, []);

    const renderNodeForm = useCallback(() => {
      const setData = createSetData();

      switch (node.data.type) {
        case "character": {
          const characterData = formData as CharacterNodeData;
          return <CharacterForm data={characterData} setData={setData} />;
        }
        case "city": {
          const cityData = formData as CityNodeData;
          return <CityForm data={cityData} setData={setData} />;
        }
        case "event": {
          const eventData = formData as EventNodeData;
          return <EventForm data={eventData} setData={setData} />;
        }
        case "faction": {
          const factionData = formData as FactionNodeData;
          return <FactionForm data={factionData} setData={setData} />;
        }
        case "location": {
          const locationData = formData as LocationNodeData;
          return <LocationForm data={locationData} setData={setData} />;
        }
        default:
          return (
            <div className="text-gray-400 p-4">
              No form available for this node type
            </div>
          );
      }
    }, [node.data.type, formData, createSetData]);

    // Memoize tab change handlers
    const handleTabChange = useCallback((tab: "view" | "edit") => {
      setActiveTab(tab);
    }, []);

    // Memoize form toggle handler
    const toggleFormExpanded = useCallback(() => {
      setIsFormExpanded((prev) => !prev);
    }, []);

    // Handle node changes with smart form data preservation
    useEffect(() => {
      if (node) {
        // Check if this is a different node
        const isNewNode = currentNodeIdRef.current !== node.id;

        if (isNewNode) {
          // New node - clear temp data and reset form
          tempFormDataRef.current = null;
          setFormData(node.data as FormDataType);
          currentNodeIdRef.current = node.id;
        } else {
          // Same node - check if we should preserve temp form data
          if (tempFormDataRef.current) {
            // We have unsaved form changes, preserve them
            setFormData(tempFormDataRef.current);
          } else {
            // No unsaved changes, update with node data
            const nodeDataChanged =
              JSON.stringify(formData) !== JSON.stringify(node.data);
            if (nodeDataChanged) {
              setFormData(node.data as FormDataType);
            }
          }
        }

        // Always update position (this comes from external moves)
        setPositionData(node.position);
      }
    }, [node, formData]);

    // Clear temp data when component unmounts
    useEffect(() => {
      return () => {
        tempFormDataRef.current = null;
      };
    }, []);

    return (
      <>
        <div className="h-full flex flex-col bg-gray-800 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <span className={`mr-2 ${getNodeColor(node.data.type)}`}>
                  {getNodeIcon(node.data.type)}
                </span>
                {formData.name || node.data.name || "Unnamed Node"}
              </h2>
              {hasChanges && (
                <span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-2 py-1 rounded">
                  Unsaved
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => handleTabChange("view")}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === "view"
                  ? "text-white border-b-2 border-blue-500 bg-gray-700"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Eye size={16} className="mr-2" />
              View
            </button>
            <button
              onClick={() => handleTabChange("edit")}
              className={`flex items-center px-4 py-2 text-sm font-medium ${
                activeTab === "edit"
                  ? "text-white border-b-2 border-blue-500 bg-gray-700"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Edit3 size={16} className="mr-2" />
              Edit
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "view" ? (
              <div className="p-4">{renderNodeView()}</div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Basic Properties */}
                <div className="space-y-4">
                  {/* Name */}
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
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Node name"
                    />
                  </div>

                  {/* Type */}
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

                  {/* Description */}
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
                      value={formData.description || ""}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Node description"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label
                          htmlFor="x"
                          className="block text-xs text-gray-400 mb-1"
                        >
                          X Coordinate
                        </label>
                        <input
                          type="number"
                          id="x"
                          name="x"
                          value={Math.round(positionData.x)}
                          onChange={handlePositionChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="y"
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Y Coordinate
                        </label>
                        <input
                          type="number"
                          id="y"
                          name="y"
                          value={Math.round(positionData.y)}
                          onChange={handlePositionChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Type-specific Properties */}
                <div className="border-t border-gray-700 pt-4">
                  <button
                    onClick={toggleFormExpanded}
                    className="flex items-center text-sm font-medium text-gray-300 mb-3 hover:text-white"
                  >
                    {isFormExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                    <span className="ml-1 capitalize">
                      {formData.type} Properties
                    </span>
                  </button>
                  {isFormExpanded && (
                    <div className="space-y-4">{renderNodeForm()}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700">
            {/* Node Info */}
            <div className="px-4 pt-3 text-sm text-gray-400">
              <p className="flex items-center pr-1">
                <Move size={14} className="mr-1" />[
                {Math.round(node.position.x)}, {Math.round(node.position.y)}]
                {(positionData.x !== node.position.x ||
                  positionData.y !== node.position.y) && (
                  <span className="ml-2 text-yellow-400">
                    → [{Math.round(positionData.x)},{" "}
                    {Math.round(positionData.y)}]
                  </span>
                )}
              </p>
              <p className="flex items-center pr-1 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                <Key size={14} className="mr-1 flex-shrink-0" />
                <span className="truncate" title={String(node.id)}>
                  {node.id}
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="p-4 flex space-x-2">
              <button
                onClick={handleSave}
                disabled={isSaving || activeTab === "view" || !hasChanges}
                className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save {hasChanges ? "Changes" : ""}
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

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          title="Delete Node"
          message={`Are you sure you want to delete "${formData.name || node.data.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          type="danger"
        />
      </>
    );
  }
);

NodeEditPanel.displayName = "NodeEditPanel";

export default NodeEditPanel;
