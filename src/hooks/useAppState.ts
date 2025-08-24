import { useState, useRef, useCallback } from "react";
import { Edge } from "reactflow";
import { Node, NodeType } from "@/types";
import { WorldGraphRef } from "@/types/graphTypes";

export interface AppState {
  selectedNodeId: string | null;
  isCreateModalOpen: boolean;
  sidebarVisible: boolean;
  analyticsOpen: boolean;
  filter: NodeType | "all";
  currentEdges: Edge[];
  localNodes: Node[];
  dragNodeType: NodeType | null;
  unsavedNodeChanges: Record<string, Partial<Node>>;
}

export interface AppActions {
  setSelectedNodeId: (id: string | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setSidebarVisible: (visible: boolean) => void;
  setAnalyticsOpen: (open: boolean) => void;
  setFilter: (filter: NodeType | "all") => void;
  setCurrentEdges: (edges: Edge[]) => void;
  setLocalNodes: (nodes: Node[] | ((prev: Node[]) => Node[])) => void;
  setDragNodeType: (type: NodeType | null) => void;
  setUnsavedNodeChanges: (changes: Record<string, Partial<Node>>) => void;
}

export const useAppState = () => {
  const [state, setState] = useState<AppState>({
    selectedNodeId: null,
    isCreateModalOpen: false,
    sidebarVisible: true,
    analyticsOpen: false,
    filter: "all",
    currentEdges: [],
    localNodes: [],
    dragNodeType: null,
    unsavedNodeChanges: {},
  });

  const graphRef = useRef<WorldGraphRef>(null);

  const actions: AppActions = {
    setSelectedNodeId: useCallback((id: string | null) => {
      setState(prev => ({
        ...prev,
        selectedNodeId: id,
        unsavedNodeChanges: id ? {} : prev.unsavedNodeChanges
      }));
    }, []),

    setIsCreateModalOpen: useCallback((open: boolean) => {
      setState(prev => ({ ...prev, isCreateModalOpen: open }));
    }, []),

    setSidebarVisible: useCallback((visible: boolean) => {
      setState(prev => ({ ...prev, sidebarVisible: visible }));
    }, []),

    setAnalyticsOpen: useCallback((open: boolean) => {
      setState(prev => ({ ...prev, analyticsOpen: open }));
    }, []),

    setFilter: useCallback((filter: NodeType | "all") => {
      setState(prev => ({ ...prev, filter }));
    }, []),

    setCurrentEdges: useCallback((edges: Edge[]) => {
      setState(prev => ({ ...prev, currentEdges: edges }));
    }, []),

    setLocalNodes: useCallback((nodes: Node[] | ((prev: Node[]) => Node[])) => {
      setState(prev => ({ 
        ...prev, 
        localNodes: typeof nodes === 'function' ? nodes(prev.localNodes) : nodes 
      }));
    }, []),

    setDragNodeType: useCallback((type: NodeType | null) => {
      setState(prev => ({ ...prev, dragNodeType: type }));
    }, []),

    setUnsavedNodeChanges: useCallback((changes: Record<string, Partial<Node>>) => {
      setState(prev => ({ ...prev, unsavedNodeChanges: changes }));
    }, []),
  };

  return {
    state,
    actions,
    graphRef,
    // Helper methods
    toggleSidebar: useCallback(() => {
      setState(prev => ({ ...prev, sidebarVisible: !prev.sidebarVisible }));
    }, []),

    toggleAnalytics: useCallback(() => {
      setState(prev => ({ ...prev, analyticsOpen: !prev.analyticsOpen }));
    }, []),

    clearUnsavedChanges: useCallback((nodeId: string) => {
      setState(prev => {
        const newChanges = { ...prev.unsavedNodeChanges };
        delete newChanges[nodeId];
        return { ...prev, unsavedNodeChanges: newChanges };
      });
    }, []),

    updateUnsavedChanges: useCallback((nodeId: string, changes: Partial<Node>) => {
      setState(prev => {
        const existingChanges = prev.unsavedNodeChanges[nodeId];
        const newChanges: Partial<Node> = {
          ...existingChanges,
          ...changes,
        };

        if (existingChanges?.data && changes.data) {
          newChanges.data = {
            ...existingChanges.data,
            ...changes.data,
          };
        } else if (changes.data) {
          newChanges.data = changes.data;
        } else if (existingChanges?.data) {
          newChanges.data = existingChanges.data;
        }

        return {
          ...prev,
          unsavedNodeChanges: {
            ...prev.unsavedNodeChanges,
            [nodeId]: newChanges,
          },
        };
      });
    }, []),
  };
};