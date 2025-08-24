import React, {
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  ConnectionMode,
  Node as FlowNode,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

// Hooks and utilities
import { useGraphState } from '@/hooks/useGraphState';
import { useGraphPersistence } from '@/hooks/useGraphPersistence';
import { useGraphMutations } from '@/hooks/useGraphMutations';
import { initializeFromLocalStorage, clearLocalStorage, convertToFlowNode } from '@/utils/graphUtils';
import { LOCALSTORAGE_KEYS } from '@/constants/graphConstants';
import { GRID_SIZE } from '@/constants/graphConstants';
import { WorldGraphProps, WorldGraphRef } from '@/types/graphTypes';
import { CreateNodeRequest, Node, NodeType } from '@/types';

// Component imports
import MythSmithNode from '@/components/graphComponents/MythSmithNode';
import MythSmithEdge from '@/components/graphComponents/MythSmithEdge';
import CustomControls from '@/components/CustomControls';
import { useToast } from '@/components/ui/Toast';
import { apiService } from '@/services/apiService';
import ContextMenu, { ContextMenuOption } from '@/components/ui/ContextMenu';
import NodeDetailsCard from '@/components/ui/NodeDetailsCard';
import ConnectionDetailsCard from '@/components/graphComponents/edges/connectionDetailsCard';
import { Edit, Trash2, Eye } from 'lucide-react';
import { MythSmithEdgeData } from '@/types';
import { EdgeInteractionProvider } from '@/contexts/EdgeInteractionContext';

// New focused components
import { GraphDataManager } from './graph/GraphDataManager';
import { useGraphConnectionHandler } from './graph/GraphConnectionHandler';
import { useGraphKeyboardHandler } from './graph/GraphKeyboardHandler';
import { useGraphAutoSave } from './graph/GraphAutoSave';
import { useGraphDragDrop } from './graph/GraphDragDrop';
import { useGraphImportExport } from './graph/GraphImportExport';

const nodeTypes = { mythsmith: MythSmithNode };
const edgeTypes = { mythsmith: MythSmithEdge };

interface UpdatedWorldGraphProps extends WorldGraphProps {
  onEdgesUpdated?: (edges: Edge[]) => void;
  dragNodeType?: NodeType | null;
  onDragEnd?: () => void;
}

export const WorldGraph = forwardRef<WorldGraphRef, UpdatedWorldGraphProps>(
  ({ onNodeSelect, onNodesUpdated, onEdgesUpdated, dragNodeType, onDragEnd }, ref) => {
    const graphState = useGraphState();
    const { saveMapMutation, createNodeMutation } = useGraphMutations();
    const { addToast } = useToast();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [dragStartPosition, setDragStartPosition] = useState<{
      id: string;
      position: { x: number; y: number };
    } | null>(null);
    
    const [nodeDetailsCard, setNodeDetailsCard] = useState<{
      isVisible: boolean;
      node: Node | null;
      position: { x: number; y: number };
    }>({ isVisible: false, node: null, position: { x: 0, y: 0 } });
    
    const [nodeContextMenu, setNodeContextMenu] = useState<{
      x: number;
      y: number;
      node: Node | null;
    } | null>(null);
    
    const [connectionDetailsCard, setConnectionDetailsCard] = useState<{
      isVisible: boolean;
      data: MythSmithEdgeData | null;
      position: { x: number; y: number };
    }>({ isVisible: false, data: null, position: { x: 0, y: 0 } });

    // Destructure graph state
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

    useGraphPersistence(graphState, isInitialized);

    // Initialize from localStorage
    useEffect(() => {
      const { savedNodes, savedEdges, savedPendingChanges } = initializeFromLocalStorage();
      if (savedNodes !== null && savedEdges !== null) {
        console.log('Found data in localStorage. Hydrating state.');
        setNodes(savedNodes);
        setEdges(savedEdges);
        setHistory([{ nodes: savedNodes, edges: savedEdges }]);
        setHistoryIndex(0);
        if (savedPendingChanges) {
          setPendingChanges(savedPendingChanges);
        }
        setIsInitialized(true);
      } else {
        console.log('No data in localStorage. Triggering DB fetch.');
        setShouldLoadFromDB(true);
      }
    }, []);

    // Connection handling
    const connectionHandler = useGraphConnectionHandler({
      nodes,
      edges,
      setEdges,
      setPendingChanges,
      saveStateToHistory,
    });

    // Save function
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
      setIsSaving,
    ]);

    // Keyboard shortcuts
    useGraphKeyboardHandler({
      undo,
      redo,
      hasUnsavedChanges,
      isSaving,
      saveMap,
    });

    // Auto-save
    useGraphAutoSave({
      autoSaveEnabled,
      autoSaveInterval,
      hasUnsavedChanges,
      isSaving,
      isInitialized,
      saveMap,
    });

    // Node operations (defined early for drag drop)
    const addNode = useCallback(
      async (nodeData: CreateNodeRequest) => {
        const tempId = `temp_${uuidv4()}`;
        const newFlowNode: FlowNode = {
          id: tempId,
          position: nodeData.position || { x: 0, y: 0 },
          data: { ...nodeData },
          type: 'mythsmith',
        };
        setNodes((nds) => [...nds, newFlowNode]);
        setPendingChanges((prev) => ({
          ...prev,
          newNodes: [...prev.newNodes, tempId],
        }));
        saveStateToHistory();
        return newFlowNode;
      },
      [setNodes, saveStateToHistory, setPendingChanges]
    );

    // Drag and drop
    const { onDragOver, onDrop } = useGraphDragDrop({
      dragNodeType: dragNodeType || null,
      reactFlowWrapper,
      addNode,
      onDragEnd,
    });

    // Import/Export
    const { handleImportExportClick, ImportExportModalComponent } = useGraphImportExport({
      nodes,
      edges,
      setNodes,
      setEdges,
      setHistory,
      setHistoryIndex,
      setPendingChanges,
      setShouldLoadFromDB,
    });

    // Notify parent components of changes
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

    useEffect(() => {
      if (onEdgesUpdated && isInitialized) {
        onEdgesUpdated(edges);
      }
    }, [edges, onEdgesUpdated, isInitialized]);

    // Additional node operations

    const deleteNode = useCallback(
      async (nodeId: string) => {
        const isTempNode = nodeId.startsWith('temp_');
        if (!isTempNode) {
          try {
            await apiService.nodes.deleteNode(nodeId);
          } catch (error) {
            console.error('Failed to delete node from backend:', error);
            addToast('Failed to delete node. Please try again.', 'error');
            return;
          }
        }
        
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) =>
          eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
        );
        
        if (onNodeSelect) {
          onNodeSelect(null);
        }
        saveStateToHistory();
        addToast('Node deleted successfully', 'success');
      },
      [setNodes, setEdges, onNodeSelect, saveStateToHistory, addToast]
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
        
        return Promise.resolve({
          id: updatedNode.id,
          data: updatedNode.data,
          position: updatedNode.position,
        } as Node);
      },
      [nodes, setNodes, saveStateToHistory, setPendingChanges]
    );

    const loadNodes = useCallback(() => {
      clearLocalStorage();
      setShouldLoadFromDB(true);
      addToast('Loading data from server...', 'info');
      return Promise.resolve();
    }, [addToast, setShouldLoadFromDB]);

    // Event handlers
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
      [dragStartPosition, saveStateToHistory, setPendingChanges]
    );

    const convertFlowNodeToNode = useCallback((flowNode: any): Node => {
      return {
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
    }, []);

    const handleNodeClick = useCallback(
      (event: React.MouseEvent, flowNode: any) => {
        event.stopPropagation();
        
        const selectedNode = convertFlowNodeToNode(flowNode);
        
        setConnectionDetailsCard({ isVisible: false, data: null, position: { x: 0, y: 0 } });
        setNodeDetailsCard({ 
          isVisible: true, 
          node: selectedNode,
          position: { x: event.clientX, y: event.clientY }
        });
      },
      [convertFlowNodeToNode]
    );

    const handleNodeContextMenu = useCallback(
      (event: React.MouseEvent, flowNode: any) => {
        event.preventDefault();
        event.stopPropagation();
        
        const selectedNode = convertFlowNodeToNode(flowNode);
        
        setNodeContextMenu({
          x: event.clientX,
          y: event.clientY,
          node: selectedNode,
        });
      },
      [convertFlowNodeToNode]
    );

    const handlePaneClick = useCallback(() => {
      if (onNodeSelect) {
        onNodeSelect(null);
      }
      // Close any open modals/menus
      setNodeDetailsCard({ isVisible: false, node: null, position: { x: 0, y: 0 } });
      setNodeContextMenu(null);
      setConnectionDetailsCard({ isVisible: false, data: null, position: { x: 0, y: 0 } });
    }, [onNodeSelect]);

    const showConnectionDetails = useCallback((edgeId: string, data: MythSmithEdgeData, position: { x: number; y: number }) => {
      setNodeDetailsCard({ isVisible: false, node: null, position: { x: 0, y: 0 } });
      setConnectionDetailsCard({
        isVisible: true,
        data,
        position,
      });
    }, []);

    const getNodeContextMenuOptions = useCallback((node: Node): ContextMenuOption[] => [
      {
        icon: Eye,
        label: 'View Details',
        onClick: () => setNodeDetailsCard({ 
          isVisible: true, 
          node,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        }),
      },
      {
        icon: Edit,
        label: 'Edit',
        onClick: () => {
          if (onNodeSelect) {
            onNodeSelect(node);
          }
        },
      },
      {
        icon: Trash2,
        label: 'Delete',
        onClick: () => deleteNode(node.id),
        className: 'text-red-400 hover:bg-gray-700',
      },
    ], [onNodeSelect, deleteNode]);

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

    // Imperative handle for ref
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

    if (!isInitialized) {
      return <div>Loading...</div>;
    }

    return (
      <div ref={reactFlowWrapper} style={{ height: '100%', width: '100%' }}>
        <GraphDataManager
          shouldLoadFromDB={shouldLoadFromDB}
          setShouldLoadFromDB={setShouldLoadFromDB}
          setNodes={setNodes}
          setEdges={setEdges}
          setHistory={setHistory}
          setHistoryIndex={setHistoryIndex}
          setIsInitialized={setIsInitialized}
          setPendingChanges={setPendingChanges}
        />
        
        <EdgeInteractionProvider showConnectionDetails={showConnectionDetails}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={connectionHandler.onConnect}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            isValidConnection={connectionHandler.isValidConnection}
            connectionMode={ConnectionMode.Loose}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
            style={{ backgroundColor: '#2d3748' }}
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
            onDragOver={onDragOver}
            onDrop={onDrop}
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
                character: '#93c5fd',
                faction: '#fca5a5',
                city: '#fdba74',
                event: '#6ee7b7',
                location: '#d8b4fe',
              };
              return colors[node.data?.type as NodeType] || '#DDD';
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
        </EdgeInteractionProvider>
        
        {connectionHandler.ConnectionModal}
        {ImportExportModalComponent}
        
        {nodeDetailsCard.node && (
          <NodeDetailsCard
            key="node-details-card"
            isVisible={nodeDetailsCard.isVisible}
            node={nodeDetailsCard.node}
            position={nodeDetailsCard.position}
            onClose={() => setNodeDetailsCard({ isVisible: false, node: null, position: { x: 0, y: 0 } })}
          />
        )}
        
        {nodeContextMenu && nodeContextMenu.node && (
          <ContextMenu
            x={nodeContextMenu.x}
            y={nodeContextMenu.y}
            options={getNodeContextMenuOptions(nodeContextMenu.node)}
            onClose={() => setNodeContextMenu(null)}
          />
        )}
        
        {connectionDetailsCard.data && (
          <ConnectionDetailsCard
            key="connection-details-card"
            isVisible={connectionDetailsCard.isVisible}
            data={connectionDetailsCard.data}
            position={connectionDetailsCard.position}
            onClose={() => setConnectionDetailsCard({ isVisible: false, data: null, position: { x: 0, y: 0 } })}
          />
        )}
      </div>
    );
  }
);

WorldGraph.displayName = 'WorldGraph';