import axios, { AxiosInstance } from "axios";
import {
  Node,
  CreateNodeRequest,
  UpdateNodeRequest,
  ApiResponse,
  Edge,
  MapData,
} from "../types";

class ApiService {
  private axiosInstance: AxiosInstance | null = null;
  private initializationPromise: Promise<void> | null = null;
  private baseURL: string | null = null;

  constructor() {
    // The constructor remains empty to allow lazy initialization.
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    if (this.baseURL) {
      return Promise.resolve();
    }

    this.initializationPromise = (async () => {
      let finalBaseURL = "http://localhost:8080"; // Default URL
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
          error,
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

  private async ensureInitialized(): Promise<void> {
    if (!this.baseURL) {
      await this.initialize();
    }
  }

  async getNodes(type?: string): Promise<Node[]> {
    await this.ensureInitialized();
    const params = type ? { type } : {};
    const response = await this.axiosInstance!.get<ApiResponse<Node>>(
      `/nodes`,
      { params },
    );
    return response.data.nodes || [];
  }

  async getNode(id: number): Promise<Node> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.get<Node>(`/nodes/${id}`);
    return response.data;
  }

  async createNode(node: CreateNodeRequest): Promise<Node> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.post<Node>(`/nodes`, node);
    return response.data;
  }

  async updateNode(id: number, updates: UpdateNodeRequest): Promise<Node> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.put<Node>(
      `/nodes/${id}`,
      updates,
    );
    return response.data;
  }

  async updateNodePositions(
    positions: Array<{ id: number; x: number; y: number }>,
  ): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.put(`/nodes/positions`, { nodes: positions });
  }

  async deleteNode(id: number): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.delete(`/nodes/${id}`);
  }

  /**
   * NEW: Fetches all edges (connections) from the backend.
   */
  async getEdges(): Promise<Edge[]> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.get<ApiResponse<Edge>>(`/edges`);
    return response.data.edges || [];
  }

  /**
   * NEW: Saves all nodes and edges in one API call.
   * This is used for the auto-save functionality.
   */
  async saveMap(mapData: MapData): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.put(`/map`, mapData);
  }

  async checkHealth(): Promise<boolean> {
    await this.ensureInitialized();
    try {
      if (!this.baseURL) {
        throw new Error("API service not initialized");
      }
      const baseUrl = new URL(this.baseURL);
      const healthUrl = `${baseUrl.origin}/health`;
      await axios.get(healthUrl, { timeout: 3000 });
      console.log("API Health Check: Healthy");
      return true;
    } catch (error) {
      console.error("API Health Check: Unhealthy", error);
      return false;
    }
  }
}

export const apiService = new ApiService();
