// services/nodesApiService.ts
import { BaseApiService } from "./baseApiService";
import { Node, CreateNodeRequest, UpdateNodeRequest } from "@/types";
import { flattenNodes } from "@/utils/flattenNodeData";
import { nodeKeys } from "@/hooks/useNodes";

export class NodesApiService extends BaseApiService {
  async getNodes(type?: string): Promise<Node[]> {
    await this.ensureInitialized();
    if (this.queryClient) {
      try {
        const cachedData = this.queryClient.getQueryData(nodeKeys.list(type));
        if (cachedData) {
          return cachedData;
        }
      } catch (error) {}
    }
    const params = type ? { type } : {};
    const response = await this.axiosInstance!.get(`/nodes`, { params });
    const nodes = response.data.nodes || [];
    const flatNodes = flattenNodes(nodes);
    if (this.queryClient) {
      this.queryClient.setQueryData(nodeKeys.list(type), flatNodes);
    }
    return flatNodes;
  }

  async getNode(id: string): Promise<Node> {
    await this.ensureInitialized();
    if (this.queryClient) {
      try {
        const cachedData = this.queryClient.getQueryData(nodeKeys.detail(id));
        if (cachedData) {
          return cachedData;
        }
      } catch (error) {}
    }
    const response = await this.axiosInstance!.get(`/nodes/${id}`);
    const node = response.data;
    if (this.queryClient) {
      this.queryClient.setQueryData(nodeKeys.detail(id), node);
    }
    return node;
  }

  async createNode(node: CreateNodeRequest): Promise<Node> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.post(`/nodes`, node);
    const newNode = response.data;
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      this.queryClient.setQueryData(nodeKeys.detail(newNode.id), newNode);
    }
    return newNode;
  }

  async updateNode(id: string, updates: UpdateNodeRequest): Promise<Node> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.put(`/nodes/${id}`, updates);
    const updatedNode = response.data;
    if (this.queryClient) {
      this.queryClient.setQueryData(nodeKeys.detail(id), updatedNode);
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    }
    return updatedNode;
  }

  async updateNodePositions(
    positions: Array<{ id: number; x: number; y: number }>
  ): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.put(`/nodes/positions`, { nodes: positions });
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    }
  }

  async deleteNode(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.delete(`/nodes/${id}`);
    if (this.queryClient) {
      this.queryClient.removeQueries({
        queryKey: nodeKeys.detail(id),
      });
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    }
  }
}
