import React, { useState, useRef, useEffect } from "react";
import { WorldGraph } from "@/components/WorldGraph";
import { WorldGraphRef } from "@/types/graphTypes";
import { NodeCreationModal } from "@/components/NodeCreationModal";
import NodeEditPanel from "@/components/NodeEditPanel";
import { Sidebar } from "@/components/Sidebar";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/Statusbar";
import { Node, CreateNodeRequest, NodeType, UpdateNodeRequest } from "@/types";
import { useNodes, useApiHealth } from "@/hooks/useNodes";
import "./App.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useToast } from "@/components/ui/Toast";
import { apiService } from "@/services/api";
import { v4 as uuidv4 } from "uuid";

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

const AppContent: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [filter, setFilter] = useState<NodeType | "all">("all");
  const graphRef = useRef<WorldGraphRef>(null);
  const { data: allNodes = [], isLoading, error, refetch } = useNodes();
  const { data: isOnline = false } = useApiHealth();
  const { addToast } = useToast();

  const filteredNodes =
    filter === "all"
      ? allNodes
      : allNodes.filter((node) => node.data.type === filter);

  const handleNodeSelect = (node: Node | null) => {
    setSelectedNode(node);
  };

  useEffect(() => {
    apiService.setQueryClient(queryClient);
  }, []);

  const handleCreateNode = async (nodeData: CreateNodeRequest) => {
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
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      if (graphRef.current) {
        await graphRef.current.deleteNode(nodeId);
      }
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to delete node:", error);
      addToast("Failed to delete node. Please try again.", "error");
    }
  };

  const handleFilterChange = (newFilter: NodeType | "all") => {
    setFilter(newFilter);
  };

  const handleQuickCreate = (type: NodeType) => {
    const quickNode: CreateNodeRequest = {
      id: `temp_${uuidv4()}`, // Generate a unique ID
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
  };

  const handleNodeUpdate = async (updatedNode: Node) => {
    if (!selectedNode) return;
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
        await graphRef.current.updateNode(String(selectedNode.id), updates);
      }

      setSelectedNode(updatedNode);
      addToast("Node updated.", "info");
    } catch (error) {
      console.error("Failed to update node:", error);
      addToast("Failed to update node. Please try again.", "error");
    }
  };

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
          nodes={allNodes}
          filteredNodes={filteredNodes}
          filter={filter}
          onFilterChange={handleFilterChange}
          onNodeSelect={handleNodeSelect}
          selectedNode={selectedNode}
          isOpen={sidebarVisible}
        />
        <div className="main-content flex-grow relative">
          <ErrorBoundary>
            <WorldGraph
              ref={graphRef}
              onNodeSelect={handleNodeSelect}
              onNodesUpdated={() => {}}
            />
          </ErrorBoundary>
        </div>
        {/* NodeEditPanel - conditionally rendered with width transition */}
        <div
          className={`
          flex flex-col flex-shrink-0
          bg-gray-800 border-l border-gray-700
          transition-all duration-300 ease-in-out
          ${selectedNode ? "w-80" : "w-0 overflow-hidden"}
        `}
        >
          {selectedNode && (
            <NodeEditPanel
              node={selectedNode}
              onUpdate={handleNodeUpdate}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNode(null)}
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
        nodeCount={allNodes.length}
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
      {/* React Query DevTools - positioned in top-right corner */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
    </QueryClientProvider>
  );
};

export default App;
