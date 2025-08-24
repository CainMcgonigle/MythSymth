import { useCallback, useMemo } from "react";
import { Edge } from "reactflow";
import { isEqual } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { 
  Node, 
  NodeType, 
  CreateNodeRequest, 
  UpdateNodeRequest 
} from "@/types";
import { WorldGraphRef } from "@/types/graphTypes";
import { useToast } from "@/components/ui/Toast";
import { createContextLogger } from "@/services/loggerService";

interface UseAppHandlersProps {
  selectedNodeId: string | null;
  localNodes: Node[];
  allNodes: Node[];
  unsavedNodeChanges: Record<string, Partial<Node>>;
  graphRef: React.RefObject<WorldGraphRef>;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgesUpdate: (edges: Edge[]) => void;
  onNodesUpdate: (nodes: Node[]) => void;
  onCreateModalOpen: (open: boolean) => void;
  onUnsavedChangesUpdate: (nodeId: string, changes: Partial<Node>) => void;
  clearUnsavedChanges: (nodeId: string) => void;
}

export const useAppHandlers = ({
  selectedNodeId,
  localNodes,
  allNodes,
  unsavedNodeChanges,
  graphRef,
  onNodeSelect,
  onEdgesUpdate,
  onNodesUpdate,
  onCreateModalOpen,
  onUnsavedChangesUpdate,
  clearUnsavedChanges,
}: UseAppHandlersProps) => {
  const { addToast } = useToast();
  const logger = createContextLogger('AppHandlers');

  // Memoize effective nodes
  const effectiveNodes = useMemo(() => {
    return localNodes.length > 0 ? localNodes : allNodes;
  }, [localNodes, allNodes]);

  // Memoize selected node with unsaved changes applied
  const selectedNode = useMemo((): Node | null => {
    if (!selectedNodeId) return null;
    
    const baseNode = effectiveNodes.find((node) => node.id === selectedNodeId);
    if (!baseNode) return null;

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

  // Node selection handler
  const handleNodeSelect = useCallback((node: Node | null) => {
    logger.debug("Node selected", { nodeId: node?.id, nodeName: node?.data.name });
    onNodeSelect(node ? node.id : null);
    
    if (node) {
      clearUnsavedChanges(node.id);
    }
  }, [onNodeSelect, clearUnsavedChanges, logger]);

  // Edges update handler
  const handleEdgesUpdate = useCallback((edges: Edge[]) => {
    // Only log if edge count actually changed to avoid spam
    if (edges.length !== (window as any).__lastEdgeCount) {
      logger.debug("Edges updated", { count: edges.length });
      (window as any).__lastEdgeCount = edges.length;
    }
    onEdgesUpdate(edges);
  }, [onEdgesUpdate, logger]);

  // Nodes update handler
  const handleNodesUpdate = useCallback(
    (nodes: Node[]) => {
      if (!isEqual(nodes, localNodes)) {
        logger.debug("Nodes updated", { count: nodes.length });
        onNodesUpdate(nodes);

        // Preserve unsaved changes when nodes are updated
        if (selectedNodeId) {
          const updatedNode = nodes.find((n) => n.id === selectedNodeId);
          if (!updatedNode) {
            onNodeSelect(null);
          } else {
            const unsavedChanges = unsavedNodeChanges[selectedNodeId];
            if (unsavedChanges) {
              // Re-apply unsaved changes to the updated node
              const updatedNodes = nodes.map((node) =>
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
              );
              onNodesUpdate(updatedNodes);
            }
          }
        }
      }
    },
    [localNodes, selectedNodeId, unsavedNodeChanges, onNodesUpdate, onNodeSelect, logger]
  );

  // Create node handler
  const handleCreateNode = useCallback(
    async (nodeData: CreateNodeRequest) => {
      try {
        logger.info("Creating node", { type: nodeData.type, name: nodeData.name });
        
        if (graphRef.current) {
          await graphRef.current.addNode(nodeData);
        }
        
        onCreateModalOpen(false);
        addToast("Node created successfully", "success");
        
        logger.info("Node created successfully", { nodeId: nodeData.id });
      } catch (error) {
        logger.error("Failed to create node", error as Error, { nodeData });
        addToast("Failed to create node. Please try again.", "error");
      }
    },
    [graphRef, onCreateModalOpen, addToast, logger]
  );

  // Delete node handler
  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      try {
        logger.info("Deleting node", { nodeId });
        
        if (graphRef.current) {
          await graphRef.current.deleteNode(nodeId);
        }
        
        onNodeSelect(null);
        clearUnsavedChanges(nodeId);
        addToast("Node deleted successfully", "success");
        
        logger.info("Node deleted successfully", { nodeId });
      } catch (error) {
        logger.error("Failed to delete node", error as Error, { nodeId });
        addToast("Failed to delete node. Please try again.", "error");
      }
    },
    [graphRef, onNodeSelect, clearUnsavedChanges, addToast, logger]
  );

  // Quick create handler
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
      
      logger.debug("Quick creating node", { type, tempId: quickNode.id });
      handleCreateNode(quickNode);
    },
    [handleCreateNode, logger]
  );

  // Node update handler
  const handleNodeUpdate = useCallback(
    async (updatedNode: Node) => {
      if (!selectedNodeId) return;

      try {
        logger.info("Updating node", { nodeId: selectedNodeId, name: updatedNode.data.name });
        
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

        clearUnsavedChanges(selectedNodeId);
        addToast("Node updated successfully", "success");
        
        logger.info("Node updated successfully", { nodeId: selectedNodeId });
      } catch (error) {
        logger.error("Failed to update node", error as Error, { 
          nodeId: selectedNodeId, 
          updates: updatedNode 
        });
        addToast("Failed to update node. Please try again.", "error");
      }
    },
    [selectedNodeId, graphRef, clearUnsavedChanges, addToast, logger]
  );

  // Node change handler (for tracking unsaved changes)
  const handleNodeChange = useCallback(
    (nodeId: string, changes: Partial<Node>) => {
      logger.debug("Node changed", { nodeId, changes });
      onUnsavedChangesUpdate(nodeId, changes);
    },
    [onUnsavedChangesUpdate, logger]
  );

  return {
    effectiveNodes,
    selectedNode,
    handleNodeSelect,
    handleEdgesUpdate,
    handleNodesUpdate,
    handleCreateNode,
    handleDeleteNode,
    handleQuickCreate,
    handleNodeUpdate,
    handleNodeChange,
  };
};