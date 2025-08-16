import { Node, Edge } from "@/types";
import { Node as FlowNode, Edge as FlowEdge } from "reactflow";
import { LOCALSTORAGE_KEYS } from "@/constants/graphConstants";

export const convertToFlowNode = (node: Node): FlowNode => ({
  id: String(node.id),
  position: node.position || { x: 0, y: 0 },
  data: {
    ...node.data,
  },
  type: "mythsmith",
});

export const convertToFlowEdge = (edge: Edge): FlowEdge => {
  
  const { id, source, target, sourceHandle, targetHandle, ...rest } = edge;
  return {
    id: String(id),
    source: String(source),
    target: String(target),
    sourceHandle: sourceHandle || undefined,
    targetHandle: targetHandle || undefined,
    type: "mythsmith",
    data: { ...rest },
  };
};

export const initializeFromLocalStorage = () => {
  const savedNodes = localStorage.getItem(LOCALSTORAGE_KEYS.NODES);
  const savedEdges = localStorage.getItem(LOCALSTORAGE_KEYS.EDGES);
  const savedPendingChanges = localStorage.getItem(
    LOCALSTORAGE_KEYS.PENDING_CHANGES
  );

  return {
    savedNodes: savedNodes ? JSON.parse(savedNodes) : null,
    savedEdges: savedEdges ? JSON.parse(savedEdges) : null,
    savedPendingChanges: savedPendingChanges
      ? JSON.parse(savedPendingChanges)
      : null,
  };
};

export const clearLocalStorage = () => {
  Object.values(LOCALSTORAGE_KEYS).forEach((key) =>
    localStorage.removeItem(key)
  );
};
