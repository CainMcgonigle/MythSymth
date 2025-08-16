// utils/importExportUtils.ts
import { Edge } from "reactflow";
import { Node as BackendNode } from "@/types";
import { ImportRequest } from "@/types/import";

export interface ExportData {
  version: string;
  exportDate: string;
  metadata: {
    nodeCount: number;
    edgeCount: number;
    appVersion?: string;
  };
  nodes: BackendNode[];
  edges: Edge[];
}

export interface ImportResult {
  success: boolean;
  data?: ExportData;
  error?: string;
  warnings?: string[];
}

/**
 * Exports graph data in different formats
 */
export const exportToFormat = (
  nodes: BackendNode[],
  edges: Edge[],
  format: "json" | "csv" | "graphml",
  filename?: string
): void => {
  switch (format) {
    case "json":
      exportGraphData(nodes, edges, filename);
      break;
    case "csv":
      exportToCSV(nodes, edges, filename);
      break;
    case "graphml":
      exportToGraphML(nodes, edges, filename);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Exports the current graph data to a JSON file
 **/
export const exportGraphData = (
  nodes: BackendNode[],
  edges: Edge[],
  filename?: string
): void => {
  const exportData: ExportData = {
    version: "1.0",
    exportDate: new Date().toISOString(),
    metadata: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      appVersion: "1.0.0",
    },
    nodes,
    edges,
  };
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download =
    filename || `graph-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Exports to CSV format (nodes and edges as separate files)
 */
const exportToCSV = (
  nodes: BackendNode[],
  edges: Edge[],
  filename?: string
): void => {
  const baseName =
    filename?.replace(/\.[^/.]+$/, "") ||
    `graph-export-${new Date().toISOString().split("T")[0]}`;

  // Export nodes CSV
  const nodeHeaders = [
    "id",
    "name",
    "type",
    "description",
    "x",
    "y",
    "connectionDirection",
    "createdAt",
    "updatedAt",
  ];

  const nodeRows = nodes.map((node) => [
    node.id,
    `"${(node.data.name || "").replace(/"/g, '""')}"`,
    node.data.type || "",
    `"${(node.data.description || "").replace(/"/g, '""')}"`,
    node.position.x,
    node.position.y,
    node.data.connectionDirection || "",
    node.createdAt || "",
    node.updatedAt || "",
  ]);

  const nodeCSV = [
    nodeHeaders.join(","),
    ...nodeRows.map((row) => row.join(",")),
  ].join("\n");

  downloadFile(nodeCSV, `${baseName}-nodes.csv`, "text/csv");

  // Export edges CSV
  const edgeHeaders = [
    "id",
    "source",
    "target",
    "sourceHandle",
    "targetHandle",
    "type",
    "animated",
  ];

  const edgeRows = edges.map((edge) => [
    edge.id,
    edge.source,
    edge.target,
    edge.sourceHandle || "",
    edge.targetHandle || "",
    edge.data?.type || "",
    edge.animated || false,
  ]);

  const edgeCSV = [
    edgeHeaders.join(","),
    ...edgeRows.map((row) => row.join(",")),
  ].join("\n");

  downloadFile(edgeCSV, `${baseName}-edges.csv`, "text/csv");
};

/**
 * Exports to GraphML format (XML-based graph format)
 */
