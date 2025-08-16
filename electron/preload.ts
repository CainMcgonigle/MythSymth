import { contextBridge, ipcRenderer } from "electron";



contextBridge.exposeInMainWorld("electronAPI", {
  getBackendUrl: () => ipcRenderer.invoke("get-backend-url"),
  getBackendStatus: () => ipcRenderer.invoke("backend-status"),
});


export interface ElectronAPI {
  getBackendUrl(): Promise<string>;
  getBackendStatus(): Promise<boolean>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
