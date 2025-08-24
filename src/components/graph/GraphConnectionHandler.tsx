import React, { useState, useCallback, useRef } from 'react';
import { Connection, Edge, Node as FlowNode } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import ConnectionModal from '@/components/ConnectionModal';
import { ConnectionValidator } from '@/utils/connectionValidator';
import { MythSmithEdgeData } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface GraphConnectionHandlerProps {
  nodes: FlowNode[];
  edges: Edge[];
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  setPendingChanges: (updater: (prev: any) => any) => void;
  saveStateToHistory: () => void;
}

interface GraphConnectionHandlerReturn {
  isValidConnection: (connection: Connection) => boolean;
  onConnect: (params: Connection) => void;
  ConnectionModal: React.ReactNode;
}

export const useGraphConnectionHandler = ({
  nodes,
  edges,
  setEdges,
  setPendingChanges,
  saveStateToHistory,
}: GraphConnectionHandlerProps): GraphConnectionHandlerReturn => {
  const { addToast } = useToast();
  const [validator, setValidator] = React.useState<ConnectionValidator | null>(null);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [connectionModal, setConnectionModal] = useState({
    isOpen: false,
    sourceNodeName: '',
    targetNodeName: '',
    suggestedType: '',
  });
  const [lastInvalidConnection, setLastInvalidConnection] = useState<Connection | null>(null);
  const lastInvalidRef = useRef<string | null>(null);

  React.useEffect(() => {
    const flowEdges: Connection[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
    }));
    setValidator(new ConnectionValidator(nodes, flowEdges));
  }, [nodes, edges]);

  const isValidConnection = useCallback(
    (connection: Connection): boolean => {
      if (!validator) return true;
      const result = validator.validateConnection(connection);
      if (!result.isValid) {
        const key = `${connection.source}-${connection.target}`;
        if (lastInvalidRef.current !== key) {
          addToast(result.reason || 'Invalid connection', 'error');
          lastInvalidRef.current = key;
        }
        return false;
      }
      lastInvalidRef.current = null;
      return true;
    },
    [validator, addToast]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!validator) return;
      const validation = validator.validateConnection(params);
      
      if (!validation.isValid) {
        if (
          !lastInvalidConnection ||
          lastInvalidConnection.source !== params.source ||
          lastInvalidConnection.target !== params.target
        ) {
          console.warn(validation.reason);
          setLastInvalidConnection(params);
        }
        return;
      }

      setLastInvalidConnection(null);
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;

      setPendingConnection(params);
      setConnectionModal({
        isOpen: true,
        sourceNodeName: sourceNode.data.name,
        targetNodeName: targetNode.data.name,
        suggestedType: validation.suggestedType || 'custom',
      });
    },
    [nodes, validator, lastInvalidConnection]
  );

  const handleCreateConnection = useCallback(
    (connectionData: MythSmithEdgeData) => {
      if (!pendingConnection) return;
      
      const newEdge: Edge = {
        ...pendingConnection,
        id: `edge_${uuidv4()}`,
        type: 'mythsmith',
        data: connectionData,
        animated: connectionData.animated,
        source: pendingConnection.source ?? '',
        target: pendingConnection.target ?? '',
        sourceHandle: pendingConnection.sourceHandle ?? undefined,
        targetHandle: pendingConnection.targetHandle ?? undefined,
      };

      setEdges((eds) => [...eds, newEdge]);
      setPendingChanges((prev) => ({
        ...prev,
        newEdges: [...new Set([...prev.newEdges, newEdge.id])],
      }));
      saveStateToHistory();
      setPendingConnection(null);
      setConnectionModal((prev) => ({ ...prev, isOpen: false }));
      addToast(`${connectionData.type} connection created`, 'success');
    },
    [pendingConnection, setEdges, setPendingChanges, saveStateToHistory, addToast]
  );

  return {
    isValidConnection,
    onConnect,
    ConnectionModal: (
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
    ),
  };
};