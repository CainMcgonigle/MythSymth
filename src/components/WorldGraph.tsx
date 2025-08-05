import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactFlow, {
  Node as FlowNode,
  Edge as FlowEdge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  MiniMap,
  Background,
  NodeTypes,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { apiService } from "../services/api";
import {
  Node,
  NodeType,
  CreateNodeRequest,
  UpdateNodeRequest,
  Edge,
} from "../types";
import MythSmithNode from "./MythSmithNode";
import CustomControls from "./CustomControls";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nodeKeys } from "../hooks/useNodes";
import { v4 as uuidv4 } from "uuid";

// LocalStorage keys
const LOCALSTORAGE_KEYS = {
  NODES: 'worldgraph_nodes',
  EDGES: 'worldgraph_edges',
  PENDING_CHANGES: 'worldgraph_pending_changes',
  LAST_SAVED: 'worldgraph_last_saved'
};

// Types for tracking changes
interface PendingChanges {
  newNodes: string[]; // temp IDs of nodes to be created
  updatedNodes: string[]; // IDs of nodes that have been modified
  deletedNodes: string[]; // IDs of nodes that have been deleted
  newEdges: string[]; // IDs of new edges
  updatedEdges: string[]; // IDs of updated edges
  deletedEdges: string[]; // IDs of deleted edges
}

// Helper to convert backend Node to React Flow FlowNode
const convertToFlowNode = (node: Node): FlowNode => ({
  id: String(node.id),
  position: node.position || { x: 0, y: 0 },
  data: {
    ...node.data,
  },
  type: "mythsmith",
});

// Helper to convert backend Edge to React Flow FlowEdge
const convertToFlowEdge = (edge: Edge): FlowEdge => ({
  id: String(edge.id),
  source: String(edge.source),
  target: String(edge.target),
  sourceHandle: edge.sourceHandle || undefined,
  targetHandle: edge.targetHandle || undefined,
  animated: true,
});

const nodeTypes: NodeTypes = {
  mythsmith: MythSmithNode,
};

interface WorldGraphProps {
  onNodeSelect?: (node: Node | null) => void;
  onNodesUpdated?: (nodes: Node[]) => void;
}

export interface WorldGraphRef {
  addNode: (nodeData: CreateNodeRequest) => Promise<FlowNode>;
  deleteNode: (nodeId: string) => Promise<void>;
  loadNodes: () => Promise<void>;
  updateNode: (nodeId: string, updates: UpdateNodeRequest) => Promise<Node>;
  saveMap: () => Promise<void>;
  hasUnsavedChanges: () => boolean;
}

// New type for the mutation variables to pass the temporary ID
type CreateNodeMutationVariables = CreateNodeRequest & { tempId: string };

