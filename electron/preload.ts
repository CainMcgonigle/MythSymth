import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getBackendUrl: () => ipcRenderer.invoke("get-backend-url"),
  getBackendStatus: () => ipcRenderer.invoke("backend-status"),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  restoreWindow: () => ipcRenderer.invoke("window-restore"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
  isWindowMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Listen for window state changes
  onWindowStateChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on("window-state-changed", (_, isMaximized) =>
      callback(isMaximized)
    );
  },

  // Clean up listeners
  removeWindowStateListener: () => {
    ipcRenderer.removeAllListeners("window-state-changed");
  },
});

export interface ElectronAPI {
  getBackendUrl(): Promise<string>;
  getBackendStatus(): Promise<boolean>;

  // Window controls
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  restoreWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  isWindowMaximized(): Promise<boolean>;
  onWindowStateChange(callback: (isMaximized: boolean) => void): void;
  removeWindowStateListener(): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
