export const isElectron = (): boolean => {
  // Method 1: Check for electronAPI in window object
  if (typeof window !== "undefined" && window.electronAPI) {
    return true;
  }

  // Method 2: Check for electron in user agent
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return navigator.userAgent.toLowerCase().includes("electron");
  }

  // Method 3: Check for electron-specific properties
  if (typeof window !== "undefined") {
    // Check for common Electron globals
    const electronIndicators = [
      "require" in window,
      "module" in window,
      "process" in window && (window as unknown as { process?: { type?: string } }).process?.type,
      "__dirname" in window,
      "__filename" in window,
    ];

    if (electronIndicators.some((indicator) => indicator)) {
      return true;
    }
  }

  // Method 4: Check process object (if available)
  if (
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.electron
  ) {
    return true;
  }

  return false;
};

/**
 * Check if running in development mode within Electron
 */
export const isElectronDev = (): boolean => {
  if (!isElectron()) return false;

  // Check for development indicators
  return (
    (typeof process !== "undefined" &&
      process.env && process.env.NODE_ENV === "development") ||
    (typeof window !== "undefined" && window.location?.hostname === "localhost")
  );
};

/**
 * Check if running in production Electron build
 */
export const isElectronProd = (): boolean => {
  return isElectron() && !isElectronDev();
};

/**
 * Get the platform when running in Electron
 */
export const getElectronPlatform = (): string | null => {
  if (!isElectron()) return null;

  if (typeof process !== "undefined" && process.platform) {
    return process.platform;
  }

  // Fallback to user agent detection
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("win")) return "win32";
  if (userAgent.includes("mac")) return "darwin";
  if (userAgent.includes("linux")) return "linux";

  return null;
};

/**
 * Check if the window should show custom title bar
 * This accounts for platform-specific behaviors
 */
export const shouldShowCustomTitleBar = (): boolean => {
  if (!isElectron()) return false;

  const platform = getElectronPlatform();

  // On macOS, you might want different behavior
  // Uncomment the line below if you want to hide title bar on macOS
  // if (platform === 'darwin') return false;

  return true;
};

/**
 * React hook to detect Electron environment
 */
import { useState, useEffect } from "react";

export const useIsElectron = () => {
  const [electronEnv, setElectronEnv] = useState({
    isElectron: false,
    isElectronDev: false,
    platform: null as string | null,
    shouldShowTitleBar: false,
  });

  useEffect(() => {
    // Run detection after component mounts to avoid SSR issues
    const checkElectron = () => {
      const electronDetected = isElectron();
      setElectronEnv({
        isElectron: electronDetected,
        isElectronDev: isElectronDev(),
        platform: getElectronPlatform(),
        shouldShowTitleBar: shouldShowCustomTitleBar(),
      });
    };

    // Check immediately
    checkElectron();

    // Also check after a short delay to ensure all APIs are loaded
    const timer = setTimeout(checkElectron, 100);

    return () => clearTimeout(timer);
  }, []);

  return electronEnv;
};
