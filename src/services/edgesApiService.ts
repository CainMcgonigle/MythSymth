// services/edgesApiService.ts
import { BaseApiService } from "./baseApiService";
import { Edge } from "@/types";
import { flattenEdges } from "@/utils/flattenEdgeData";

export class EdgesApiService extends BaseApiService {
  async getEdges(): Promise<Edge[]> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.get(`/edges`);
    const edges = response.data.edges || [];
    return flattenEdges(edges);
  }
}
