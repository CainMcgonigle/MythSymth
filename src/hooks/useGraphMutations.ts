import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { nodeKeys } from "../hooks/useNodes";
import { CreateNodeMutationVariables } from "../types/graphTypes";
import { LOCALSTORAGE_KEYS } from "@/constants/graphConstants";

export const useGraphMutations = () => {
  const queryClient = useQueryClient();

  const saveMapMutation = useMutation({
    mutationFn: (mapData: { nodes: any[]; edges: any[] }) =>
      apiService.saveMap(mapData),
    onSuccess: () => {
      console.log("Map saved successfully!");
      localStorage.setItem(
        LOCALSTORAGE_KEYS.LAST_SAVED,
        new Date().toISOString()
      );
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["edges"] });
    },
    onError: (err) => {
      console.error("Failed to save map:", err);
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: (variables: CreateNodeMutationVariables) =>
      apiService.createNode(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
    },
    onError: (err) => {
      console.error(`Failed to create node:`, err);
    },
  });

  return {
    saveMapMutation,
    createNodeMutation,
  };
};
