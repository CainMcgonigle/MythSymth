import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { WorldGraph } from "@/components/WorldGraph";
import { WorldGraphRef } from "@/types/graphTypes";
import { NodeCreationModal } from "@/components/NodeCreationModal";
import NodeEditPanel from "@/components/NodeEditPanel";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/Statusbar";
import ConnectionAnalyticsPanel from "@/components/ConnectionAnalyticsPanel";
import { Node, CreateNodeRequest, NodeType, UpdateNodeRequest } from "@/types";
import { useNodes, useApiHealth } from "@/hooks/useNodes";
import "./App.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/ui/Toast";
import { apiService } from "@/services/apiService";
import { v4 as uuidv4 } from "uuid";
import { Edge } from "reactflow";
import { ReactFlowProvider } from "reactflow";
import { isEqual } from "lodash";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const MemoizedNodeEditPanel = React.memo(
  NodeEditPanel,
  (prevProps, nextProps) => {
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.data.name === nextProps.node.data.name &&
      prevProps.node.data.type === nextProps.node.data.type &&
      prevProps.node.data.description === nextProps.node.data.description &&
      prevProps.node.position.x === nextProps.node.position.x &&
      prevProps.node.position.y === nextProps.node.position.y
    );
  }
);

const AppContent: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [filter, setFilter] = useState<NodeType | "all">("all");
  const [currentEdges, setCurrentEdges] = useState<Edge[]>([]);
  const [localNodes, setLocalNodes] = useState<Node[]>([]);
  // New state to track unsaved changes
  const [unsavedNodeChanges, setUnsavedNodeChanges] = useState<
    Record<string, Partial<Node>>
  >({});
  const graphRef = useRef<WorldGraphRef>(null);
  const { data: allNodes = [], isLoading, error, refetch } = useNodes();
  const { data: isOnline = false } = useApiHealth();
  const { addToast } = useToast();

  // Memoize effective nodes
  const effectiveNodes = useMemo(() => {
    return localNodes.length > 0 ? localNodes : allNodes;
  }, [localNodes, allNodes]);

  // Memoize selected node with unsaved changes applied
  const selectedNode = useMemo((): Node | null => {
    if (!selectedNodeId) return null;
    const baseNode = effectiveNodes.find((node) => node.id === selectedNodeId);
    if (!baseNode) return null;

    // Apply unsaved changes if any
    const unsavedChanges = unsavedNodeChanges[selectedNodeId];
    if (unsavedChanges) {
      return {
        ...baseNode,
        ...unsavedChanges,
        data: {
          ...baseNode.data,
          ...(unsavedChanges.data || {}),
        },
      };
    }
    return baseNode;
  }, [selectedNodeId, effectiveNodes, unsavedNodeChanges]);

  // Memoize filtered nodes
  const filteredNodes = useMemo(() => {
    return filter === "all"
      ? effectiveNodes
      : effectiveNodes.filter((node) => node.data.type === filter);
  }, [effectiveNodes, filter]);

  // Memoize callbacks
  const handleNodeSelect = useCallback((node: Node | null) => {
    setSelectedNodeId(node ? node.id : null);
    // Clear unsaved changes when selecting a different node
    if (node) {
      setUnsavedNodeChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[node.id];
        return newChanges;
      });
    }
  }, []);

  const handleEdgesUpdate = useCallback((edges: Edge[]) => {
    setCurrentEdges(edges);
  }, []);

  const handleNodesUpdate = useCallback(
    (nodes: Node[]) => {
      // Only update if nodes actually changed
      if (!isEqual(nodes, localNodes)) {
        setLocalNodes(nodes);

        // Preserve unsaved changes when nodes are updated
        if (selectedNodeId) {
          const updatedNode = nodes.find((n) => n.id === selectedNodeId);
          if (!updatedNode) {
            setSelectedNodeId(null);
          } else {
            // Check if we have unsaved changes for this node
            const unsavedChanges = unsavedNodeChanges[selectedNodeId];
            if (unsavedChanges) {
              // Re-apply unsaved changes to the updated node
              setLocalNodes((prevNodes) =>
                prevNodes.map((node) =>
                  node.id === selectedNodeId
                    ? {
                        ...node,
                        ...unsavedChanges,
                        data: {
                          ...node.data,
                          ...(unsavedChanges.data || {}),
                        },
                      }
                    : node
                )
              );
            }
          }
        }
      }
    },
    [localNodes, selectedNodeId, unsavedNodeChanges]
  );

  const handleCreateNode = useCallback(
    async (nodeData: CreateNodeRequest) => {
      try {
        if (graphRef.current) {
          await graphRef.current.addNode(nodeData);
        }
        setIsCreateModalOpen(false);
        addToast("Node created.", "info");
      } catch (error) {
        console.error("Failed to create node:", error);
        addToast("Failed to create node. Please try again.", "error");
      }
    },
    [addToast]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      try {
        if (graphRef.current) {
          await graphRef.current.deleteNode(nodeId);
        }
        setSelectedNodeId(null);
        // Clear unsaved changes for this node
        setUnsavedNodeChanges((prev) => {
          const newChanges = { ...prev };
          delete newChanges[nodeId];
          return newChanges;
        });
      } catch (error) {
        console.error("Failed to delete node:", error);
        addToast("Failed to delete node. Please try again.", "error");
      }
    },
    [addToast]
  );

  const handleFilterChange = useCallback((newFilter: NodeType | "all") => {
    setFilter(newFilter);
  }, []);

  const handleQuickCreate = useCallback(
    (type: NodeType) => {
      const quickNode: CreateNodeRequest = {
        id: `temp_${uuidv4()}`,
        name: `New ${type}`,
        type,
        description: "",
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
        connectionDirection: "all",
      };
      handleCreateNode(quickNode);
    },
    [handleCreateNode]
  );

  const handleNodeUpdate = useCallback(
    async (updatedNode: Node) => {
      if (!selectedNodeId) return;

      try {
        const updates: UpdateNodeRequest = {
          name: updatedNode.data.name,
          type: updatedNode.data.type,
          description: updatedNode.data.description,
          position: {
            x: updatedNode.position.x,
            y: updatedNode.position.y,
          },
        };

        if (graphRef.current) {
          await graphRef.current.updateNode(selectedNodeId, updates);
        }

        // Clear unsaved changes after successful save
        setUnsavedNodeChanges((prev) => {
          const newChanges = { ...prev };
          delete newChanges[selectedNodeId];
          return newChanges;
        });

        addToast("Node updated.", "info");
      } catch (error) {
        console.error("Failed to update node:", error);
        addToast("Failed to update node. Please try again.", "error");
      }
    },
    [selectedNodeId, addToast]
  );

  // New callback to track unsaved changes
  // New callback to track unsaved changes
  const handleNodeChange = useCallback(
    (nodeId: string, changes: Partial<Node>) => {
      setUnsavedNodeChanges((prev) => {
        const existingChanges = prev[nodeId];
        const newChanges: Partial<Node> = {
          ...existingChanges,
          ...changes,
        };

        // Only merge data if both exist and have data properties
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
          [nodeId]: newChanges,
        };
      });
    },
    []
  );

  useEffect(() => {
    apiService.setQueryClient(queryClient);
  }, []);

  // Update local nodes when API data changes
  useEffect(() => {
    if (allNodes.length > 0 && localNodes.length === 0) {
      setLocalNodes(allNodes);
    }
  }, [allNodes, localNodes.length]);

  if (isLoading) {
    return (
      <div className="app flex items-center justify-center h-screen">
        <div className="text-lg">Loading nodes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app flex flex-col items-center justify-center h-screen">
        <div className="text-lg text-red-600 mb-4">
          Failed to load nodes: {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app flex flex-col h-screen">
      <Toolbar
        onCreateNode={() => setIsCreateModalOpen(true)}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onQuickCreate={handleQuickCreate}
        selectedNode={selectedNode}
        isSidebarOpen={sidebarVisible}
      />
      <div className="app-body flex flex-grow relative overflow-hidden">
        <Sidebar
          nodes={effectiveNodes}
          filteredNodes={filteredNodes}
          filter={filter}
          onFilterChange={handleFilterChange}
          onNodeSelect={handleNodeSelect}
          selectedNode={selectedNode}
          isOpen={sidebarVisible}
        />
        <div className="main-content flex-grow relative">
          <ErrorBoundary>
            <ReactFlowProvider>
              <WorldGraph
                ref={graphRef}
                onNodeSelect={handleNodeSelect}
                onNodesUpdated={handleNodesUpdate}
                onEdgesUpdated={handleEdgesUpdate}
              />
            </ReactFlowProvider>
          </ErrorBoundary>
          <ConnectionAnalyticsPanel
            edges={currentEdges}
            nodes={effectiveNodes}
            isOpen={analyticsOpen}
            onToggle={() => setAnalyticsOpen(!analyticsOpen)}
          />
        </div>
        <div
          className={`
          flex flex-col flex-shrink-0
          bg-gray-800 border-l border-gray-700
          transition-all duration-300 ease-in-out
          ${selectedNode ? "w-80" : "w-0 overflow-hidden"}
        `}
        >
          {selectedNode && (
            <MemoizedNodeEditPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
        </div>
      </div>
      <NodeCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateNode}
      />
      <StatusBar
        nodeCount={effectiveNodes.length}
        isOnline={isOnline}
        selectedNode={selectedNode}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
};

export default App;
