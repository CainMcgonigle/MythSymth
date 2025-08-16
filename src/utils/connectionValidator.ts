import { Connection, Node } from "reactflow";
import { NodeType } from "@/types";

export interface ConnectionRule {
  sourceType: NodeType | "any";
  targetType: NodeType | "any";
  maxConnections?: number;
  bidirectional?: boolean;
  defaultConnectionType: string;
  description: string;
}


export const connectionRules: ConnectionRule[] = [
  
  {
    sourceType: "character",
    targetType: "character",
    maxConnections: 10,
    bidirectional: true,
    defaultConnectionType: "friendship",
    description: "Characters can have relationships with other characters",
  },
  {
    sourceType: "character",
    targetType: "faction",
    maxConnections: 3,
    bidirectional: false,
    defaultConnectionType: "alliance",
    description: "Characters can belong to or ally with factions",
  },
  {
    sourceType: "character",
    targetType: "city",
    maxConnections: 5,
    bidirectional: false,
    defaultConnectionType: "location",
    description: "Characters can reside in or visit cities",
  },
  {
    sourceType: "character",
    targetType: "event",
    maxConnections: 8,
    bidirectional: false,
    defaultConnectionType: "event",
    description: "Characters can participate in events",
  },
  {
    sourceType: "character",
    targetType: "location",
    maxConnections: 5,
    bidirectional: false,
    defaultConnectionType: "location",
    description: "Characters can visit or be associated with locations",
  },
  
  {
    sourceType: "faction",
    targetType: "faction",
    maxConnections: 5,
    bidirectional: true,
    defaultConnectionType: "alliance",
    description: "Factions can have alliances or conflicts with other factions",
  },
  {
    sourceType: "faction",
    targetType: "city",
    maxConnections: 8,
    bidirectional: false,
    defaultConnectionType: "location",
    description: "Factions can control or have influence in cities",
  },
  {
    sourceType: "faction",
    targetType: "event",
    maxConnections: 6,
    bidirectional: false,
    defaultConnectionType: "event",
    description: "Factions can be involved in events",
  },
  
  {
    sourceType: "city",
    targetType: "city",
    maxConnections: 6,
    bidirectional: true,
    defaultConnectionType: "trade",
    description: "Cities can have trade routes or diplomatic relations",
  },
  {
    sourceType: "city",
    targetType: "location",
    maxConnections: 4,
    bidirectional: false,
    defaultConnectionType: "location",
    description: "Cities can be connected to nearby locations",
  },
  
  {
    sourceType: "event",
    targetType: "event",
    maxConnections: 4,
    bidirectional: true,
    defaultConnectionType: "event",
    description: "Events can lead to or cause other events",
  },
  {
    sourceType: "event",
    targetType: "location",
    maxConnections: 3,
    bidirectional: false,
    defaultConnectionType: "location",
    description: "Events can occur at specific locations",
  },
  
  {
    sourceType: "location",
    targetType: "location",
    maxConnections: 5,
    bidirectional: true,
    defaultConnectionType: "location",
    description: "Locations can be geographically connected",
  },
];

export interface ConnectionValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedType?: string;
  maxConnectionsReached?: boolean;
}

export class ConnectionValidator {
  private nodes: Node<{ type: NodeType }>[];
  private connections: Connection[];
  private defaultRule: ConnectionRule;

  constructor(nodes: Node<{ type: NodeType }>[], connections: Connection[]) {
    this.nodes = nodes;
    this.connections = connections;
    
    this.defaultRule = {
      sourceType: "any",
      targetType: "any",
      defaultConnectionType: "custom",
      description: "Custom connection between nodes",
    };
  }

