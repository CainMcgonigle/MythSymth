// WorldGraph.tsx
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
  Edge,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
import {
  exportToFormat,
  importGraphData,
  prepareImportData,
} from "@/utils/importExportUtils";
import ImportExportModal from "./ui/ImportExportModal";
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
import MythSmithNode from "./graphComponents/MythSmithNode";
import MythSmithEdge, { MythSmithEdgeData } from "./graphComponents/MythSmithEdge";
import CustomControls from "./CustomControls";
import ConnectionModal from "./ConnectionModal";
import { ConnectionValidator } from "../utils/connectionValidator";
import { apiService } from "@/services/apiService";
import { useToast } from "../components/ui/Toast";

const nodeTypes = {
  mythsmith: MythSmithNode,
};
const edgeTypes = {
  mythsmith: MythSmithEdge,
};

interface UpdatedWorldGraphProps extends WorldGraphProps {
  onEdgesUpdated?: (edges: Edge[]) => void;
}

export const WorldGraph = forwardRef<WorldGraphRef, UpdatedWorldGraphProps>(
  ({ onNodeSelect, onNodesUpdated, onEdgesUpdated }, ref) => {
    const graphState = useGraphState();
    const queryClient = useQueryClient();
    const { saveMapMutation, createNodeMutation } = useGraphMutations();
    const { addToast } = useToast();
    const [pendingConnection, setPendingConnection] =
      useState<Connection | null>(null);
    const [connectionModal, setConnectionModal] = useState({
      isOpen: false,
      sourceNodeName: "",
      targetNodeName: "",
      suggestedType: "",
    });
    const [validator, setValidator] = useState<ConnectionValidator | null>(
      null
    );
    const [importExportModal, setImportExportModal] = useState({
      isOpen: false,
    });
    const [importDetails, setImportDetails] = useState<{
      nodesCreated?: number;
      edgesCreated?: number;
      conflicts?: string[];
      warnings?: string[];
    }>({});

    useGraphPersistence(graphState, graphState.isInitialized);

    const {
      nodes,
      edges,
      pendingChanges,
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

    // useEffect hook to notify parent components when nodes change
    useEffect(() => {
      if (onNodesUpdated && isInitialized) {
        const backendNodes = nodes.map((fNode) => ({
          id: fNode.id,
          data: fNode.data,
          position: fNode.position,
          createdAt: fNode.data.createdAt,
          updatedAt: fNode.data.updatedAt,
        }));
        onNodesUpdated(backendNodes);
      }
    }, [nodes, onNodesUpdated, isInitialized]);

    // useEffect hook to notify parent components when edges change
    useEffect(() => {
      if (onEdgesUpdated && isInitialized) {
        onEdgesUpdated(edges);
      }
    }, [edges, onEdgesUpdated, isInitialized]);

    useEffect(() => {
      const flowEdges: Connection[] = edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? null,
        targetHandle: edge.targetHandle ?? null,
      }));
      setValidator(new ConnectionValidator(nodes, flowEdges));
    }, [nodes, edges]);

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

    const isValidConnection = useCallback(
      (connection: Connection): boolean => {
        if (!validator) return true;
        const result = validator.validateConnection(connection);
        if (!result.isValid) {
          addToast(result.reason || "Invalid connection", "error");
          return false;
        }
        return true;
      },
      [validator, addToast]
    );

    const onConnect = useCallback(
      (params: Connection) => {
        if (!isValidConnection(params)) return;
        const sourceNode = nodes.find((n) => n.id === params.source);
        const targetNode = nodes.find((n) => n.id === params.target);
        if (!sourceNode || !targetNode || !validator) return;
        const validation = validator.validateConnection(params);
        setPendingConnection(params);
        setConnectionModal({
          isOpen: true,
          sourceNodeName: sourceNode.data.name,
          targetNodeName: targetNode.data.name,
          suggestedType: validation.suggestedType || "custom",
        });
      },
      [nodes, validator, isValidConnection]
    );

    const handleCreateConnection = useCallback(
      (connectionData: MythSmithEdgeData) => {
        if (!pendingConnection) return;
        const newEdge: Edge = {
          ...pendingConnection,
          id: `edge_${uuidv4()}`,
          type: "mythsmith",
          data: connectionData,
          animated: connectionData.animated,
          source: pendingConnection.source ?? "",
          target: pendingConnection.target ?? "",
          sourceHandle: pendingConnection.sourceHandle ?? undefined,
          targetHandle: pendingConnection.targetHandle ?? undefined,
        };
        setEdges((eds) => addEdge(newEdge, eds));
        setPendingChanges((prev) => ({
          ...prev,
          newEdges: [...new Set([...prev.newEdges, newEdge.id])],
        }));
        saveStateToHistory();
        setPendingConnection(null);
        setConnectionModal((prev) => ({ ...prev, isOpen: false }));
        addToast(`${connectionData.type} connection created`, "success");
      },
      [pendingConnection, setEdges, saveStateToHistory, addToast]
    );

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
      queryKey: ["edges"],
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
        addToast("Data loaded successfully!", "success");
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
    ]);

    const saveMap = useCallback(async () => {
      if (!hasUnsavedChanges() || isSaving) return;
      setIsSaving(true);
      try {
        const nodesToCreate = nodes.filter((n) =>
          pendingChanges.newNodes.includes(n.id)
        );
        const idMapping: Record<string, string> = {};
        for (const node of nodesToCreate) {
          const createRequest: CreateNodeRequest = {
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
            idMapping[node.id] = String(createdNode.id);
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
        const updatedEdges = edges.map((edge) => {
          const newEdge = { ...edge };
          if (idMapping[edge.source]) {
            newEdge.source = idMapping[edge.source];
          }
          if (idMapping[edge.target]) {
            newEdge.target = idMapping[edge.target];
          }
          if (typeof newEdge.sourceHandle === "string") {
            Object.keys(idMapping).forEach((tempId) => {
              if (
                newEdge.sourceHandle &&
                newEdge.sourceHandle.includes(tempId)
              ) {
                newEdge.sourceHandle = newEdge.sourceHandle.replace(
                  tempId,
                  idMapping[tempId]
                );
              }
            });
          }
          if (typeof newEdge.targetHandle === "string") {
            Object.keys(idMapping).forEach((tempId) => {
              if (
                newEdge.targetHandle &&
                newEdge.targetHandle.includes(tempId)
              ) {
                newEdge.targetHandle = newEdge.targetHandle.replace(
                  tempId,
                  idMapping[tempId]
                );
              }
            });
          }
          return newEdge;
        });
        setEdges(updatedEdges);
        try {
          const savedEdges = localStorage.getItem(LOCALSTORAGE_KEYS.EDGES);
          if (savedEdges) {
            const parsedEdges = JSON.parse(savedEdges);
            const updatedLocalEdges = parsedEdges.map((edge: any) => {
              const newEdge = { ...edge };
              if (idMapping[edge.source]) {
                newEdge.source = idMapping[edge.source];
              }
              if (idMapping[edge.target]) {
                newEdge.target = idMapping[edge.target];
              }
              if (typeof newEdge.sourceHandle === "string") {
                Object.keys(idMapping).forEach((tempId) => {
                  if (
                    newEdge.sourceHandle &&
                    newEdge.sourceHandle.includes(tempId)
                  ) {
                    newEdge.sourceHandle = newEdge.sourceHandle.replace(
                      tempId,
                      idMapping[tempId]
                    );
                  }
                });
              }
              if (typeof newEdge.targetHandle === "string") {
                Object.keys(idMapping).forEach((tempId) => {
                  if (
                    newEdge.targetHandle &&
                    newEdge.targetHandle.includes(tempId)
                  ) {
                    newEdge.targetHandle = newEdge.targetHandle.replace(
                      tempId,
                      idMapping[tempId]
                    );
                  }
                });
              }
              return newEdge;
            });
            localStorage.setItem(
              LOCALSTORAGE_KEYS.EDGES,
              JSON.stringify(updatedLocalEdges)
            );
          }
        } catch (err) {
          console.error(
            "Failed to update edges in localStorage after ID remap:",
            err
          );
        }
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
            data: e.data,
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
      setNodes,
      setEdges,
      setPendingChanges,
      setHistory,
      setHistoryIndex,
    ]);

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

    const handleNodesChange = useCallback(
      (changes: any[]) => {
        onNodesChange(changes);
        changes.forEach((change) => {
          if (change.type !== "position" || !dragStartPosition) {
            if (change.type === "position" && change.position) {
              setPendingChanges((prev) => ({
                ...prev,
                updatedNodes: [...new Set([...prev.updatedNodes, change.id])],
              }));
            }
          }
        });
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

    const handleExport = useCallback(
      (format: "json" | "csv" | "graphml", filename?: string) => {
        try {
          // Convert flow nodes back to backend node format
          const backendNodes = nodes.map((fNode) => ({
            id: fNode.id,
            data: fNode.data,
            position: fNode.position,
            createdAt: fNode.data.createdAt,
            updatedAt: fNode.data.updatedAt,
          }));
          exportToFormat(backendNodes, edges, format, filename);
          addToast(`Graph exported as ${format.toUpperCase()}`, "success");
        } catch (error) {
          console.error("Export failed:", error);
          addToast("Failed to export graph", "error");
        }
      },
      [nodes, edges, addToast]
    );

    const handleImport = useCallback(
      async (file: File, mergeStrategy: "replace" | "merge") => {
        try {
          // Step 1: Validate the file
          const importResult = await importGraphData(file);
          if (!importResult.success) {
            throw new Error(importResult.error);
          }
          if (!importResult.data) {
            throw new Error("No data in import result");
          }

          // Step 2: Prepare data for backend
          const importRequest = prepareImportData(
            importResult.data,
            mergeStrategy
          );

          // Step 3: Send to backend
          const response = await apiService.import.importMap(importRequest);
          console.log("Import response:", response);
          setImportDetails({
            nodesCreated: response.nodesCreated,
            edgesCreated: response.edgesCreated,
            conflicts: response.conflicts,
            warnings: response.warnings,
          });

          // Step 4: Clear local storage to ensure fresh data from DB
          clearLocalStorage();

          // Step 5: Show success message
          let message = `Imported ${response.nodesCreated} nodes and ${response.edgesCreated} edges`;
          if (response.conflicts && response.conflicts.length > 0) {
            message += ` (${response.conflicts.length} conflicts resolved)`;
          }
          addToast(message, "success");

          // Step 6: Show warnings if any
          if (response.warnings && response.warnings.length > 0) {
            const warningCount = response.warnings.length;
            setTimeout(() => {
              addToast(
                `Import completed with ${warningCount} warnings`,
                "warning"
              );
            }, 1000);
          }

          // Step 7: Reset graph state and force reload from DB
          setNodes([]);
          setEdges([]);
          setHistory([]);
          setHistoryIndex(0);
          setPendingChanges({
            newNodes: [],
            updatedNodes: [],
            deletedNodes: [],
            newEdges: [],
            updatedEdges: [],
            deletedEdges: [],
          });

          // Step 8: Refresh data from backend
          queryClient.invalidateQueries({ queryKey: nodeKeys.all });
          queryClient.invalidateQueries({ queryKey: ["edges"] });
          setShouldLoadFromDB(true);
        } catch (error) {
          console.error("Import failed:", error);
          throw error;
        }
      },
      [
        queryClient,
        setShouldLoadFromDB,
        addToast,
        setNodes,
        setEdges,
        setHistory,
        setHistoryIndex,
        setPendingChanges,
      ]
    );

    const handleImportExportClick = useCallback(() => {
      setImportExportModal({ isOpen: true });
    }, []);

    const handleImportExportClose = useCallback(() => {
      setImportExportModal({ isOpen: false });
    }, []);

    const loadNodes = useCallback(async () => {
      clearLocalStorage();
      setShouldLoadFromDB(true);
      addToast("Loading data from server...", "info");
    }, [addToast, setShouldLoadFromDB]);

    const addNode = useCallback(
      async (nodeData: CreateNodeRequest) => {
        const tempId = `temp_${uuidv4()}`;
        const newFlowNode: FlowNode = {
          id: tempId,
          position: nodeData.position || { x: 0, y: 0 },
          data: {
            ...nodeData,
          },
          type: "mythsmith",
        };
        setNodes((nds) => [...nds, newFlowNode]);
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
        const isTempNode = nodeId.startsWith("temp_");
        if (!isTempNode) {
          try {
            await apiService.nodes.deleteNode(nodeId);
          } catch (error) {
            console.error("Failed to delete node from backend:", error);
            addToast("Failed to delete node. Please try again.", "error");
            return;
          }
        }
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
        setPendingChanges((prev) => {
          const newDeletedNodes = isTempNode
            ? prev.deletedNodes
            : [...new Set([...prev.deletedNodes, nodeId])];
          return {
            ...prev,
            deletedNodes: newDeletedNodes,
            newNodes: prev.newNodes.filter((id) => id !== nodeId),
            updatedNodes: prev.updatedNodes.filter((id) => id !== nodeId),
          };
        });
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
        setNodes((nds) => nds.map((n) => (n.id === nodeId ? updatedNode : n)));
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
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          connectionMode={ConnectionMode.Loose}
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
              onImportExport={handleImportExportClick}
              nodeCount={nodes.length}
              edgeCount={edges.length}
            />
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
        <ConnectionModal
          isOpen={connectionModal.isOpen}
          onClose={() => {
            setConnectionModal((prev) => ({ ...prev, isOpen: false }));
            setPendingConnection(null);
          }}
          onCreate={handleCreateConnection}
          sourceNodeName={connectionModal.sourceNodeName}
          targetNodeName={connectionModal.targetNodeName}
          suggestedType={connectionModal.suggestedType}
        />
        <ImportExportModal
          importDetails={importDetails}
          isOpen={importExportModal.isOpen}
          onClose={handleImportExportClose}
          onImport={handleImport}
          onExport={handleExport}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      </div>
    );
  }
);

WorldGraph.displayName = "WorldGraph";