import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/apiService";
import { CreateNodeRequest, UpdateNodeRequest, NodeType } from "../types";
import { flattenNodes } from "@/utils/flattenNodeData";

export const nodeKeys = {
  all: ["nodes"] as const,
  lists: () => [...nodeKeys.all, "list"] as const,
  list: (type?: string) => [...nodeKeys.lists(), type] as const,
  details: () => [...nodeKeys.all, "detail"] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
};

export const useNodes = (type?: NodeType) => {
  return useQuery({
    queryKey: nodeKeys.list(type),
    queryFn: async () => {
      const nodes = await apiService.nodes.getNodes(type);
      return flattenNodes(nodes);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useNode = (id: string, enabled = true) => {
  return useQuery({
    queryKey: nodeKeys.detail(id),
    queryFn: () => apiService.nodes.getNode(id),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useCreateNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (node: CreateNodeRequest) => apiService.nodes.createNode(node),
    onSuccess: (newNode) => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });

      queryClient.setQueryData(nodeKeys.detail(newNode.id), newNode);
    },
    onError: (error) => {
      console.error("Failed to create node:", error);
    },
  });
};

export const useUpdateNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateNodeRequest }) =>
      apiService.nodes.updateNode(id, updates),
    onSuccess: (updatedNode, { id }) => {
      queryClient.setQueryData(nodeKeys.detail(id), updatedNode);

      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to update node:", error);
    },
  });
};

export const useDeleteNode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.nodes.deleteNode(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({
        queryKey: nodeKeys.detail(deletedId),
      });

      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    onError: (error) => {
      console.error("Failed to delete node:", error);
    },
  });
};

export const useUpdateNodePositions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positions: Array<{ id: number; x: number; y: number }>) =>
      apiService.nodes.updateNodePositions(positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.all });
    },
    onError: (error) => {
      console.error("Failed to update node positions:", error);
    },
  });
};

export const useApiHealth = () => {
  return useQuery({
    queryKey: ["api", "health"],
    queryFn: () => apiService.health.checkHealth(),
    refetchInterval: 30000,
    retry: 1,
    staleTime: 0,
  });
};
