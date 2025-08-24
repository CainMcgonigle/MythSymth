// services/baseApiService.ts
import axios, { AxiosInstance, AxiosError } from "axios";
import { QueryClient } from "@tanstack/react-query";
import { createContextLogger } from "./loggerService";

export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: unknown;
}

export class BaseApiService {
  protected axiosInstance: AxiosInstance | null = null;
  protected initializationPromise: Promise<void> | null = null;
  protected baseURL: string | null = null;
  protected queryClient: QueryClient | null = null;
  protected logger = createContextLogger('BaseApiService');

  constructor() {}

  setQueryClient(queryClient: QueryClient): void {
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
        this.logger.warn(
          "Failed to get backend URL from Electron, using default",
          error instanceof Error ? error : undefined,
          { defaultUrl: finalBaseURL }
        );
      } finally {
        this.baseURL = finalBaseURL;
        this.axiosInstance = this.createAxiosInstance();
        this.logger.info("API Service initialized", { baseURL: this.baseURL });
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

  protected createAxiosInstance(): AxiosInstance {
    const instance = axios.create({
      baseURL: this.baseURL!,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        this.logger.debug("API Request", {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
        });
        return config;
      },
      (error: AxiosError) => {
        this.logger.error("API Request Error", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    instance.interceptors.response.use(
      (response) => {
        this.logger.debug("API Response", {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length,
        });
        return response;
      },
      (error: AxiosError) => {
        this.logger.error("API Response Error", error, {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });
        return Promise.reject(this.normalizeError(error));
      }
    );

    return instance;
  }

  protected normalizeError(error: AxiosError): ApiError {
    const message = error.response?.data?.message || error.message || 'Unknown API error';
    const normalizedError = new Error(message) as ApiError;
    normalizedError.status = error.response?.status;
    normalizedError.code = error.code;
    normalizedError.response = error.response?.data;
    return normalizedError;
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, lastError);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }
}
