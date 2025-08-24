import { useState, useCallback, useRef } from 'react';
import { Node, CreateNodeRequest, UpdateNodeRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/Toast';
import { createContextLogger } from '@/services/loggerService';

interface OptimisticOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  nodeId: string;
  timestamp: number;
  originalData?: Node;
  rollback: () => void;
}

export const useOptimisticUpdates = () => {
  const [pendingOperations, setPendingOperations] = useState<Map<string, OptimisticOperation>>(new Map());
  const operationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const { addToast } = useToast();
  const logger = createContextLogger('OptimisticUpdates');

  // Auto-cleanup pending operations after timeout
  const cleanupOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });

    const timeout = operationTimeouts.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      operationTimeouts.current.delete(operationId);
    }
  }, []);

  // Add optimistic operation with auto-cleanup
  const addOptimisticOperation = useCallback((operation: Omit<OptimisticOperation, 'id' | 'timestamp'>) => {
    const operationId = uuidv4();
    const fullOperation: OptimisticOperation = {
      ...operation,
      id: operationId,
      timestamp: Date.now(),
    };

    setPendingOperations(prev => new Map(prev).set(operationId, fullOperation));

    // Auto cleanup after 30 seconds
    const timeout = setTimeout(() => {
      logger.warn(`Optimistic operation timed out: ${operation.type} on ${operation.nodeId}`);
      cleanupOperation(operationId);
    }, 30000);

    operationTimeouts.current.set(operationId, timeout);
    return operationId;
  }, [cleanupOperation, logger]);

  // Create node optimistically
  const optimisticCreateNode = useCallback((
    nodeData: CreateNodeRequest,
    nodes: Node[],
    setNodes: (nodes: Node[]) => void,
    actualCreate: (nodeData: CreateNodeRequest) => Promise<Node>
  ) => {
    const tempId = nodeData.id || `temp_${uuidv4()}`;
    const optimisticNode: Node = {
      id: tempId,
      position: nodeData.position || { x: 0, y: 0 },
      data: {
        id: tempId,
        type: nodeData.type,
        name: nodeData.name,
        description: nodeData.description || '',
        connectionDirection: nodeData.connectionDirection || 'all',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to nodes
    const newNodes = [...nodes, optimisticNode];
    setNodes(newNodes);

    logger.debug('Optimistic node creation', { nodeId: tempId, type: nodeData.type });

    const operationId = addOptimisticOperation({
      type: 'create',
      nodeId: tempId,
      rollback: () => {
        setNodes(nodes); // Revert to original state
        addToast('Failed to create node', 'error');
      },
    });

    // Perform actual create
    actualCreate(nodeData)
      .then((createdNode) => {
        // Replace optimistic node with real node
        setNodes(prevNodes => 
          prevNodes.map(n => n.id === tempId ? createdNode : n)
        );
        logger.info('Node created successfully', { nodeId: createdNode.id });
        cleanupOperation(operationId);
      })
      .catch((error) => {
        logger.error('Failed to create node', error);
        // Rollback optimistic change
        setNodes(nodes);
        addToast('Failed to create node', 'error');
        cleanupOperation(operationId);
      });

    return tempId;
  }, [addOptimisticOperation, cleanupOperation, addToast, logger]);

  // Update node optimistically
  const optimisticUpdateNode = useCallback((
    nodeId: string,
    updates: UpdateNodeRequest,
    nodes: Node[],
    setNodes: (nodes: Node[]) => void,
    actualUpdate: (nodeId: string, updates: UpdateNodeRequest) => Promise<Node>
  ) => {
    const originalNode = nodes.find(n => n.id === nodeId);
    if (!originalNode) return;

    // Create optimistic updated node
    const updatedNode: Node = {
      ...originalNode,
      ...updates,
      data: {
        ...originalNode.data,
        ...updates,
      },
      updatedAt: new Date().toISOString(),
    };

    // Optimistically update nodes
    const newNodes = nodes.map(n => n.id === nodeId ? updatedNode : n);
    setNodes(newNodes);

    logger.debug('Optimistic node update', { nodeId, updates });

    const operationId = addOptimisticOperation({
      type: 'update',
      nodeId,
      originalData: originalNode,
      rollback: () => {
        setNodes(nodes); // Revert to original state
        addToast('Failed to update node', 'error');
      },
    });

    // Perform actual update
    actualUpdate(nodeId, updates)
      .then((serverNode) => {
        // Replace optimistic node with server response
        setNodes(prevNodes => 
          prevNodes.map(n => n.id === nodeId ? serverNode : n)
        );
        logger.info('Node updated successfully', { nodeId });
        cleanupOperation(operationId);
      })
      .catch((error) => {
        logger.error('Failed to update node', error);
        // Rollback optimistic change
        setNodes(nodes);
        addToast('Failed to update node', 'error');
        cleanupOperation(operationId);
      });
  }, [addOptimisticOperation, cleanupOperation, addToast, logger]);

  // Delete node optimistically
  const optimisticDeleteNode = useCallback((
    nodeId: string,
    nodes: Node[],
    setNodes: (nodes: Node[]) => void,
    actualDelete: (nodeId: string) => Promise<void>
  ) => {
    const originalNode = nodes.find(n => n.id === nodeId);
    if (!originalNode) return;

    // Optimistically remove node
    const newNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(newNodes);

    logger.debug('Optimistic node deletion', { nodeId });

    const operationId = addOptimisticOperation({
      type: 'delete',
      nodeId,
      originalData: originalNode,
      rollback: () => {
        setNodes(nodes); // Revert to original state
        addToast('Failed to delete node', 'error');
      },
    });

    // Perform actual delete
    actualDelete(nodeId)
      .then(() => {
        logger.info('Node deleted successfully', { nodeId });
        cleanupOperation(operationId);
      })
      .catch((error) => {
        logger.error('Failed to delete node', error);
        // Rollback optimistic change
        setNodes(nodes);
        addToast('Failed to delete node', 'error');
        cleanupOperation(operationId);
      });
  }, [addOptimisticOperation, cleanupOperation, addToast, logger]);

  // Check if a node is pending an operation
  const isNodePending = useCallback((nodeId: string, operationType?: 'create' | 'update' | 'delete') => {
    for (const [, operation] of pendingOperations) {
      if (operation.nodeId === nodeId) {
        return operationType ? operation.type === operationType : true;
      }
    }
    return false;
  }, [pendingOperations]);

  // Get pending operations count
  const getPendingOperationsCount = useCallback(() => {
    return pendingOperations.size;
  }, [pendingOperations]);

  // Force rollback all pending operations
  const rollbackAllOperations = useCallback(() => {
    logger.info('Rolling back all pending operations', { count: pendingOperations.size });
    
    for (const [operationId, operation] of pendingOperations) {
      operation.rollback();
      cleanupOperation(operationId);
    }
  }, [pendingOperations, cleanupOperation, logger]);

  return {
    optimisticCreateNode,
    optimisticUpdateNode,
    optimisticDeleteNode,
    isNodePending,
    getPendingOperationsCount,
    rollbackAllOperations,
    pendingOperationsCount: pendingOperations.size,
  };
};