import React, { useState, useRef, useEffect } from "react";
import { WorldGraph, WorldGraphRef } from "./components/WorldGraph";
import { NodeCreationModal } from "./components/NodeCreationModal";
import { NodeEditPanel } from "./components/NodeEditPanel";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/Statusbar";
import { Node, CreateNodeRequest, NodeType, UpdateNodeRequest } from "./types";
import {
  useNodes,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useApiHealth,
} from "./hooks/useNodes";
import "./App.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true); // Removed editPanelVisible state, controlled by selectedNode now
  const [filter, setFilter] = useState<NodeType | "all">("all");

  const graphRef = useRef<WorldGraphRef>(null); // React Query hooks

  const { data: allNodes = [], isLoading, error, refetch } = useNodes();
  const { data: isOnline = false } = useApiHealth();
  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode(); // Filter nodes in the component instead of in the query

  const filteredNodes =
    filter === "all"
      ? allNodes
      : allNodes.filter((node) => node.data.type === filter);

  const handleNodeSelect = (node: Node | null) => {
    setSelectedNode(node);
  };

  const handleCreateNode = async (nodeData: CreateNodeRequest) => {
    try {
      await createNodeMutation.mutateAsync(nodeData); // Add node to graph
      if (graphRef.current) {
        await graphRef.current.addNode(nodeData);
      } // Close modal
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create node:", error); // You might want to show a toast notification here
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    try {
      await deleteNodeMutation.mutateAsync(Number(nodeId)); // Remove from graph
      if (graphRef.current) {
        await graphRef.current.deleteNode(nodeId);
      } // Clear selection
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to delete node:", error); // You might want to show a toast notification here
    }
  };

  const handleFilterChange = (newFilter: NodeType | "all") => {
    setFilter(newFilter); // No need to refetch - we're filtering client-side now
  };

  const handleQuickCreate = (type: NodeType) => {
    const quickNode: CreateNodeRequest = {
      name: `New ${type}`,
      type,
      description: "",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
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

      await updateNodeMutation.mutateAsync({
        id: Number(selectedNode.id),
        updates,
      });

      if (graphRef.current) {
        await graphRef.current.updateNode(String(selectedNode.id), updates);
      }

      setSelectedNode(updatedNode);
    } catch (error) {
      console.error("Failed to update node:", error);
    }
  }; // Handle loading and error states

  if (isLoading) {
    return (
      <div className="app flex items-center justify-center h-screen">
                <div className="text-lg">Loading nodes...</div>     {" "}
      </div>
    );
  }

  if (error) {
    return (
      <div className="app flex flex-col items-center justify-center h-screen">
               {" "}
        <div className="text-lg text-red-600 mb-4">
                    Failed to load nodes: {error.message}       {" "}
        </div>
               {" "}
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
                    Retry        {" "}
        </button>
             {" "}
      </div>
    );
  }

  return (
    <div className="app flex flex-col h-screen">
           {" "}
      <Toolbar
        onCreateNode={() => setIsCreateModalOpen(true)}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onQuickCreate={handleQuickCreate}
        selectedNode={selectedNode}
        onDeleteNode={handleDeleteNode}
        isSidebarOpen={sidebarVisible}
      />
           {" "}
      <div className="app-body flex flex-grow relative overflow-hidden">
               {" "}
        <Sidebar
          nodes={allNodes} // Pass all nodes for correct counts
          filteredNodes={filteredNodes} // Pass filtered nodes for display
          filter={filter}
          onFilterChange={handleFilterChange}
          onNodeSelect={handleNodeSelect}
          selectedNode={selectedNode}
          isOpen={sidebarVisible}
        />
               {" "}
        <div className="main-content flex-grow">
                   {" "}
          <WorldGraph
            ref={graphRef}
            onNodeSelect={handleNodeSelect}
            onNodesUpdated={() => {}} // No longer needed since React Query handles state
          />
                 {" "}
        </div>
        <NodeEditPanel
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedNode(null)} // Close panel by clearing selectedNode
        />
             {" "}
      </div>
           {" "}
      <NodeCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateNode}
      />
           {" "}
      <StatusBar
        nodeCount={allNodes.length}
        isOnline={isOnline}
        selectedNode={selectedNode}
      />
         {" "}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
            <AppContent />     {" "}
      {/* React Query DevTools - positioned in top-right corner */}
           {" "}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> 
       {" "}
    </QueryClientProvider>
  );
};

export default App;
