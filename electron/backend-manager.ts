import { spawn, ChildProcess } from "child_process";
import path, { join } from "path";
import { app } from "electron";
import { existsSync, mkdirSync } from "fs";

export class BackendManager {
  private process: ChildProcess | null = null;
  private port = 8080;
  private url = `http://localhost:${this.port}`;

  async start(): Promise<void> {
    if (this.process) {
      console.log("Backend already running");
      return;
    }

    const backendPath = this.getBackendPath();

    if (!existsSync(backendPath)) {
      throw new Error(`Backend binary not found at: ${backendPath}`);
    }

    // ✅ Ensure data dir exists
    const dataDir = join(app.getPath("userData"), "data");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    console.log(`Starting backend from: ${backendPath}`);
    console.log(`Using data dir: ${dataDir}`);

    this.process = spawn(backendPath, [`--port=${this.port}`], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        MYTHSMITH_DATA_DIR: dataDir,
      },
    });

    this.process.stdout?.on("data", (data) => {
      console.log(`Backend stdout: ${data}`);
    });

    this.process.stderr?.on("data", (data) => {
      console.error(`Backend stderr: ${data}`);
    });

    this.process.on("error", (error) => {
      console.error("Backend process error:", error);
    });

    this.process.on("exit", (code) => {
      console.log(`Backend process exited with code: ${code}`);
      this.process = null;
    });

    await this.waitForBackend();
  }

  async stop(): Promise<void> {
    if (this.process) {
      console.log("Stopping backend...");
      this.process.kill("SIGTERM");
      this.process = null;
    }
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }

  getUrl(): string {
    return this.url;
  }

  getBackendPath() {
    const isDev = process.env.NODE_ENV === "development";
    const platform = process.platform;
    const extension = platform === "win32" ? ".exe" : "";

    if (isDev) {
      return path.join(
        __dirname,
        "../dist/backend/mythsmith-backend" + extension
      );
    } else {
      return path.join(
        process.resourcesPath,
        "backend/mythsmith-backend" + extension
      );
    }
  }

  private async waitForBackend(maxRetries = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${this.url}/health`);
        if (response.ok) {
          console.log("Backend is ready!");
          return;
        }
      } catch {
        // Ignore connection errors while waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Backend failed to start within timeout period");
  }
}
