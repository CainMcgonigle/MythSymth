import React, { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { convertToFlowNode, convertToFlowEdge } from '@/utils/graphUtils';
import { apiService } from '@/services/apiService';
import { nodeKeys } from '@/hooks/useNodes';
import { useToast } from '@/components/ui/Toast';
import { Edge, Node as FlowNode } from 'reactflow';

interface GraphDataManagerProps {
  shouldLoadFromDB: boolean;
  setShouldLoadFromDB: (value: boolean) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setHistory: (history: Array<{nodes: FlowNode[], edges: Edge[]}>) => void;
  setHistoryIndex: (index: number) => void;
  setIsInitialized: (initialized: boolean) => void;
  setPendingChanges: (changes: any) => void;
}

export const GraphDataManager: React.FC<GraphDataManagerProps> = ({
  shouldLoadFromDB,
  setShouldLoadFromDB,
  setNodes,
  setEdges,
  setHistory,
  setHistoryIndex,
  setIsInitialized,
  setPendingChanges,
}) => {
  const { addToast } = useToast();
  
  const {
    data: nodesData,
    isLoading: nodesLoading,
    isError: nodesError,
  } = useQuery({
    queryKey: nodeKeys.lists(),
    queryFn: () => apiService.nodes.getNodes(),
    staleTime: 5 * 60 * 1000,
    enabled: shouldLoadFromDB,
  });

  const {
    data: edgesData,
    isLoading: edgesLoading,
    isError: edgesError,
  } = useQuery({
    queryKey: ['edges'],
    queryFn: () => apiService.edges.getEdges(),
    staleTime: 5 * 60 * 1000,
    enabled: shouldLoadFromDB,
  });

  useEffect(() => {
    if (shouldLoadFromDB && nodesData && edgesData) {
      const flowNodes = nodesData.map(convertToFlowNode);
      const flowEdges = edgesData.map(convertToFlowEdge);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      setPendingChanges({
        newNodes: [],
        updatedNodes: [],
        deletedNodes: [],
        newEdges: [],
        updatedEdges: [],
        deletedEdges: [],
      });
      setHistory([{ nodes: flowNodes, edges: flowEdges }]);
      setHistoryIndex(0);
      setShouldLoadFromDB(false);
      setIsInitialized(true);
      addToast('Data loaded successfully!', 'success');
    }
  }, [
    nodesData,
    edgesData,
    shouldLoadFromDB,
    setNodes,
    setEdges,
    setHistory,
    setHistoryIndex,
    setShouldLoadFromDB,
    setIsInitialized,
    addToast,
    setPendingChanges,
  ]);

  return null; // This is a data management component with no UI
};