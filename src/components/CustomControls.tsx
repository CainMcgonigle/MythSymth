import React, { useState, useRef, useEffect } from "react";
import { useReactFlow } from "reactflow";
import {
  Grid3X3Icon,
  Minus,
  Plus,
  Hand,
  MousePointer2,
  Save,
  Timer,
} from "lucide-react";

// The new props for interactivity and additional controls
interface CustomControlsProps {
  snapToGrid: boolean;
  setSnapToGrid: (value: boolean) => void;
  isInteractive: boolean;
  setIsInteractive: (value: boolean) => void;
  // Auto-save props
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (value: boolean) => void;
  autoSaveInterval: number;
  setAutoSaveInterval: (value: number) => void;
  // Save props
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving: boolean;
}

const CustomControls: React.FC<CustomControlsProps> = ({
  snapToGrid,
  setSnapToGrid,
  isInteractive,
  setIsInteractive,
  autoSaveEnabled,
  setAutoSaveEnabled,
  autoSaveInterval,
  setAutoSaveInterval,
  hasUnsavedChanges,
  onSave,
  isSaving,
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [showIntervalPopup, setShowIntervalPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Format auto-save interval for display
  const formatInterval = (ms: number) => {
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowIntervalPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-save interval options
  const intervalOptions = [
    { value: 15, label: "15 seconds" },
    { value: 30, label: "30 seconds" },
    { value: 60, label: "1 minute" },
    { value: 300, label: "5 minutes" },
  ];

  return (
    <div className="flex flex-col space-y-2">
      {/* View Controls */}
      <div className="react-flow__controls bg-gray-800 border border-gray-600 rounded-lg p-1">
        <button
          className="react-flow__controls-button text-gray-700 hover:text-gray-900"
          title="zoom in"
          aria-label="zoom in"
          onClick={() => zoomIn()}
        >
          <Plus size={16} />
        </button>
        <button
          className="react-flow__controls-button text-gray-700 hover:text-gray-900"
          title="zoom out"
          aria-label="zoom out"
          onClick={() => zoomOut()}
        >
          <Minus size={16} />
        </button>
        <button
          className="react-flow__controls-button text-gray-700 hover:text-gray-900"
          title="fit view"
          aria-label="fit view"
          onClick={() => fitView()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 30"
            className="w-4 h-4"
          >
            <path
              d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </div>

      {/* Save Controls */}
      <div className="react-flow__controls bg-gray-800 border border-gray-600 rounded-lg p-1">
        <button
          className={`react-flow__controls-button ${
            hasUnsavedChanges && !isSaving
              ? "text-green-500 hover:text-green-400"
              : "text-gray-600"
          }`}
          title={
            isSaving
              ? "Saving..."
              : hasUnsavedChanges
                ? "Save Changes (Ctrl+S)"
                : "All Changes Saved"
          }
          aria-label="save"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin mr-1"></div>
            </div>
          ) : (
            <Save size={16} />
          )}
        </button>
      </div>

      {/* Settings Controls */}
      <div className="react-flow__controls bg-gray-800 border border-gray-600 rounded-lg p-1 relative">
        {/* The new button toggles the `isInteractive` state */}
        <button
          className={`react-flow__controls-button ${
            isInteractive ? "text-gray-700" : "text-blue-500"
          }`}
          title={isInteractive ? "Lock Interactivity" : "Unlock Interactivity"}
          aria-label="toggle interactivity"
          onClick={() => setIsInteractive(!isInteractive)}
        >
          {isInteractive ? <MousePointer2 size={16} /> : <Hand size={16} />}
        </button>

        {/* Your custom snap button */}
        <button
          className={`react-flow__controls-button ${
            !snapToGrid ? "text-gray-400" : "text-blue-500"
          }`}
          title={snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}
          aria-label="toggle snap to grid"
          onClick={() => setSnapToGrid(!snapToGrid)}
        >
          <Grid3X3Icon size={16} />
        </button>

        {/* Auto-save toggle with interval popup */}
        <div className="relative">
          <button
            className={`react-flow__controls-button ${
              autoSaveEnabled ? "text-blue-500" : "text-gray-400"
            }`}
            title={
              autoSaveEnabled
                ? `Disable Auto-save (${formatInterval(autoSaveInterval)})`
                : "Enable Auto-save"
            }
            aria-label="toggle auto-save"
            onClick={() => {
              if (autoSaveEnabled) {
                setShowIntervalPopup(!showIntervalPopup);
              } else {
                setAutoSaveEnabled(true);
              }
            }}
          >
            <Timer size={16} />
          </button>

          {/* Auto-save interval popup */}
          {autoSaveEnabled && showIntervalPopup && (
            <div
              ref={popupRef}
              className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 min-w-[160px] shadow-lg z-10"
            >
              <div className="text-gray-300 text-xs font-semibold mb-1.5">
                Auto-save Interval
              </div>
              <div>
                {intervalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setAutoSaveInterval(option.value * 1000);
                      setShowIntervalPopup(false);
                    }}
                    className={`block w-full py-1 px-2 mb-1 rounded text-left text-xs ${
                      autoSaveInterval === option.value * 1000
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-600 pt-1.5 mt-1 flex justify-between">
                <button
                  onClick={() => setAutoSaveEnabled(false)}
                  className="py-1 px-2 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600"
                >
                  Disable
                </button>
                <button
                  onClick={() => setShowIntervalPopup(false)}
                  className="py-1 px-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomControls;