export const WorldGraph = forwardRef<WorldGraphRef, WorldGraphProps>(
  ({ onNodeSelect, onNodesUpdated }, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [isInteractive, setIsInteractive] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false); // Flag to prevent saving until after initial load
    const [shouldLoadFromDB, setShouldLoadFromDB] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
      newNodes: [],
      updatedNodes: [],
      deletedNodes: [],
      newEdges: [],
      updatedEdges: [],
      deletedEdges: []
    });
    const [isSaving, setIsSaving] = useState(false);

    const queryClient = useQueryClient();

    // Phase 1: Initial data load (runs once on mount)
    useEffect(() => {
      const savedNodes = localStorage.getItem(LOCALSTORAGE_KEYS.NODES);
      const savedEdges = localStorage.getItem(LOCALSTORAGE_KEYS.EDGES);

      if (savedNodes !== null && savedEdges !== null) {
        console.log("Found data in localStorage. Hydrating state.");
        try {
          const parsedNodes = JSON.parse(savedNodes);
          const parsedEdges = JSON.parse(savedEdges);
          const savedPendingChanges = localStorage.getItem(LOCALSTORAGE_KEYS.PENDING_CHANGES);

          setNodes(parsedNodes);
          setEdges(parsedEdges);
          if (savedPendingChanges) {
            setPendingChanges(JSON.parse(savedPendingChanges));
          }

          setIsInitialized(true); // Mark as initialized so saving can begin
        } catch (e) {
          console.error('Failed to parse localStorage data. Falling back to DB fetch.', e);
          setShouldLoadFromDB(true);
        }
      } else {
        console.log("No data in localStorage. Triggering DB fetch.");
        setShouldLoadFromDB(true);
      }
    // This effect should only run once on component mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Phase 2: Persist state to localStorage (runs whenever state changes, but only after initialization)
    useEffect(() => {
      if (isInitialized) {
        localStorage.setItem(LOCALSTORAGE_KEYS.NODES, JSON.stringify(nodes));
      }
    }, [nodes, isInitialized]);

    useEffect(() => {
      if (isInitialized) {
        localStorage.setItem(LOCALSTORAGE_KEYS.EDGES, JSON.stringify(edges));
      }
    }, [edges, isInitialized]);

    useEffect(() => {
      if (isInitialized) {
        localStorage.setItem(LOCALSTORAGE_KEYS.PENDING_CHANGES, JSON.stringify(pendingChanges));
      }
    }, [pendingChanges, isInitialized]);

    // Fetch nodes using React Query (only when `shouldLoadFromDB` is true)
    const {
      data: nodesData,
      isLoading: nodesLoading,
      isError: nodesError,
    } = useQuery({
      queryKey: nodeKeys.lists(),
      queryFn: () => apiService.getNodes(),
      staleTime: 5 * 60 * 1000,
      enabled: shouldLoadFromDB,
    });

    // Fetch edges using React Query (only when `shouldLoadFromDB` is true)
    const {
      data: edgesData,
      isLoading: edgesLoading,
      isError: edgesError,
    } = useQuery({
      queryKey: ["edges"],
      queryFn: () => apiService.getEdges(),
      staleTime: 5 * 60 * 1000,
      enabled: shouldLoadFromDB,
    });
    
    // Phase 3: Handle data loading from DB (runs when DB data is fetched)
    useEffect(() => {
      if (shouldLoadFromDB && nodesData && edgesData) {
        const flowNodes: FlowNode[] = nodesData.map(convertToFlowNode);
        const flowEdges: FlowEdge[] = edgesData.map(convertToFlowEdge);
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        
        console.log('Loaded from database:', flowNodes.length, 'nodes,', flowEdges.length, 'edges');
        
        // Clear pending changes since we're loading fresh from DB
        setPendingChanges({
          newNodes: [], updatedNodes: [], deletedNodes: [],
          newEdges: [], updatedEdges: [], deletedEdges: []
        });

        if (onNodesUpdated) {
          onNodesUpdated(nodesData);
        }
        
        setShouldLoadFromDB(false); // Reset the flag after loading
        setIsInitialized(true); // Mark as initialized so saving can begin
      }
    }, [nodesData, edgesData, shouldLoadFromDB, setNodes, setEdges, onNodesUpdated]);

    // Mutation to save the entire map
    const saveMapMutation = useMutation({
      mutationFn: (mapData: { nodes: any[]; edges: any[] }) =>
        apiService.saveMap(mapData),
      onSuccess: () => {
        console.log("Map saved successfully!");
        localStorage.setItem(LOCALSTORAGE_KEYS.LAST_SAVED, new Date().toISOString());
        setPendingChanges({
          newNodes: [], updatedNodes: [], deletedNodes: [],
          newEdges: [], updatedEdges: [], deletedEdges: []
        });
        // After a successful save, we should refetch to get canonical data
        queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
        queryClient.invalidateQueries({ queryKey: ["edges"] });
      },
      onError: (err) => {
        console.error("Failed to save map:", err);
      },
    });

    // Mutation for creating nodes (only used during save)
    const createNodeMutation = useMutation({
      mutationFn: (variables: CreateNodeMutationVariables) =>
        apiService.createNode(variables),
      onSuccess: (data: Node, variables) => {
        const tempId = variables.tempId;
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === tempId ? convertToFlowNode(data) : node
          )
        );
        queryClient.invalidateQueries({ queryKey: nodeKeys.lists() });
      },
      onError: (err) => {
        console.error(`Failed to create node:`, err);
      },
    });

    // Load nodes from database (overrides localStorage)
    const loadNodes = useCallback(async () => {
      // Clear local storage to ensure a fresh pull from the DB on next load
      Object.values(LOCALSTORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      setShouldLoadFromDB(true);
    }, []);

    // Check if there are unsaved changes
    const hasUnsavedChanges = useCallback(() => {
      return (
        pendingChanges.newNodes.length > 0 ||
        pendingChanges.updatedNodes.length > 0 ||
        pendingChanges.deletedNodes.length > 0 ||
        pendingChanges.newEdges.length > 0 ||
        pendingChanges.updatedEdges.length > 0 ||
        pendingChanges.deletedEdges.length > 0
      );
    }, [pendingChanges]);

    // Handle Ctrl+S keyboard shortcut
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
          event.preventDefault();
          if (hasUnsavedChanges() && !isSaving) {
            saveMap();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges, isSaving]); // `saveMap` should be in deps if not using useCallback

    useEffect(() => {
      if (snapToGrid) {
        const gridSize = 15;
        setNodes((currentNodes) => {
          return currentNodes.map((node) => ({
            ...node,
            position: {
              x: Math.round(node.position.x / gridSize) * gridSize,
              y: Math.round(node.position.y / gridSize) * gridSize,
            },
          }));
        });
      }
    }, [snapToGrid, setNodes]);

    // Custom nodes change handler to track position updates
    const handleNodesChange = useCallback((changes: any[]) => {
      onNodesChange(changes);
      
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          setPendingChanges(prev => ({
            ...prev,
            updatedNodes: [...new Set([...prev.updatedNodes, change.id])]
          }));
        }
      });
    }, [onNodesChange]);

    // Custom edges change handler to track edge updates
    const handleEdgesChange = useCallback((changes: any[]) => {
      onEdgesChange(changes);
      
      changes.forEach((change) => {
        if (change.type === 'add') {
          setPendingChanges(prev => ({
            ...prev,
            newEdges: [...new Set([...prev.newEdges, change.item.id])]
          }));
        } else if (change.type === 'remove') {
          setPendingChanges(prev => ({
            ...prev,
            deletedEdges: [...new Set([...prev.deletedEdges, change.id])]
          }));
        }
      });
    }, [onEdgesChange]);

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, flowNode: FlowNode) => {
        if (onNodeSelect) {
          const selectedNode: Node = {
            id: parseInt(flowNode.id),
            position: flowNode.position || { x: 0, y: 0 },
            data: {
              id: parseInt(flowNode.id),
              name: flowNode.data.name,
              type: flowNode.data.type,
              description: flowNode.data.description,
              connectionDirection: flowNode.data.connectionDirection,
            },
            createdAt: flowNode.data.createdAt,
            updatedAt: flowNode.data.updatedAt,
          };
          onNodeSelect(selectedNode);
        }
      },
      [onNodeSelect]
    );

    const handlePaneClick = useCallback(() => {
      if (onNodeSelect) {
        onNodeSelect(null);
      }
    }, [onNodeSelect]);

    const onConnect = useCallback(
      (params: Connection) => {
        const newEdge = { ...params, type: "mythsmith", id: uuidv4() };
        setEdges((eds) => addEdge(newEdge, eds));
        
        setPendingChanges(prev => ({
          ...prev,
          newEdges: [...new Set([...prev.newEdges, newEdge.id])]
        }));
      },
      [setEdges]
    );

    const addNode = useCallback(
      async (nodeData: CreateNodeRequest) => {
        const tempId = uuidv4();

        const newFlowNode: FlowNode = {
          id: tempId,
          position: nodeData.position || { x: 0, y: 0 },
          data: {
            ...nodeData,
          },
          type: "mythsmith",
        };

        setNodes((nds) => [...nds, newFlowNode]);
        
        setPendingChanges(prev => ({
          ...prev,
          newNodes: [...prev.newNodes, tempId]
        }));

        return newFlowNode;
      },
      [setNodes]
    );

    const deleteNode = useCallback(
      async (nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );

        setPendingChanges(prev => ({
          ...prev,
          deletedNodes: [...new Set([...prev.deletedNodes, nodeId])],
          newNodes: prev.newNodes.filter(id => id !== nodeId),
          updatedNodes: prev.updatedNodes.filter(id => id !== nodeId)
        }));

        if (onNodesUpdated) {
          const remainingBackendNodes = nodes
            .filter((fNode) => fNode.id !== nodeId)
            .map((fNode) => ({
              id: parseInt(fNode.id),
              data: fNode.data,
              position: fNode.position,
              createdAt: fNode.data.createdAt,
              updatedAt: fNode.data.updatedAt,
            }));
          onNodesUpdated(remainingBackendNodes);
        }

        if (onNodeSelect) {
          onNodeSelect(null);
        }
      },
      [setNodes, setEdges, onNodeSelect, onNodesUpdated, nodes]
    );

    const updateNode = useCallback(
      async (nodeId: string, updates: UpdateNodeRequest): Promise<Node> => {
        const nodeToUpdate = nodes.find((n) => n.id === nodeId);
    
        if (!nodeToUpdate) {
            return Promise.reject(new Error(`Node with ID ${nodeId} not found`));
        }
    
        const { position: newPosition, ...updateData } = updates;
    
        const updatedNode = {
            ...nodeToUpdate,
            data: { ...nodeToUpdate.data, ...updateData },
            position: newPosition || nodeToUpdate.position,
        };
        
        setNodes((nds) => nds.map((n) => (n.id === nodeId ? updatedNode : n)));
        
        setPendingChanges(prev => ({
          ...prev,
          updatedNodes: [...new Set([...prev.updatedNodes, nodeId])]
        }));
    
        const backendNode = {
            id: parseInt(updatedNode.id),
            data: updatedNode.data,
            position: updatedNode.position,
        };
    
        return Promise.resolve(backendNode as Node);
      },
      [nodes, setNodes]
    );
    
    // Save all changes to the database
    const saveMap = useCallback(async () => {
      if (!hasUnsavedChanges() || isSaving) {
        return;
      }

      setIsSaving(true);
      
      try {
        // First, create new nodes
        const nodesToCreate = nodes.filter((n) => pendingChanges.newNodes.includes(n.id));
        const createPromises = nodesToCreate.map((node) => {
          const createRequest: CreateNodeRequest = {
            name: node.data.name, type: node.data.type,
            description: node.data.description, position: node.position,
            connectionDirection: node.data.connectionDirection,
          };
          return createNodeMutation.mutateAsync({ ...createRequest, tempId: node.id });
        });
        
        await Promise.all(createPromises);

        // Then save all nodes and edges (including updates and deletions)
        const nodesToSave = nodes
          .filter(n => !pendingChanges.deletedNodes.includes(n.id))
          .map((n) => ({
            id: parseInt(n.id), position: n.position, data: n.data,
          }));
        
        const edgesToSave = edges
          .filter(e => !pendingChanges.deletedEdges.includes(e.id))
          .map((e) => ({
            id: e.id, source: parseInt(e.source), target: parseInt(e.target),
            sourceHandle: e.sourceHandle, targetHandle: e.targetHandle,
          }));
        
        await saveMapMutation.mutateAsync({ nodes: nodesToSave, edges: edgesToSave });
        
        console.log("All changes saved to the database.");
        
      } catch (error) {
        console.error("Failed to save changes:", error);
      } finally {
        setIsSaving(false);
      }
    }, [nodes, edges, pendingChanges, createNodeMutation, saveMapMutation, hasUnsavedChanges, isSaving]);

    useImperativeHandle(ref, () => ({
      addNode, deleteNode, loadNodes,
      updateNode, saveMap, hasUnsavedChanges,
    }));

    if (!isInitialized && (nodesLoading || edgesLoading)) {
      return <div>Loading...</div>;
    }

    if (!isInitialized && (nodesError || edgesError)) {
      return <div>Error loading graph data.</div>;
    }

    return (
      <div style={{ height: "100%", width: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: "#2d3748" }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          snapToGrid={snapToGrid}
          snapGrid={[15, 15]}
          nodesDraggable={isInteractive}
          nodesConnectable={isInteractive}
          elementsSelectable={isInteractive}
          panOnDrag={isInteractive}
        >
          <Panel position="bottom-left">
            <CustomControls
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              isInteractive={isInteractive}
              setIsInteractive={setIsInteractive}
            />
          </Panel>

          <Panel position="top-right">
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(0,0,0,0.8)', padding: '8px 12px',
              borderRadius: '6px', color: 'white', fontSize: '14px'
            }}>
              {isSaving && <span>Saving...</span>}
              {hasUnsavedChanges() && !isSaving && (
                <>
                  <span style={{ color: '#fbbf24' }}>● Unsaved changes</span>
                  <button
                    onClick={saveMap}
                    style={{
                      background: '#059669', border: 'none', color: 'white',
                      padding: '4px 8px', borderRadius: '4px', cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Save (Ctrl+S)
                  </button>
                </>
              )}
              {!hasUnsavedChanges() && !isSaving && (
                <span style={{ color: '#10b981' }}>✓ All changes saved</span>
              )}
            </div>
          </Panel>

          <MiniMap
            nodeColor={(node) => {
              const colors: Record<NodeType, string> = {
                character: "#93c5fd", faction: "#fca5a5", city: "#fdba74",
                event: "#6ee7b7", location: "#d8b4fe",
              };
              return colors[node.data?.type as NodeType] || "#DDD";
            }}
            style={{
              backgroundColor: "#1f2937", border: "1px solid #4b5563", borderRadius: 8,
            }}
          />
          <Background
            variant={BackgroundVariant.Lines}
            gap={20}
            size={1}
            color="#4a5568"
          />
        </ReactFlow>
      </div>
    );
  }
);

WorldGraph.displayName = "WorldGraph";