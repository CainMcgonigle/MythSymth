import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { BackendManager } from "./backend-manager";

const isDev = process.env.NODE_ENV === "development";
let mainWindow: BrowserWindow | null;
let backendManager: BackendManager;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
      // Add these to prevent CORS issues
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    frame: false,
    titleBarStyle: "hidden", // This ensures no default title bar on macOS
    show: false, // Don't show until ready
    minWidth: 800,
    minHeight: 600,
  });

  if (isDev) {
    // Frontend runs on port 5173 in development
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, we need to handle CORS properly
    // Option 1: Serve frontend from backend (recommended)
    mainWindow.loadURL("http://localhost:8080");

    // Option 2: Load local file with proper headers
    // mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.maximize();
  });

  // Set up window state change listeners
  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window-state-changed", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window-state-changed", false);
  });

  mainWindow.on("restore", () => {
    mainWindow?.webContents.send("window-state-changed", false);
  });
};

app.whenReady().then(async () => {
  // Start backend on port 8080
  backendManager = new BackendManager();
  await backendManager.start();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  if (backendManager) {
    await backendManager.stop();
  }
});

// IPC handler to get backend URL (port 8080)
ipcMain.handle("get-backend-url", () => {
  return backendManager?.getUrl() || "http://localhost:8080";
});

// IPC handler to check backend status
ipcMain.handle("backend-status", () => {
  return backendManager?.isRunning() || false;
});

// Window control IPC handlers
ipcMain.handle("window-minimize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle("window-restore", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.restore();
  }
});

ipcMain.handle("window-close", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
});

ipcMain.handle("window-is-maximized", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow.isMaximized();
  }
  return false;
});
