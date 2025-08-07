import axios, { AxiosInstance } from "axios";
import {
  Node,
  CreateNodeRequest,
  UpdateNodeRequest,
  ApiResponse,
  Edge,
  MapData,
} from "@/types";
import { nodeKeys } from "@/hooks/useNodes";

class ApiService {
  private axiosInstance: AxiosInstance | null = null;
  private initializationPromise: Promise<void> | null = null;
  private baseURL: string | null = null;
  private queryClient: any = null;

  constructor() {
    // The constructor remains empty to allow lazy initialization.
  }

  // Set the query client instance
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

  private async ensureInitialized(): Promise<void> {
    if (!this.baseURL) {
      await this.initialize();
    }
  }

  async getNodes(type?: string): Promise<Node[]> {
    await this.ensureInitialized();

    // If we have a query client, try to get data from cache first
    if (this.queryClient) {
      try {
        const cachedData = this.queryClient.getQueryData(nodeKeys.list(type));
        if (cachedData) {
          return cachedData;
        }
      } catch (error) {
        // Cache miss, continue with API call
      }
    }

    const params = type ? { type } : {};
    const response = await this.axiosInstance!.get<ApiResponse<Node>>(
      `/nodes`,
      { params }
    );
    const nodes = response.data.nodes || [];

    // Update cache if we have a query client
    if (this.queryClient) {
      this.queryClient.setQueryData(nodeKeys.list(type), nodes);
    }

    return nodes;
  }

  async getNode(id: string): Promise<Node> {
    await this.ensureInitialized();

    // If we have a query client, try to get data from cache first
    if (this.queryClient) {
      try {
        const cachedData = this.queryClient.getQueryData(nodeKeys.detail(id));
        if (cachedData) {
          return cachedData;
        }
      } catch (error) {
        // Cache miss, continue with API call
      }
    }

    const response = await this.axiosInstance!.get<Node>(`/nodes/${id}`);
    const node = response.data;

    // Update cache if we have a query client
    if (this.queryClient) {
      this.queryClient.setQueryData(nodeKeys.detail(id), node);
    }

    return node;
  }

  async createNode(node: CreateNodeRequest): Promise<Node> {
    await this.ensureInitialized();

    const response = await this.axiosInstance!.post<Node>(`/nodes`, node);
    const newNode = response.data;

    // Update cache if we have a query client
    if (this.queryClient) {
      // Invalidate nodes list to refetch
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      // Add the new node to cache
      this.queryClient.setQueryData(nodeKeys.detail(newNode.id), newNode);
    }

    return newNode;
  }

  async updateNode(id: string, updates: UpdateNodeRequest): Promise<Node> {
    await this.ensureInitialized();

    const response = await this.axiosInstance!.put<Node>(
      `/nodes/${id}`,
      updates
    );
    const updatedNode = response.data;

    // Update cache if we have a query client
    if (this.queryClient) {
      // Update the node in cache
      this.queryClient.setQueryData(nodeKeys.detail(id), updatedNode);
      // Invalidate nodes list to ensure consistency
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    }

    return updatedNode;
  }

  async updateNodePositions(
    positions: Array<{ id: number; x: number; y: number }>
  ): Promise<void> {
    await this.ensureInitialized();

    await this.axiosInstance!.put(`/nodes/positions`, { nodes: positions });

    // Update cache if we have a query client
    if (this.queryClient) {
      // Invalidate all node queries to refetch updated positions
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    }
  }

  async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized();

    await this.axiosInstance!.delete(`/nodes/${id}`);

    // Update cache if we have a query client
    if (this.queryClient) {
      // Remove the node from cache
      this.queryClient.removeQueries({
        queryKey: nodeKeys.detail(id),
      });
      // Invalidate nodes list
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    }
  }

  /**
   * Fetches all edges (connections) from the backend.
   */
  async getEdges(): Promise<Edge[]> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.get<ApiResponse<Edge>>(`/edges`);
    return response.data.edges || [];
  }

  /**
   * Saves all nodes and edges in one API call.
   * This is used for the auto-save functionality.
   */
  async saveMap(mapData: MapData): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.put(`/map`, mapData);

    // Update cache if we have a query client
    if (this.queryClient) {
      // Invalidate all node queries to refetch updated data
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    }
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
