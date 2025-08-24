import { useState, useCallback } from 'react';
import { Node, CreateNodeRequest, UpdateNodeRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/Toast';
import { createContextLogger } from '@/services/loggerService';

export const useOptimisticUpdates = () => {
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const { addToast } = useToast();
  const logger = createContextLogger('OptimisticUpdates');

  // Simple optimistic create that doesn't capture stale closures
  const optimisticCreateNode = useCallback(async (
    nodeData: CreateNodeRequest,
    setNodes: (updater: (prev: Node[]) => Node[]) => void,
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

    // Optimistically add node
    setNodes(prev => [...prev, optimisticNode]);
    setPendingOperationsCount(prev => prev + 1);

    try {
      const createdNode = await actualCreate(nodeData);
      // Replace optimistic node with real node
      setNodes(prev => prev.map(n => n.id === tempId ? createdNode : n));
      logger.info('Node created successfully', { nodeId: createdNode.id });
    } catch (error) {
      logger.error('Failed to create node', error as Error);
      // Remove optimistic node
      setNodes(prev => prev.filter(n => n.id !== tempId));
      addToast('Failed to create node', 'error');
    } finally {
      setPendingOperationsCount(prev => prev - 1);
    }

    return tempId;
  }, [addToast, logger]);

  // Simple optimistic update
  const optimisticUpdateNode = useCallback(async (
    nodeId: string,
    updates: UpdateNodeRequest,
    setNodes: (updater: (prev: Node[]) => Node[]) => void,
    actualUpdate: (nodeId: string, updates: UpdateNodeRequest) => Promise<Node>
  ) => {
    let originalNode: Node | undefined;
    
    // Capture the original node from current state
    setNodes(prev => {
      originalNode = prev.find(n => n.id === nodeId);
      return prev;
    });
    
    if (!originalNode) return;

    // Optimistically update node
    setNodes(prev => prev.map(n => n.id === nodeId ? {
      ...n,
      ...updates,
      data: { ...n.data, ...updates },
      updatedAt: new Date().toISOString(),
    } : n));
    
    setPendingOperationsCount(prev => prev + 1);

    try {
      const serverNode = await actualUpdate(nodeId, updates);
      // Replace with server response
      setNodes(prev => prev.map(n => n.id === nodeId ? serverNode : n));
      logger.info('Node updated successfully', { nodeId });
    } catch (error) {
      logger.error('Failed to update node', error as Error);
      // Revert to original
      setNodes(prev => prev.map(n => n.id === nodeId ? originalNode : n));
      addToast('Failed to update node', 'error');
    } finally {
      setPendingOperationsCount(prev => prev - 1);
    }
  }, [addToast, logger]);

  // Simple optimistic delete
  const optimisticDeleteNode = useCallback(async (
    nodeId: string,
    setNodes: (updater: (prev: Node[]) => Node[]) => void,
    actualDelete: (nodeId: string) => Promise<void>
  ) => {
    let originalNode: Node | undefined;
    
    // Capture the original node from current state
    setNodes(prev => {
      originalNode = prev.find(n => n.id === nodeId);
      return prev;
    });
    
    if (!originalNode) return;

    // Optimistically remove node
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setPendingOperationsCount(prev => prev + 1);

    try {
      await actualDelete(nodeId);
      logger.info('Node deleted successfully', { nodeId });
    } catch (error) {
      logger.error('Failed to delete node', error as Error);
      // Restore node
      setNodes(prev => [...prev, originalNode]);
      addToast('Failed to delete node', 'error');
    } finally {
      setPendingOperationsCount(prev => prev - 1);
    }
  }, [addToast, logger]);

  return {
    optimisticCreateNode,
    optimisticUpdateNode,
    optimisticDeleteNode,
    pendingOperationsCount,
  };
};