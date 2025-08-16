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
    },

    frame: false,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
  }
};

app.whenReady().then(async () => {
  backendManager = new BackendManager();
  await backendManager.start();

  createWindow();

  if (mainWindow) {
    mainWindow.maximize();
  }

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

ipcMain.handle("get-backend-url", () => {
  return backendManager?.getUrl() || "http://localhost:8080";
});

ipcMain.handle("backend-status", () => {
  return backendManager?.isRunning() || false;
});
