
import { Node } from "@/types";

export function flattenNodeData(node: Node): Node {
  if (
    node &&
    node.data &&
    (node.data as any).properties &&
    typeof (node.data as any).properties === "object"
  ) {
    const { properties, ...restData } = node.data as any;
    return {
      ...node,
      data: {
        ...restData,
        ...properties,
      },
    };
  }
  return node;
}

export function flattenNodes(nodes: Node[]): Node[] {
  return nodes.map(flattenNodeData);
}
