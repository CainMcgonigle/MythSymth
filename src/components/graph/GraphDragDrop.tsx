import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { CreateNodeRequest, NodeType } from '@/types';

interface GraphDragDropProps {
  dragNodeType: NodeType | null;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  addNode: (nodeData: CreateNodeRequest) => Promise<any>;
  onDragEnd?: () => void;
}

export const useGraphDragDrop = ({
  dragNodeType,
  reactFlowWrapper,
  addNode,
  onDragEnd,
}: GraphDragDropProps) => {
  const reactFlowInstance = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!dragNodeType || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeData: CreateNodeRequest = {
        id: `temp_${uuidv4()}`,
        name: `New ${dragNodeType}`,
        type: dragNodeType,
        description: '',
        position,
        connectionDirection: 'all',
      };

      addNode(newNodeData);
      if (onDragEnd) onDragEnd();
    },
    [dragNodeType, addNode, onDragEnd, reactFlowInstance]
  );

  return { onDragOver, onDrop };
};