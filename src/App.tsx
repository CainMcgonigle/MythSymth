import React, { useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactFlowProvider } from "reactflow";

import { useAppState } from "@/hooks/useAppState";
import { useAppHandlers } from "@/hooks/useAppHandlers";
import { useOptimisticUpdates } from "@/hooks/useOptimisticUpdatesSimple";
import { useNodes, useApiHealth } from "@/hooks/useNodes";
import { useIsElectron } from "@/utils/electronDetection";
import { createServiceContainer } from "@/services/serviceContainer";
import { CreateNodeRequest } from "@/types";

// Import components directly to avoid lazy loading issues
import { WorldGraph } from "@/components/WorldGraph";
import { NodeCreationModal } from "@/components/NodeCreationModal";
import NodeEditPanel from "@/components/NodeEditPanel";
import ConnectionAnalyticsPanel from "@/components/ConnectionAnalyticsPanel";

// Components
import Sidebar from "@/components/Sidebar";
import StatusBar from "@/components/Statusbar";
import { Toolbar } from "@/components/Toolbar";
import { TitleBar } from "@/components/electron/TitleBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { SidebarSkeleton, GraphSkeleton } from "@/components/ui/LoadingSkeleton";
import ErrorFallback from "@/components/ui/ErrorFallback";
import PerformanceDashboard from "@/components/ui/PerformanceDashboard";

import "./App.css";

