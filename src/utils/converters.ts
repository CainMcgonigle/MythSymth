import { Node, NodeType, ConnectionDirection } from "../types";

/**
 * A simplified, flattened representation of a Node.
 * This is used for internal operations where a nested data/position object isn't needed.
 */
export interface SimplifiedNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  x: number;
  y: number;
  connectionDirection?: ConnectionDirection;
}

/**
 * Converts a backend Node to a simplified internal Node.
 *
 * @param backendNode The Node as returned from your API.
 * @returns A simplified, flattened Node.
 */
export function fromBackendNode(backendNode: Node): SimplifiedNode {
  return {
    id: backendNode.id,
    name: backendNode.data.name,
    type: backendNode.data.type,
    description: backendNode.data.description ?? "",
    x: backendNode.position.x,
    y: backendNode.position.y,
    connectionDirection: backendNode.data.connectionDirection,
  };
}

/**
 * Converts a simplified internal Node back to the backend Node shape.
 *
 * @param simplifiedNode A simplified, flattened Node.
 * @returns The Node in a format ready to be sent to your API.
 */
export function toBackendNode(simplifiedNode: SimplifiedNode): Node {
  return {
    id: simplifiedNode.id,
    data: {
      id: simplifiedNode.id,
      name: simplifiedNode.name,
      type: simplifiedNode.type,
      description: simplifiedNode.description ?? "",
      connectionDirection: simplifiedNode.connectionDirection,
    },
    position: {
      x: simplifiedNode.x,
      y: simplifiedNode.y,
    },
    
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