  validateConnection(connection: Connection): ConnectionValidationResult {
    const sourceNode = this.nodes.find((n) => n.id === connection.source);
    const targetNode = this.nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      return {
        isValid: false,
        reason: "Source or target node not found",
      };
    }

    
    if (connection.source === connection.target) {
      return {
        isValid: false,
        reason: "Cannot connect a node to itself",
      };
    }

    
    const rule =
      this.findConnectionRule(sourceNode.data.type, targetNode.data.type) ||
      this.defaultRule;

    
    const isBidirectional = rule?.bidirectional ?? false;
    const existingConnection = this.connections.find((conn) => {
      if (isBidirectional) {
        return (
          (conn.source === connection.source &&
            conn.target === connection.target) ||
          (conn.source === connection.target &&
            conn.target === connection.source)
        );
      }
      return (
        conn.source === connection.source && conn.target === connection.target
      );
    });

    if (existingConnection) {
      return {
        isValid: false,
        reason: "Connection already exists between these nodes",
      };
    }

    
    if (rule.maxConnections) {
      const sourceConnectionsCount = this.connections.filter((conn) => {
        if (isBidirectional) {
          return (
            conn.source === connection.source ||
            conn.target === connection.source
          );
        } else {
          return conn.source === connection.source;
        }
      }).length;

      if (sourceConnectionsCount >= rule.maxConnections) {
        return {
          isValid: false,
          reason: `Maximum connections (${rule.maxConnections}) reached for source node`,
          maxConnectionsReached: true,
        };
      }
    }

    return {
      isValid: true,
      suggestedType: rule.defaultConnectionType,
    };
  }

  private findConnectionRule(
    sourceType: NodeType,
    targetType: NodeType
  ): ConnectionRule | null {
    
    let rule = connectionRules.find(
      (rule) => rule.sourceType === sourceType && rule.targetType === targetType
    );
    if (rule) return rule;

    
    rule = connectionRules.find(
      (rule) =>
        rule.bidirectional &&
        rule.sourceType === targetType &&
        rule.targetType === sourceType
    );
    if (rule) return rule;

    
    rule = connectionRules.find(
      (rule) => rule.sourceType === "any" && rule.targetType === targetType
    );
    if (rule) return rule;

    rule = connectionRules.find(
      (rule) => rule.sourceType === sourceType && rule.targetType === "any"
    );
    return rule || null;
  }

  getConnectionSuggestions(sourceNodeId: string) {
    const sourceNode = this.nodes.find((n) => n.id === sourceNodeId);
    if (!sourceNode) return [];

    const suggestions: Array<{
      targetNodeId: string;
      targetNode: Node<{ type: NodeType }>;
      connectionType: string;
      description: string;
    }> = [];

    for (const targetNode of this.nodes) {
      if (targetNode.id === sourceNodeId) continue;

      const connection: Connection = {
        source: sourceNodeId,
        target: targetNode.id,
        sourceHandle: null,
        targetHandle: null,
      };

      const validation = this.validateConnection(connection);
      if (validation.isValid && validation.suggestedType) {
        const rule =
          this.findConnectionRule(sourceNode.data.type, targetNode.data.type) ||
          this.defaultRule;

        suggestions.push({
          targetNodeId: targetNode.id,
          targetNode,
          connectionType: validation.suggestedType,
          description: rule.description,
        });
      }
    }
    return suggestions;
  }

  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.length,
      connectionsByType: {} as Record<string, number>,
      nodeConnectionCounts: {} as Record<string, number>,
    };

    
    this.connections.forEach((conn) => {
      const connType = (conn as any).data?.type ?? "custom";
      stats.connectionsByType[connType] =
        (stats.connectionsByType[connType] || 0) + 1;
    });

    
    this.connections.forEach((conn) => {
      if (conn.source) {
        stats.nodeConnectionCounts[conn.source] =
          (stats.nodeConnectionCounts[conn.source] || 0) + 1;
      }
      if (conn.target) {
        stats.nodeConnectionCounts[conn.target] =
          (stats.nodeConnectionCounts[conn.target] || 0) + 1;
      }
    });

    return stats;
  }
}
