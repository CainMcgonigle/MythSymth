import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { Node, CreateNodeRequest, UpdateNodeRequest, NodeType } from "../types";

// Query Keys
export const nodeKeys = {
  all: ["nodes"] as const,
  lists: () => [...nodeKeys.all, "list"] as const,
  list: (type?: string) => [...nodeKeys.lists(), type] as const,
  details: () => [...nodeKeys.all, "detail"] as const,
  detail: (id: number) => [...nodeKeys.details(), id] as const,
};

// Hook to fetch all nodes with optional type filter
export const useNodes = (type?: NodeType) => {
  return useQuery({
    queryKey: nodeKeys.list(type),
    queryFn: () => apiService.getNodes(type),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// Hook to fetch a single node
export const useNode = (id: number, enabled = true) => {
  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: () => apiService.getNode(id),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to create a new node
export const useCreateNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (node: CreateNodeRequest) => apiService.createNode(node),
    onSuccess: (newNode) => {
      // Invalidate and refetch nodes list
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });

      // Optionally add the new node to the cache
      queryClient.setQueryData(nodeKeys.detail(Number(newNode.id)), newNode);
    },
    onError: (error) => {
      console.error("Failed to create node:", error);
    },
  });
};

// Hook to update a node
export const useUpdateNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateNodeRequest }) =>
      apiService.updateNode(id, updates),
    onSuccess: (updatedNode, { id }) => {
      // Update the node in the cache
      queryClient.setQueryData(nodeKeys.detail(id), updatedNode);

      // Invalidate nodes list to ensure consistency
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to update node:", error);
    },
  });
};

// Hook to delete a node
export const useDeleteNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiService.deleteNode(id),
    onSuccess: (_, deletedId) => {
      // Remove the node from cache
      queryClient.removeQueries({ queryKey: nodeKeys.detail(deletedId) });

      // Invalidate nodes list
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to delete node:", error);
    },
  });
};

// Hook to update node positions (bulk update)
export const useUpdateNodePositions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positions: Array<{ id: number; x: number; y: number }>) =>
      apiService.updateNodePositions(positions),
    onSuccess: () => {
      // Invalidate all node queries to refetch updated positions
      queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    },
    onError: (error) => {
      console.error("Failed to update node positions:", error);
    },
  });
};

// Hook to check API health
export const useApiHealth = () => {
  return useQuery({
    queryKey: ["api", "health"],
    queryFn: () => apiService.checkHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
    staleTime: 0, // Always consider stale for health checks
  });
};
