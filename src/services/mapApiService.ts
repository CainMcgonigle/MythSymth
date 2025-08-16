// services/mapApiService.ts
import { BaseApiService } from "./baseApiService";
import { MapData } from "@/types";
import { nodeKeys } from "@/hooks/useNodes";

export class MapApiService extends BaseApiService {
  async saveMap(mapData: MapData): Promise<void> {
    await this.ensureInitialized();
    await this.axiosInstance!.put(`/map`, mapData);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    }
  }
}
