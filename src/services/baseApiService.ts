// services/baseApiService.ts
import axios, { AxiosInstance } from "axios";

export class BaseApiService {
  protected axiosInstance: AxiosInstance | null = null;
  protected initializationPromise: Promise<void> | null = null;
  protected baseURL: string | null = null;
  protected queryClient: any = null;

  constructor() {}

  setQueryClient(queryClient: any) {
    this.queryClient = queryClient;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    if (this.baseURL) {
      return Promise.resolve();
    }
    this.initializationPromise = (async () => {
      let finalBaseURL = "http://localhost:8080";
      try {
        if (window.electronAPI) {
          const backendUrl = await window.electronAPI.getBackendUrl();
          finalBaseURL = backendUrl.endsWith("/")
            ? backendUrl.slice(0, -1)
            : backendUrl;
        }
      } catch (error) {
        console.warn(
          "Failed to get backend URL from Electron, using default:",
          error
        );
      } finally {
        this.baseURL = finalBaseURL;
        this.axiosInstance = axios.create({
          baseURL: this.baseURL,
          timeout: 5000,
        });
        console.log(`API Service initialized with URL: ${this.baseURL}`);
        this.initializationPromise = null;
      }
    })();
    return this.initializationPromise;
  }

  protected async ensureInitialized(): Promise<void> {
    if (!this.baseURL) {
      await this.initialize();
    }
  }
}
