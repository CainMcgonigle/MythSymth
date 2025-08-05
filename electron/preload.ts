import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  getBackendStatus: () => ipcRenderer.invoke('backend-status'),
})

// Type definitions for the exposed API
export interface ElectronAPI {
  getBackendUrl(): Promise<string>
  getBackendStatus(): Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}