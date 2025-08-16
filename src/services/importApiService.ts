// services/importApiService.ts
import { BaseApiService } from "./baseApiService";
import { ImportRequest, ImportResponse } from "@/types/import";
import { nodeKeys } from "@/hooks/useNodes";

export class ImportApiService extends BaseApiService {
  async importMap(importData: ImportRequest): Promise<ImportResponse> {
    await this.ensureInitialized();
    const response = await this.axiosInstance!.post<ImportResponse>(
      `/import/map`,
      importData
    );
    if (this.queryClient) {
      // Invalidate all cached data since we've potentially changed everything
      this.queryClient.invalidateQueries({ queryKey: nodeKeys.all });
      this.queryClient.invalidateQueries({ queryKey: ["edges"] });
    }
    return response.data;
  }
}
