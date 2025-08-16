// services/apiService.ts
import { NodesApiService } from "./nodesApiService";
import { EdgesApiService } from "./edgesApiService";
import { MapApiService } from "./mapApiService";
import { HealthApiService } from "./healthApiService";
import { ImportApiService } from "./importApiService";

class ApiService {
  public nodes: NodesApiService;
  public edges: EdgesApiService;
  public map: MapApiService;
  public health: HealthApiService;
  public import: ImportApiService;

  constructor() {
    this.nodes = new NodesApiService();
    this.edges = new EdgesApiService();
    this.map = new MapApiService();
    this.health = new HealthApiService();
    this.import = new ImportApiService();
  }

  setQueryClient(queryClient: any) {
    this.nodes.setQueryClient(queryClient);
    this.edges.setQueryClient(queryClient);
    this.map.setQueryClient(queryClient);
    this.health.setQueryClient(queryClient);
    this.import.setQueryClient(queryClient);
  }

  async initialize(): Promise<void> {
    // Initialize all services
    await Promise.all([
      this.nodes.initialize(),
      this.edges.initialize(),
      this.map.initialize(),
      this.health.initialize(),
      this.import.initialize(),
    ]);
  }
}

export const apiService = new ApiService();
