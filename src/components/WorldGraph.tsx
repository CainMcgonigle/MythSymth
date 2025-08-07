import React, {
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import ReactFlow, {
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  Connection,
  addEdge,
  Node as FlowNode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { useGraphState } from "@/hooks/useGraphState";
import { useGraphPersistence } from "@/hooks/useGraphPersistence";
import { useGraphMutations } from "@/hooks/useGraphMutations";
import {
  convertToFlowNode,
  convertToFlowEdge,
  initializeFromLocalStorage,
  clearLocalStorage,
} from "../utils/graphUtils";
import { nodeKeys } from "@/hooks/useNodes";
import { GRID_SIZE, LOCALSTORAGE_KEYS } from "@/constants/graphConstants";
import { WorldGraphProps, WorldGraphRef } from "@/types/graphTypes";
import { CreateNodeRequest, Node, NodeType } from "@/types";

import MythSmithNode from "./MythSmithNode";
import CustomControls from "./CustomControls";
import { apiService } from "@/services/api";
import { useToast } from "../components/ui/Toast";

const nodeTypes = {
  mythsmith: MythSmithNode,
};

export const WorldGraph = forwardRef<WorldGraphRef, WorldGraphProps>(
  ({ onNodeSelect, onNodesUpdated }, ref) => {
    const graphState = useGraphState();
    const { saveMapMutation, createNodeMutation } = useGraphMutations();

    const { addToast } = useToast();
    useGraphPersistence(graphState, graphState.isInitialized);

    const {
      nodes,
      edges,
      pendingChanges,
      history,
      historyIndex,
      isSaving,
      isInitialized,
      shouldLoadFromDB,
      snapToGrid,
      isInteractive,
      autoSaveEnabled,
      autoSaveInterval,
      setNodes,
      setEdges,
      setPendingChanges,
      setHistory,
      setHistoryIndex,
      setIsSaving,
      setIsInitialized,
      setShouldLoadFromDB,
      setSnapToGrid,
      setIsInteractive,
      setAutoSaveEnabled,
      setAutoSaveInterval,
      onNodesChange,
      onEdgesChange,
      hasUnsavedChanges,
      saveStateToHistory,
      undo,
      redo,
    } = graphState;

    const [dragStartPosition, setDragStartPosition] = useState<{
      id: string;
      position: { x: number; y: number };
    } | null>(null);

    // Add these event handlers
    const onNodeDragStart = useCallback(
      (_event: React.MouseEvent, node: any) => {
        setDragStartPosition({ id: node.id, position: { ...node.position } });
      },
      []
    );

    const onNodeDragStop = useCallback(
      (_event: React.MouseEvent, node: any) => {
        if (dragStartPosition && dragStartPosition.id === node.id) {
          const startPos = dragStartPosition.position;
          const endPos = node.position;

          // Only mark as changed if position actually changed
          if (startPos.x !== endPos.x || startPos.y !== endPos.y) {
            setPendingChanges((prev) => ({
              ...prev,
              updatedNodes: [...new Set([...prev.updatedNodes, node.id])],
            }));
            saveStateToHistory();
          }
        }
        setDragStartPosition(null);
      },
      [dragStartPosition, saveStateToHistory]
    );

    // Initialize data from localStorage or DB
    useEffect(() => {
      const { savedNodes, savedEdges, savedPendingChanges } =
        initializeFromLocalStorage();

      if (savedNodes !== null && savedEdges !== null) {
        console.log("Found data in localStorage. Hydrating state.");
        setNodes(savedNodes);
        setEdges(savedEdges);
        setHistory([{ nodes: savedNodes, edges: savedEdges }]);
        setHistoryIndex(0);

        if (savedPendingChanges) {
          setPendingChanges(savedPendingChanges);
        }
        setIsInitialized(true);
      } else {
        console.log("No data in localStorage. Triggering DB fetch.");
        setShouldLoadFromDB(true);
      }
    }, []);

    // Fetch data from DB if needed
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

    useEffect(() => {
      if (shouldLoadFromDB && nodesData && edgesData) {
        const flowNodes = nodesData.map(convertToFlowNode);
        const flowEdges = edgesData.map(convertToFlowEdge);
        setNodes(flowNodes);
        setEdges(flowEdges);
        console.log(
          "Loaded from database:",
          flowNodes.length,
          "nodes,",
          flowEdges.length,
          "edges"
        );

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

        if (onNodesUpdated) {
          onNodesUpdated(nodesData);
        }
        setShouldLoadFromDB(false);
        setIsInitialized(true);

        addToast("Data loaded successfully!", "success");
      }
    }, [
      nodesData,
      edgesData,
      shouldLoadFromDB,
      setNodes,
      setEdges,
      onNodesUpdated,
    ]);

    const saveMap = useCallback(async () => {
      if (!hasUnsavedChanges() || isSaving) return;

      setIsSaving(true);
      try {
        // First, create new nodes in the backend
        const nodesToCreate = nodes.filter((n) =>
          pendingChanges.newNodes.includes(n.id)
        );

        // Create a mapping from temp IDs to real IDs
        const idMapping: Record<string, string> = {};

        // Create each new node and store the ID mapping
        for (const node of nodesToCreate) {
          const createRequest: CreateNodeRequest = {
            id: node.id.split("_")[1],
            name: node.data.name,
            type: node.data.type,
            description: node.data.description,
            position: node.position,
            connectionDirection: node.data.connectionDirection,
          };

          try {
            const createdNode = await createNodeMutation.mutateAsync({
              ...createRequest,
              tempId: node.id,
            });

            // Store the mapping from temp ID to real ID
            idMapping[node.id] = String(createdNode.id);

            // Update the node in local state with the real ID from the backend
            setNodes((currentNodes) =>
              currentNodes.map((n) =>
                n.id === node.id ? convertToFlowNode(createdNode) : n
              )
            );
          } catch (error) {
            console.error(
              `Failed to create node with tempId ${node.id}:`,
              error
            );
            addToast("Failed to save some nodes to the server.", "error");
          }
        }

        // Update edges to use real IDs instead of temp IDs
        const updatedEdges = edges.map((edge) => {
          const newEdge = { ...edge };
          if (idMapping[edge.source]) {
            newEdge.source = idMapping[edge.source];
          }
          if (idMapping[edge.target]) {
            newEdge.target = idMapping[edge.target];
          }
          return newEdge;
        });

        // Then save all nodes and edges (including updates and deletions)
        const nodesToSave = nodes
          .filter((n) => !pendingChanges.deletedNodes.includes(n.id))
          .map((n) => {
            const nodeId = idMapping[n.id] || n.id;
            return {
              id: nodeId,
              position: n.position,
              data: n.data,
            };
          });

        const edgesToSave = updatedEdges
          .filter((e) => !pendingChanges.deletedEdges.includes(e.id))
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
          }));

        await saveMapMutation.mutateAsync({
          nodes: nodesToSave,
          edges: edgesToSave,
        });

        setPendingChanges({
          newNodes: [],
          updatedNodes: [],
          deletedNodes: [],
          newEdges: [],
          updatedEdges: [],
          deletedEdges: [],
        });

        setHistory([{ nodes, edges: updatedEdges }]);
        setHistoryIndex(0);

        addToast("All changes saved successfully!", "success");
      } catch (error) {
        console.error("Failed to save changes:", error);
        addToast("Failed to save changes. Please try again.", "error");
      } finally {
        setIsSaving(false);
      }
    }, [
      nodes,
      edges,
      pendingChanges,
      createNodeMutation,
      saveMapMutation,
      hasUnsavedChanges,
      isSaving,
      addToast,
    ]);

    // Auto-save effect
    useEffect(() => {
      if (!autoSaveEnabled || !hasUnsavedChanges() || !isInitialized) return;

      const intervalId = setInterval(() => {
        if (hasUnsavedChanges() && !isSaving) {
          console.log("Auto-saving changes...");
          saveMap();
        }
      }, autoSaveInterval);

      return () => clearInterval(intervalId);
    }, [
      autoSaveEnabled,
      autoSaveInterval,
      hasUnsavedChanges,
      isSaving,
      saveMap,
      isInitialized,
    ]);

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key === "z" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          undo();
        } else if (
          (event.ctrlKey || event.metaKey) &&
          event.key === "z" &&
          event.shiftKey
        ) {
          event.preventDefault();
          redo();
        } else if ((event.ctrlKey || event.metaKey) && event.key === "y") {
          event.preventDefault();
          redo();
        } else if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          event.preventDefault();
          if (hasUnsavedChanges() && !isSaving) {
            saveMap();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, hasUnsavedChanges, isSaving, saveMap]);

    // Snap to grid effect
    useEffect(() => {
      if (snapToGrid) {
        setNodes((currentNodes) => {
          return currentNodes.map((node) => ({
            ...node,
            position: {
              x: Math.round(node.position.x / GRID_SIZE) * GRID_SIZE,
              y: Math.round(node.position.y / GRID_SIZE) * GRID_SIZE,
            },
          }));
        });
      }
    }, [snapToGrid, setNodes]);

    // Event handlers
    const handleNodesChange = useCallback(
      (changes: any[]) => {
        onNodesChange(changes);
        changes.forEach((change) => {
          // Only track non-position changes or position changes when not dragging
          if (change.type !== "position" || !dragStartPosition) {
            if (change.type === "position" && change.position) {
              setPendingChanges((prev) => ({
                ...prev,
                updatedNodes: [...new Set([...prev.updatedNodes, change.id])],
              }));
            }
          }
        });
        // Don't save to history during drag operations
        if (!dragStartPosition) {
          saveStateToHistory();
        }
      },
      [onNodesChange, dragStartPosition, saveStateToHistory]
    );

    const handleEdgesChange = useCallback(
      (changes: any[]) => {
        onEdgesChange(changes);
        changes.forEach((change) => {
          if (change.type === "add") {
            setPendingChanges((prev) => ({
              ...prev,
              newEdges: [...new Set([...prev.newEdges, change.item.id])],
            }));
          } else if (change.type === "remove") {
            setPendingChanges((prev) => ({
              ...prev,
              deletedEdges: [...new Set([...prev.deletedEdges, change.id])],
            }));
          }
        });
        saveStateToHistory();
      },
      [onEdgesChange, saveStateToHistory]
    );

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, flowNode: any) => {
        if (onNodeSelect) {
          const selectedNode: Node = {
            id: flowNode.id,
            position: flowNode.position || { x: 0, y: 0 },
            data: {
              id: flowNode.id,
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
        const newEdge = {
          ...params,
          type: "mythsmith",
          id: "temp_" + uuidv4(),
        };
        setEdges((eds) => addEdge(newEdge, eds));
        setPendingChanges((prev) => ({
          ...prev,
          newEdges: [...new Set([...prev.newEdges, newEdge.id])],
        }));
        saveStateToHistory();
      },
      [setEdges, saveStateToHistory]
    );

    // Action functions
    const loadNodes = useCallback(async () => {
      clearLocalStorage();
      setShouldLoadFromDB(true);
      addToast("Loading data from server...", "info");
    }, [addToast]);

    const addNode = useCallback(
      async (nodeData: CreateNodeRequest) => {
        // Use a consistent UUID format for all nodes
        const tempId = `temp_${uuidv4()}`;
        const newFlowNode: FlowNode = {
          id: tempId,
          position: nodeData.position || { x: 0, y: 0 },
          data: {
            ...nodeData,
          },
          type: "mythsmith",
        };

        // Update local state
        setNodes((nds) => [...nds, newFlowNode]);

        // Track as a new node that needs to be saved
        setPendingChanges((prev) => ({
          ...prev,
          newNodes: [...prev.newNodes, tempId],
        }));

        saveStateToHistory();
        return newFlowNode;
      },
      [setNodes, saveStateToHistory]
    );

    const deleteNode = useCallback(
      async (nodeId: string) => {
        // Check if this is a temporary node (starts with 'temp_')
        const isTempNode = nodeId.startsWith("temp_");

        // If it's a real node (not temporary), call the API to delete it
        if (!isTempNode) {
          try {
            await apiService.deleteNode(nodeId);
          } catch (error) {
            console.error("Failed to delete node from backend:", error);
            addToast("Failed to delete node. Please try again.", "error");
            return; // Don't update local state if API call fails
          }
        }

        // Update local state using the original ID
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );

        // Update pending changes
        setPendingChanges((prev) => {
          const newDeletedNodes = isTempNode
            ? prev.deletedNodes // Don't add temp nodes to deletedNodes since they were never in the backend
            : [...new Set([...prev.deletedNodes, nodeId])];

          return {
            ...prev,
            deletedNodes: newDeletedNodes,
            newNodes: prev.newNodes.filter((id) => id !== nodeId),
            updatedNodes: prev.updatedNodes.filter((id) => id !== nodeId),
          };
        });

        // Update localStorage by removing the node from saved data
        if (isInitialized) {
          try {
            const savedNodes = localStorage.getItem(LOCALSTORAGE_KEYS.NODES);
            if (savedNodes) {
              const parsedNodes = JSON.parse(savedNodes);
              const updatedNodes = parsedNodes.filter(
                (node: any) => node.id !== nodeId
              );
              localStorage.setItem(
                LOCALSTORAGE_KEYS.NODES,
                JSON.stringify(updatedNodes)
              );
            }

            const savedEdges = localStorage.getItem(LOCALSTORAGE_KEYS.EDGES);
            if (savedEdges) {
              const parsedEdges = JSON.parse(savedEdges);
              const updatedEdges = parsedEdges.filter(
                (edge: any) => edge.source !== nodeId && edge.target !== nodeId
              );
              localStorage.setItem(
                LOCALSTORAGE_KEYS.EDGES,
                JSON.stringify(updatedEdges)
              );
            }
          } catch (error) {
            console.error("Failed to update localStorage:", error);
          }
        }

        if (onNodesUpdated) {
          const remainingBackendNodes = nodes
            .filter((fNode) => fNode.id !== nodeId)
            .map((fNode) => ({
              id: fNode.id,
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

        saveStateToHistory();
        addToast("Node deleted successfully", "success");
      },
      [
        setNodes,
        setEdges,
        onNodeSelect,
        onNodesUpdated,
        nodes,
        saveStateToHistory,
        addToast,
        isInitialized,
      ]
    );

    const updateNode = useCallback(
      async (nodeId: string, updates: any): Promise<Node> => {
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

        // Update local state
        setNodes((nds) => nds.map((n) => (n.id === nodeId ? updatedNode : n)));

        // Track as an updated node that needs to be saved
        setPendingChanges((prev) => ({
          ...prev,
          updatedNodes: [...new Set([...prev.updatedNodes, nodeId])],
        }));

        saveStateToHistory();

        const backendNode = {
          id: updatedNode.id,
          data: updatedNode.data,
          position: updatedNode.position,
        };

        return Promise.resolve(backendNode as Node);
      },
      [nodes, setNodes, saveStateToHistory]
    );

    useImperativeHandle(ref, () => ({
      addNode,
      deleteNode,
      loadNodes,
      updateNode,
      saveMap,
      hasUnsavedChanges,
      undo,
      redo,
      setAutoSaveEnabled,
      setAutoSaveInterval,
      getAutoSaveEnabled: () => autoSaveEnabled,
      getAutoSaveInterval: () => autoSaveInterval,
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
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          nodesDraggable={isInteractive}
          nodesConnectable={isInteractive}
          elementsSelectable={isInteractive}
          panOnDrag={isInteractive}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
        >
          <Panel position="bottom-left">
            <CustomControls
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              isInteractive={isInteractive}
              setIsInteractive={setIsInteractive}
              autoSaveEnabled={autoSaveEnabled}
              setAutoSaveEnabled={setAutoSaveEnabled}
              autoSaveInterval={autoSaveInterval}
              setAutoSaveInterval={setAutoSaveInterval}
              hasUnsavedChanges={hasUnsavedChanges()}
              onSave={saveMap}
              isSaving={isSaving}
            />
          </Panel>

          <Panel position="bottom-right">
            <div className="flex flex-col gap-2 bg-black/80 p-2 rounded text-white">
              <div className="flex gap-1">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className={`px-2 py-1 rounded text-xs ${
                    historyIndex <= 0
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white cursor-pointer"
                  }`}
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className={`px-2 py-1 rounded text-xs ${
                    historyIndex >= history.length - 1
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white cursor-pointer"
                  }`}
                  title="Redo (Ctrl+Y)"
                >
                  ↷ Redo
                </button>
              </div>
              <div className="border-t border-gray-600 pt-1 mt-1">
                <div className="flex items-center gap-1 mb-1">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="autoSave" className="text-xs cursor-pointer">
                    Auto-save
                  </label>
                </div>
                {autoSaveEnabled && (
                  <div className="flex items-center gap-1">
                    <label htmlFor="autoSaveInterval" className="text-xs">
                      Every:
                    </label>
                    <select
                      id="autoSaveInterval"
                      value={autoSaveInterval / 1000}
                      onChange={(e) =>
                        setAutoSaveInterval(Number(e.target.value) * 1000)
                      }
                      className="bg-gray-800 text-white border border-gray-600 rounded px-1 text-xs"
                    >
                      <option value="15">15s</option>
                      <option value="30">30s</option>
                      <option value="60">1m</option>
                      <option value="300">5m</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </Panel>
          <MiniMap
            nodeColor={(node) => {
              const colors: Record<NodeType, string> = {
                character: "#93c5fd",
                faction: "#fca5a5",
                city: "#fdba74",
                event: "#6ee7b7",
                location: "#d8b4fe",
              };
              return colors[node.data?.type as NodeType] || "#DDD";
            }}
            className="!bg-gray-900 !border !border-gray-600 !rounded"
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
