import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Handshake,
  Sword,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Coins,
  Settings,
  AlertCircle,
  DollarSign,
  HeartHandshake,
  Link,
  X,
  Star,
  Zap,
  Smile,
  Flame,
} from "lucide-react";
import Select from "react-select";
import type { SingleValue, ActionMeta } from "react-select";
import { customSelectStyles } from "@/styles/customSelect";
import { MythSmithEdgeData } from "@/types";

interface ConnectionModalProps {
  isOpen: boolean;
  isEdit?: boolean;
  initialData?: MythSmithEdgeData & { id?: string };
  onClose: () => void;
  onCreate?: (connectionData: MythSmithEdgeData) => void;
  onUpdate?: (connectionData: MythSmithEdgeData) => void;
  sourceNodeName?: string;
  targetNodeName?: string;
  suggestedType?: string;
}

const connectionTypes = [
  {
    value: "friendship",
    label: "Friendship",
    color: "#10b981",
    Icon: HeartHandshake,
  },
  { value: "rivalry", label: "Rivalry", color: "#ef4444", Icon: Sword },
  { value: "alliance", label: "Alliance", color: "#3b82f6", Icon: ShieldCheck },
  { value: "conflict", label: "Conflict", color: "#f59e0b", Icon: AlertCircle },
  { value: "location", label: "Location", color: "#8b5cf6", Icon: MapPin },
  { value: "event", label: "Event", color: "#06b6d4", Icon: Calendar },
  { value: "family", label: "Family", color: "#ec4899", Icon: Users },
  { value: "trade", label: "Trade", color: "#84cc16", Icon: DollarSign },
  { value: "custom", label: "Custom", color: "#6b7280", Icon: Settings },
];

const customIcons = [
  { name: "Star", Icon: Star },
  { name: "Zap", Icon: Zap },
  { name: "Smile", Icon: Smile },
  { name: "Fire", Icon: Flame },
  { name: "Link", Icon: Link },
  { name: "Handshake", Icon: Handshake },
  { name: "Alert", Icon: AlertTriangle },
  { name: "Settings", Icon: Settings },
  { name: "HeartHandshake", Icon: HeartHandshake },
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "Sword", Icon: Sword },
  { name: "MapPin", Icon: MapPin },
  { name: "Calendar", Icon: Calendar },
  { name: "Users", Icon: Users },
  { name: "DollarSign", Icon: DollarSign },
  { name: "Coins", Icon: Coins },
];

const strengthLevels = [
  { value: "weak", label: "Weak", description: "Minor connection" },
  { value: "moderate", label: "Moderate", description: "Standard connection" },
  { value: "strong", label: "Strong", description: "Important connection" },
];

const options = connectionTypes.map((type) => ({
  value: type.value,
  label: (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <type.Icon size={16} color={type.color} />
      <span>{type.label}</span>
    </div>
  ),
}));

const buildBaseData = (suggestedType?: string): MythSmithEdgeData => ({
  type: (suggestedType as MythSmithEdgeData["type"]) || "custom",
  strength: "moderate",
  bidirectional: false,
  animated: false,
  customIconName: "Settings",
  customColor: "#6b7280",
  label: "",
  description: "",
});

