import { QueryClient } from "@tanstack/react-query";
import { ILogger, logger } from "./loggerService";
import { NodesApiService } from "./nodesApiService";
import { EdgesApiService } from "./edgesApiService";
import { MapApiService } from "./mapApiService";
import { HealthApiService } from "./healthApiService";
import { ImportApiService } from "./importApiService";

export interface ServiceContainer {
  logger: ILogger;
  queryClient: QueryClient;
  nodesApi: NodesApiService;
  edgesApi: EdgesApiService;
  mapApi: MapApiService;
  healthApi: HealthApiService;
  importApi: ImportApiService;
  initialize(): Promise<void>;
}

export interface ServiceFactory {
  createQueryClient(): QueryClient;
  createNodesApi(): NodesApiService;
  createEdgesApi(): EdgesApiService;
  createMapApi(): MapApiService;
  createHealthApi(): HealthApiService;
  createImportApi(): ImportApiService;
}

class DefaultServiceFactory implements ServiceFactory {
  createQueryClient(): QueryClient {
    return new QueryClient({
      defaultOptions: {
        queries: {
          retry: 2,
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 1,
        },
      },
    });
  }

  createNodesApi(): NodesApiService {
    return new NodesApiService();
  }

  createEdgesApi(): EdgesApiService {
    return new EdgesApiService();
  }

  createMapApi(): MapApiService {
    return new MapApiService();
  }

  createHealthApi(): HealthApiService {
    return new HealthApiService();
  }

  createImportApi(): ImportApiService {
    return new ImportApiService();
  }
}

class ServiceContainerImpl implements ServiceContainer {
  private _logger: ILogger;
  private _queryClient: QueryClient;
  private _nodesApi: NodesApiService;
  private _edgesApi: EdgesApiService;
  private _mapApi: MapApiService;
  private _healthApi: HealthApiService;
  private _importApi: ImportApiService;
  private _isInitialized = false;

  constructor(private factory: ServiceFactory = new DefaultServiceFactory()) {
    this._logger = logger;
    this._queryClient = this.factory.createQueryClient();
    this._nodesApi = this.factory.createNodesApi();
    this._edgesApi = this.factory.createEdgesApi();
    this._mapApi = this.factory.createMapApi();
    this._healthApi = this.factory.createHealthApi();
    this._importApi = this.factory.createImportApi();

    this.initializeServices();
  }

  private initializeServices(): void {
    // Set query client for all API services
    this._nodesApi.setQueryClient(this._queryClient);
    this._edgesApi.setQueryClient(this._queryClient);
    this._mapApi.setQueryClient(this._queryClient);
    this._healthApi.setQueryClient(this._queryClient);
    this._importApi.setQueryClient(this._queryClient);
  }

  get logger(): ILogger {
    return this._logger;
  }

  get queryClient(): QueryClient {
    return this._queryClient;
  }

  get nodesApi(): NodesApiService {
    return this._nodesApi;
  }

  get edgesApi(): EdgesApiService {
    return this._edgesApi;
  }

  get mapApi(): MapApiService {
    return this._mapApi;
  }

  get healthApi(): HealthApiService {
    return this._healthApi;
  }

  get importApi(): ImportApiService {
    return this._importApi;
  }

  async initialize(): Promise<void> {
    if (this._isInitialized) {
      this._logger.debug("Service container already initialized, skipping");
      return;
    }

    this._logger.info("Initializing service container");
    
    await Promise.all([
      this._nodesApi.initialize(),
      this._edgesApi.initialize(),
      this._mapApi.initialize(),
      this._healthApi.initialize(),
      this._importApi.initialize(),
    ]);

    this._isInitialized = true;
    this._logger.info("Service container initialized successfully");
  }
}

// Singleton instance
let serviceContainer: ServiceContainer | null = null;

export const createServiceContainer = (factory?: ServiceFactory): ServiceContainer => {
  if (!serviceContainer) {
    serviceContainer = new ServiceContainerImpl(factory);
  }
  return serviceContainer;
};

export const getServiceContainer = (): ServiceContainer => {
  if (!serviceContainer) {
    throw new Error("Service container not initialized. Call createServiceContainer() first.");
  }
  return serviceContainer;
};

// For testing purposes
export const resetServiceContainer = (): void => {
  serviceContainer = null;
};

export default serviceContainer;