const exportToGraphML = (
  nodes: BackendNode[],
  edges: Edge[],
  filename?: string
): void => {
  const graphML = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
         http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="name" for="node" attr.name="name" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="description" for="node" attr.name="description" attr.type="string"/>
  <key id="x" for="node" attr.name="x" attr.type="double"/>
  <key id="y" for="node" attr.name="y" attr.type="double"/>
  
  <key id="relationship" for="edge" attr.name="relationship" attr.type="string"/>
  <key id="edgeType" for="edge" attr.name="type" attr.type="string"/>
  <graph id="G" edgedefault="directed">
${nodes
  .map(
    (node) => `    <node id="${node.id}">
      <data key="name">${escapeXML(node.data.name || "")}</data>
      <data key="type">${escapeXML(node.data.type || "")}</data>
      <data key="description">${escapeXML(node.data.description || "")}</data>
      <data key="x">${node.position.x}</data>
      <data key="y">${node.position.y}</data>
    </node>`
  )
  .join("\n")}
${edges
  .map(
    (
      edge
    ) => `    <edge id="${edge.id}" source="${edge.source}" target="${edge.target}">
      <data key="relationship">${escapeXML(edge.data?.relationship || "")}</data>
      <data key="edgeType">${escapeXML(edge.data?.type || "")}</data>
    </edge>`
  )
  .join("\n")}
  </graph>
</graphml>`;

  const fileName =
    filename ||
    `graph-export-${new Date().toISOString().split("T")[0]}.graphml`;
  downloadFile(graphML, fileName, "application/xml");
};

/**
 * Helper function to escape XML special characters
 */
const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/**
 * Helper function to download file
 */
const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
): void => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Validates imported data structure
 */
const validateImportData = (data: any): ImportResult => {
  const warnings: string[] = [];
  if (!data || typeof data !== "object") {
    return {
      success: false,
      error: "Invalid file format: not a valid JSON object",
    };
  }
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return {
      success: false,
      error: "Invalid file format: missing or invalid 'nodes' array",
    };
  }
  if (!data.edges || !Array.isArray(data.edges)) {
    return {
      success: false,
      error: "Invalid file format: missing or invalid 'edges' array",
    };
  }
  // Validate node structure
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i];
    if (!node.id || typeof node.id !== "string") {
      return {
        success: false,
        error: `Invalid node at index ${i}: missing or invalid 'id'`,
      };
    }
    if (!node.data || typeof node.data !== "object") {
      return {
        success: false,
        error: `Invalid node at index ${i}: missing or invalid 'data'`,
      };
    }
    if (!node.data.name || typeof node.data.name !== "string") {
      warnings.push(`Node ${node.id} missing or invalid name`);
    }
    if (!node.data.type || typeof node.data.type !== "string") {
      warnings.push(`Node ${node.id} missing or invalid type`);
    }
    if (
      !node.position ||
      typeof node.position.x !== "number" ||
      typeof node.position.y !== "number"
    ) {
      warnings.push(
        `Node ${node.id} missing or invalid position, will use default`
      );
      node.position = { x: 0, y: 0 };
    }
  }
  // Validate edge structure
  for (let i = 0; i < data.edges.length; i++) {
    const edge = data.edges[i];
    if (!edge.id || typeof edge.id !== "string") {
      return {
        success: false,
        error: `Invalid edge at index ${i}: missing or invalid 'id'`,
      };
    }
    if (!edge.source || typeof edge.source !== "string") {
      return {
        success: false,
        error: `Invalid edge at index ${i}: missing or invalid 'source'`,
      };
    }
    if (!edge.target || typeof edge.target !== "string") {
      return {
        success: false,
        error: `Invalid edge at index ${i}: missing or invalid 'target'`,
      };
    }
    // Check if source and target nodes exist
    const sourceExists = data.nodes.some(
      (node: any) => node.id === edge.source
    );
    const targetExists = data.nodes.some(
      (node: any) => node.id === edge.target
    );
    if (!sourceExists) {
      warnings.push(
        `Edge ${edge.id} references non-existent source node ${edge.source}`
      );
    }
    if (!targetExists) {
      warnings.push(
        `Edge ${edge.id} references non-existent target node ${edge.target}`
      );
    }
  }
  return { success: true, data, warnings };
};

/**
 * Imports graph data from a JSON file
 */
export const importGraphData = (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, error: "No file provided" });
      return;
    }
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      resolve({
        success: false,
        error: "Invalid file type. Please select a JSON file.",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      resolve({
        success: false,
        error: "File too large. Maximum size is 10MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        const validation = validateImportData(data);
        resolve(validation);
      } catch (error) {
        resolve({
          success: false,
          error: `Failed to parse JSON file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read file" });
    };
    reader.readAsText(file);
  });
};

/**
 * Prepares import data for backend consumption
 */
export const prepareImportData = (
  rawData: ExportData,
  strategy: "replace" | "merge"
): ImportRequest => {
  return {
    strategy,
    data: {
      version: rawData.version || "1.0",
      exportDate: rawData.exportDate || new Date().toISOString(),
      metadata: {
        nodeCount: rawData.nodes?.length || 0,
        edgeCount: rawData.edges?.length || 0,
        appVersion: rawData.metadata?.appVersion,
      },
      nodes: rawData.nodes || [],
      edges: rawData.edges || [],
    },
  };
};
