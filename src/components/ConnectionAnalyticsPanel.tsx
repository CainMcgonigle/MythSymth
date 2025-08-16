import React, { useState, useMemo } from "react";
import { BarChart3, TrendingUp, Network, Eye, EyeOff } from "lucide-react";
import { Edge } from "reactflow";
import { analyzeEdges } from "@/utils/edgeUtils";
import {
  ConnectionType,
  ConnectionStrength,
  CONNECTION_TYPE_CONFIGS,
} from "../types/edgeTypes";

interface ConnectionAnalyticsPanelProps {
  edges: Edge[];
  nodes: any[];
  isOpen: boolean;
  onToggle: () => void;
}

// Define type for tab items
type TabItem = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
};

const ConnectionAnalyticsPanel: React.FC<ConnectionAnalyticsPanelProps> = ({
  edges,
  nodes,
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "types" | "matrix">(
    "overview"
  );

  const analytics = useMemo(() => {
    return analyzeEdges(edges, nodes);
  }, [edges, nodes]);

  // Define tabs with proper typing
  const tabs: TabItem[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "types", label: "Types", icon: TrendingUp },
    { id: "matrix", label: "Matrix", icon: Network },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-16 right-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg 
                   hover:bg-gray-700 transition-colors z-1"
        title="Show Connection Analytics"
      >
        <Eye className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className="fixed top-16 right-4 w-80 bg-gray-800 text-white rounded-lg shadow-xl z-50
                    max-h-96 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Network className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold">Connection Analytics</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm
                       transition-colors ${
                         activeTab === tab.id
                           ? "bg-blue-600 text-white"
                           : "text-gray-400 hover:text-white hover:bg-gray-700"
                       }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">
                  {analytics.totalEdges}
                </div>
                <div className="text-xs text-gray-400">Total Connections</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">
                  {analytics.bidirectionalCount}
                </div>
                <div className="text-xs text-gray-400">Bidirectional</div>
              </div>
            </div>

            {/* Connection Strength */}
            <div>
              <h4 className="text-sm font-medium mb-2">Connection Strength</h4>
              <div className="space-y-2">
                {(["weak", "moderate", "strong"] as ConnectionStrength[]).map(
                  (strength) => {
                    const count = analytics.edgesByStrength[strength];
                    const percentage =
                      analytics.totalEdges > 0
                        ? (count / analytics.totalEdges) * 100
                        : 0;
                    const colors = {
                      weak: "bg-yellow-500",
                      moderate: "bg-blue-500",
                      strong: "bg-red-500",
                    };
                    return (
                      <div
                        key={strength}
                        className="flex items-center space-x-2"
                      >
                        <div className="w-16 text-xs capitalize text-gray-300">
                          {strength}
                        </div>
                        <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${colors[strength]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-8 text-xs text-gray-400">{count}</div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Most Connected */}
            <div>
              <h4 className="text-sm font-medium mb-2">Most Connected</h4>
              <div className="space-y-1">
                {analytics.mostConnectedNodes.slice(0, 3).map(
                  (
                    node: {
                      nodeId: React.Key | null | undefined;
                      connectionCount:
                        | string
                        | number
                        | boolean
                        | React.ReactElement<
                            any,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | React.ReactPortal
                        | null
                        | undefined;
                    },
                    index: number
                  ) => {
                    const nodeData = nodes.find((n) => n.id === node.nodeId);
                    return (
                      <div
                        key={node.nodeId}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400">#{index + 1}</span>
                          <span className="text-white truncate">
                            {nodeData?.data.name || node.nodeId}
                          </span>
                        </div>
                        <span className="text-blue-400">
                          {node.connectionCount}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "types" && (
          <div className="space-y-3">
            {(Object.entries(analytics.edgesByType) as [string, number][])
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const config = CONNECTION_TYPE_CONFIGS[type as ConnectionType];
                const percentage =
                  analytics.totalEdges > 0
                    ? (count / analytics.totalEdges) * 100
                    : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{config.icon}</span>
                        <span className="text-sm text-white">
                          {config.label}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">{count}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: config.color,
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% • {config.description}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {activeTab === "matrix" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400 mb-2">
              Connection patterns between node types
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left p-1"></th>
                    {["character", "faction", "city", "event", "location"].map(
                      (type) => (
                        <th
                          key={type}
                          className="text-center p-1 text-gray-400 capitalize"
                        >
                          {type.slice(0, 4)}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {["character", "faction", "city", "event", "location"].map(
                    (sourceType) => (
                      <tr key={sourceType}>
                        <td className="text-gray-400 capitalize p-1 font-medium">
                          {sourceType.slice(0, 4)}
                        </td>
                        {[
                          "character",
                          "faction",
                          "city",
                          "event",
                          "location",
                        ].map((targetType) => {
                          const count =
                            analytics.connectionMatrix[sourceType]?.[
                              targetType
                            ] || 0;
                          const intensity =
                            count > 0 ? Math.min(count / 5, 1) : 0;
                          return (
                            <td key={targetType} className="text-center p-1">
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-xs"
                                style={{
                                  backgroundColor:
                                    count > 0
                                      ? `rgba(59, 130, 246, ${intensity})`
                                      : "transparent",
                                  color: count > 0 ? "white" : "#6b7280",
                                }}
                              >
                                {count || "·"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500">
              Numbers show connection count. Color intensity indicates
              frequency.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionAnalyticsPanel;
