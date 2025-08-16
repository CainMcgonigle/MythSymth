import { Edge } from "reactflow";

export function flattenEdgeData(edge: Edge): Edge {
  let result = edge;
  
  if (
    edge &&
    (edge as any).properties &&
    typeof (edge as any).properties === "object"
  ) {
    const { properties, ...rest } = edge as any;
    result = {
      ...rest,
      ...properties,
    };
  }
  
  if (
    result &&
    (result as any).data &&
    typeof (result as any).data === "object"
  ) {
    const { data, ...rest } = result as any;
    return {
      ...rest,
      ...data,
    };
  }
  return result;
}

export function flattenEdges(edges: Edge[]): Edge[] {
  return edges.map(flattenEdgeData);
}