const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  isEdit = false,
  initialData,
  onClose,
  onCreate,
  onUpdate,
  sourceNodeName,
  targetNodeName,
  suggestedType,
}) => {
  const [connectionData, setConnectionData] =
    useState<MythSmithEdgeData | null>(null);

  const resetToBase = useCallback(() => {
    setConnectionData(buildBaseData(suggestedType));
  }, [suggestedType]);

  const handleClose = useCallback(() => {
    resetToBase();
    onClose();
  }, [onClose, resetToBase]);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && initialData) setConnectionData({ ...initialData });
      else resetToBase();
    } else {
      setConnectionData(null);
    }
  }, [isOpen, isEdit, initialData, resetToBase]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, handleClose]);

  const handleInputChange = useCallback(
    (field: keyof MythSmithEdgeData, value: string | number | boolean) => {
      setConnectionData((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const handleTypeChange = useCallback(
    (
      option: SingleValue<{ value: string; label: React.ReactElement }>,
      _actionMeta: ActionMeta<{ value: string; label: React.ReactElement }>
    ) => {
      const type = option
        ? (option.value as MythSmithEdgeData["type"])
        : "custom";
      handleInputChange("type", type);
      if (type === "custom") {
        setConnectionData((prev) =>
          prev
            ? {
                ...prev,
                customIconName: prev.customIconName || "Settings",
                customColor: prev.customColor || "#6b7280",
              }
            : prev
        );
      }
    },
    [handleInputChange]
  );

  const currentColor = useMemo(() => {
    if (!connectionData) return "#6b7280";
    if (connectionData.type === "custom")
      return connectionData.customColor || "#6b7280";
    return (
      connectionTypes.find((t) => t.value === connectionData.type)?.color ||
      "#6b7280"
    );
  }, [connectionData]);

  const SelectedIcon = useMemo(() => {
    if (!connectionData) return Settings;
    if (connectionData.type === "custom") {
      return (
        customIcons.find((c) => c.name === connectionData.customIconName)
          ?.Icon || Settings
      );
    }
    return (
      connectionTypes.find((t) => t.value === connectionData.type)?.Icon ||
      Settings
    );
  }, [connectionData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!connectionData) return;

      const completeData: MythSmithEdgeData = {
        customColor: connectionData.customColor || "#6b7280",
        customIconName: connectionData.customIconName || "Settings",
        type: connectionData.type,
        strength: connectionData.strength,
        bidirectional: connectionData.bidirectional || false,
        animated: connectionData.animated || false,
        label: connectionData.label,
        description: connectionData.description,
      };

      if (isEdit && onUpdate) onUpdate(completeData);
      else if (onCreate) onCreate(completeData);

      handleClose();
    },
    [connectionData, isEdit, onUpdate, onCreate, handleClose]
  );

  const modalKey = isEdit
    ? `edit-${initialData?.id ?? initialData?.label ?? ""}`
    : `create-${sourceNodeName ?? ""}-${targetNodeName ?? ""}`;

  if (!isOpen || !connectionData) return null;

  return (
    <div
      key={modalKey}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <SelectedIcon className="w-5 h-5" color={currentColor} />
            <h2 className="text-lg font-semibold text-white">
              {isEdit ? "Edit Connection" : "Create Connection"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {sourceNodeName && targetNodeName && (
            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-400 font-medium">
                  {sourceNodeName}
                </span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentColor }}
                  />
                  {connectionData.bidirectional ? "↔️" : "→"}
                </div>
                <span className="text-green-400 font-medium">
                  {targetNodeName}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Connection Type
            </label>
            <Select
              options={options}
              onChange={handleTypeChange}
              value={options.find((opt) => opt.value === connectionData.type)}
              styles={customSelectStyles}
              instanceId="connection-type-select"
            />
          </div>

          {connectionData.type === "custom" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose Icon
                </label>
                <div className="flex flex-wrap gap-3">
                  {customIcons.map(({ name, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleInputChange("customIconName", name)}
                      className={`p-2 rounded-md border ${
                        connectionData.customIconName === name
                          ? "border-blue-500 bg-gray-700"
                          : "border-transparent hover:bg-gray-700"
                      }`}
                      title={name}
                      aria-label={`Select ${name} icon`}
                    >
                      <Icon
                        size={20}
                        color={
                          connectionData.customIconName === name
                            ? "#3b82f6"
                            : "#9ca3af"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose Color
                </label>
                <input
                  type="color"
                  value={connectionData.customColor || "#6b7280"}
                  onChange={(e) =>
                    handleInputChange("customColor", e.target.value)
                  }
                  className="w-16 h-8 rounded-md cursor-pointer border border-gray-600"
                  aria-label="Select custom color"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Connection Strength
            </label>
            <div className="space-y-2">
              {strengthLevels.map((level) => (
                <label
                  key={level.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="strength"
                    value={level.value}
                    checked={connectionData.strength === level.value}
                    onChange={(e) =>
                      handleInputChange(
                        "strength",
                        e.target.value as MythSmithEdgeData["strength"]
                      )
                    }
                  />
                  <span className="text-white">{level.label}</span>
                  <span className="text-gray-400 text-sm">
                    - {level.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Label (optional)
            </label>
            <input
              type="text"
              value={connectionData.label || ""}
              onChange={(e) => handleInputChange("label", e.target.value)}
              placeholder="e.g., 'Best friends'"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={connectionData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              placeholder="Describe the connection..."
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={connectionData.bidirectional || false}
                onChange={(e) =>
                  handleInputChange("bidirectional", e.target.checked)
                }
              />
              <span className="text-white">Bidirectional</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={connectionData.animated || false}
                onChange={(e) =>
                  handleInputChange("animated", e.target.checked)
                }
              />
              <span className="text-white">Animated</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              {isEdit ? "Update Connection" : "Create Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectionModal;
