import React, { useState, useEffect } from "react";
import { Minus, Square, X, Menu, Settings, Copy } from "lucide-react";
import {
  isElectron,
  shouldShowCustomTitleBar,
} from "@/utils/electronDetection";

interface TitleBarProps {
  title?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = "MythSmith",
  showMenu = true,
  onMenuClick,
  onSettingsClick,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [showTitleBar, setShowTitleBar] = useState(false);

  useEffect(() => {
    // Check if we should show the title bar
    const shouldShow = shouldShowCustomTitleBar();
    setShowTitleBar(shouldShow);

    // Only set up window state listeners if in Electron
    if (shouldShow && window.electronAPI) {
      // Check initial window state
      window.electronAPI
        .isWindowMaximized()
        .then(setIsMaximized)
        .catch(() => {
          // Handle case where API isn't ready yet
          setIsMaximized(false);
        });

      // Listen for window state changes
      window.electronAPI.onWindowStateChange(setIsMaximized);

      // Cleanup listener on unmount
      return () => {
        window.electronAPI?.removeWindowStateListener();
      };
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximizeRestore = () => {
    if (window.electronAPI) {
      if (isMaximized) {
        window.electronAPI.restoreWindow();
      } else {
        window.electronAPI.maximizeWindow();
      }
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  // Don't render anything if not in Electron or shouldn't show title bar
  if (!showTitleBar) {
    return null;
  }

  return (
    <div className="flex items-center h-8 bg-neutral-950 border-b border-neutral-700 select-none z-50 relative">
      {/* Left section - Menu buttons (optional) */}
      <div className="flex items-center px-3 app-drag-region"></div>

      {/* Center section - Title (absolutely positioned to center) */}
      <div className="absolute inset-0 flex items-center justify-center app-drag-region pointer-events-none">
        <span className="text-sm text-gray-200 font-medium truncate max-w-md px-4">
          {title}
        </span>
      </div>

      {/* Spacer to balance the layout */}
      <div className="flex-1 app-drag-region"></div>

      {/* Right section - Window controls */}
      <div className="flex relative z-10">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-12 h-8 text-gray-400 hover:text-white hover:bg-neutral-700 transition-colors duration-150 no-drag group"
          title="Minimize"
        >
          <Minus
            size={14}
            className="group-hover:scale-110 transition-transform"
          />
        </button>

        <button
          onClick={handleMaximizeRestore}
          className="flex items-center justify-center w-12 h-8 text-gray-400 hover:text-white hover:bg-neutral-700 transition-colors duration-150 no-drag group"
          title={isMaximized ? "Restore Down" : "Maximize"}
        >
          {isMaximized ? (
            <Copy
              size={12}
              className="group-hover:scale-110 transition-transform"
              style={{ transform: "rotate(180deg)" }}
            />
          ) : (
            <Square
              size={12}
              className="group-hover:scale-110 transition-transform"
            />
          )}
        </button>

        <button
          onClick={handleClose}
          className="flex items-center justify-center w-12 h-8 text-gray-400 hover:text-white hover:bg-red-500 transition-colors duration-150 no-drag group"
          title="Close"
        >
          <X size={14} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};
