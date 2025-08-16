// services/healthApiService.ts
import { BaseApiService } from "./baseApiService";
import axios from "axios";

export class HealthApiService extends BaseApiService {
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