const AppContent = React.memo(() => {
  const [showPerformanceDashboard, setShowPerformanceDashboard] = React.useState(false);
  const { state, actions, graphRef, toggleSidebar, toggleAnalytics } = useAppState();
  const { data: allNodes = [], isLoading, error, refetch } = useNodes();
  const { data: isOnline = false } = useApiHealth();
  const { isElectron, shouldShowTitleBar } = useIsElectron();

  // Optimistic updates hook
  const {
    optimisticCreateNode,
    optimisticUpdateNode,
    optimisticDeleteNode,
    pendingOperationsCount,
  } = useOptimisticUpdates();

  // App handlers with optimistic updates
  const {
    effectiveNodes,
    selectedNode,
    handleNodeSelect,
    handleEdgesUpdate,
    handleNodesUpdate,
  } = useAppHandlers({
    selectedNodeId: state.selectedNodeId,
    localNodes: state.localNodes,
    allNodes,
    unsavedNodeChanges: state.unsavedNodeChanges,
    graphRef,
    onNodeSelect: actions.setSelectedNodeId,
    onEdgesUpdate: actions.setCurrentEdges,
    onNodesUpdate: actions.setLocalNodes,
    onCreateModalOpen: actions.setIsCreateModalOpen,
    onUnsavedChangesUpdate: () => {
      // Handle unsaved changes logic here
    },
    clearUnsavedChanges: () => {
      // Clear unsaved changes logic here
    },
  });

  // Memoize filtered nodes
  const filteredNodes = useMemo(() => {
    return state.filter === "all"
      ? effectiveNodes
      : effectiveNodes.filter((node) => node.data.type === state.filter);
  }, [effectiveNodes, state.filter]);

  // Optimistic handlers
  const handleOptimisticCreateNode = React.useCallback(
    async (nodeData: CreateNodeRequest): Promise<void> => {
      if (!graphRef.current) return;

      optimisticCreateNode(
        nodeData,
        actions.setLocalNodes,
        async (data) => {
          return await graphRef.current!.addNode(data);
        }
      );
    },
    [optimisticCreateNode, actions.setLocalNodes, graphRef]
  );

  const handleOptimisticUpdateNode = React.useCallback(
    async (updatedNode: any) => {
      if (!state.selectedNodeId || !graphRef.current) return;

      const updates = {
        name: updatedNode.data.name,
        type: updatedNode.data.type,
        description: updatedNode.data.description,
        position: updatedNode.position,
      };

      return optimisticUpdateNode(
        state.selectedNodeId,
        updates,
        actions.setLocalNodes,
        async (nodeId, updateData) => {
          return await graphRef.current!.updateNode(nodeId, updateData);
        }
      );
    },
    [
      optimisticUpdateNode,
      state.selectedNodeId,
      actions.setLocalNodes,
      graphRef,
    ]
  );

  const handleOptimisticDeleteNode = React.useCallback(
    async (nodeId: string) => {
      if (!graphRef.current) return;

      return optimisticDeleteNode(
        nodeId,
        actions.setLocalNodes,
        async (id) => {
          await graphRef.current!.deleteNode(id);
        }
      );
    },
    [optimisticDeleteNode, actions.setLocalNodes, graphRef]
  );


  // Update local nodes when API data changes
  useEffect(() => {
    if (allNodes.length > 0 && state.localNodes.length === 0) {
      actions.setLocalNodes(allNodes);
    }
  }, [allNodes, state.localNodes.length, actions]);

  // Remove the performance monitoring from the main App component
  // as it's causing excessive re-renders and performance overhead

  // Keyboard shortcut for performance dashboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowPerformanceDashboard(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dynamic title
  const getAppTitle = () => {
    const baseTitle = "MythSmith - World Builder";
    const selectedNodeSuffix = selectedNode ? ` - ${selectedNode.data.name}` : "";
    const environmentSuffix = isElectron ? "" : " (Web)";
    const pendingSuffix = pendingOperationsCount > 0 ? " •" : "";

    return `${baseTitle}${selectedNodeSuffix}${environmentSuffix}${pendingSuffix}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="app flex flex-col h-screen">
        {shouldShowTitleBar && <TitleBar title="MythSmith - Loading..." />}
        <div className="flex-1 flex">
          <div className="w-80 border-r border-gray-700">
            <SidebarSkeleton />
          </div>
          <div className="flex-1">
            <GraphSkeleton />
          </div>
        </div>
        <StatusBar
          nodeCount={0}
          isOnline={isOnline}
          selectedNode={null}
        />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app flex flex-col h-screen">
        {shouldShowTitleBar && <TitleBar title="MythSmith - Error" />}
        <div className="flex-1">
          <ErrorFallback
            error={error}
            resetErrorBoundary={() => refetch()}
            title="Failed to load world data"
            description="Unable to connect to the backend service. Please check your connection."
          />
        </div>
        <StatusBar
          nodeCount={0}
          isOnline={false}
          selectedNode={null}
        />
      </div>
    );
  }

  return (
    <div className="app flex flex-col h-screen">
      {shouldShowTitleBar && (
        <TitleBar
          title={getAppTitle()}
          onMenuClick={() => setShowPerformanceDashboard(true)}
          onSettingsClick={() => console.log("Settings clicked")}
        />
      )}

      {/* Environment indicator */}
      {import.meta.env.DEV && !isElectron && (
        <div className="bg-yellow-600 text-yellow-100 text-xs px-2 py-1 text-center">
          Running in Web Browser - Some features may be limited
        </div>
      )}

      <Toolbar
        onCreateNode={() => actions.setIsCreateModalOpen(true)}
        onToggleSidebar={toggleSidebar}
        onQuickCreate={(type) => {
          const quickNode = {
            id: `temp_${Date.now()}`,
            name: `New ${type}`,
            type,
            description: "",
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            connectionDirection: "all" as const,
          };
          handleOptimisticCreateNode(quickNode);
        }}
        selectedNode={selectedNode}
        isSidebarOpen={state.sidebarVisible}
        onDragStart={actions.setDragNodeType}
      />

      <div className="app-body flex flex-grow relative overflow-hidden">
        <Sidebar
          nodes={effectiveNodes}
          filteredNodes={filteredNodes}
          filter={state.filter}
          onFilterChange={actions.setFilter}
          onNodeSelect={handleNodeSelect}
          selectedNode={selectedNode}
          isOpen={state.sidebarVisible}
          isLoading={isLoading}
        />

        <div className="main-content flex-grow relative">
          <ErrorBoundary>
            <ReactFlowProvider>
              <WorldGraph
                ref={graphRef}
                onNodeSelect={handleNodeSelect}
                onNodesUpdated={handleNodesUpdate}
                onEdgesUpdated={handleEdgesUpdate}
                dragNodeType={state.dragNodeType}
                onDragEnd={() => actions.setDragNodeType(null)}
              />
            </ReactFlowProvider>
            
            <ConnectionAnalyticsPanel
              edges={state.currentEdges}
              nodes={effectiveNodes}
              isOpen={state.analyticsOpen}
              onToggle={toggleAnalytics}
            />
          </ErrorBoundary>
        </div>

        {/* Node edit panel */}
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
              onUpdate={handleOptimisticUpdateNode}
              onDelete={() => handleOptimisticDeleteNode(selectedNode.id)}
              onClose={() => actions.setSelectedNodeId(null)}
            />
          )}
        </div>
      </div>

      <NodeCreationModal
        isOpen={state.isCreateModalOpen}
        onClose={() => actions.setIsCreateModalOpen(false)}
        onCreate={handleOptimisticCreateNode}
      />

      <StatusBar
        nodeCount={effectiveNodes.length}
        isOnline={isOnline}
        selectedNode={selectedNode}
        pendingOperationsCount={pendingOperationsCount}
        lastSyncTime={new Date()}
      />

      <PerformanceDashboard
        isOpen={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />
    </div>
  );
});

AppContent.displayName = 'AppContent';

const App = React.memo(() => {
  const [container] = React.useState(() => createServiceContainer());
  
  React.useEffect(() => {
    const initializeContainer = async () => {
      try {
        await container.initialize();
      } catch (error) {
        console.error('Failed to initialize service container', error);
      }
    };
    initializeContainer();
  }, [container]);
  
  return (
    <QueryClientProvider client={container.queryClient}>
      <ToastProvider>
        <AppContent />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </ToastProvider>
    </QueryClientProvider>
  );
});

App.displayName = 'App';

export default App;