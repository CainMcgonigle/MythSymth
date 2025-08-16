import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Network,
  Eye,
  EyeOff,
  Handshake,
  Sword,
  Shield,
  Zap,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Settings,
} from "lucide-react";

// Type definitions
export interface EdgeData {
  label?: string;
  type: ConnectionType;
  strength: ConnectionStrength;
  description?: string;
  bidirectional?: boolean;
  animated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ConnectionType =
  | "friendship"
  | "rivalry"
  | "alliance"
  | "conflict"
  | "location"
  | "event"
  | "family"
  | "trade"
  | "custom";

export type ConnectionStrength = "weak" | "moderate" | "strong";

export interface ConnectionTypeConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  defaultStrength: ConnectionStrength;
  allowedSourceTypes?: string[];
  allowedTargetTypes?: string[];
}

// Helper function to create icon elements
const createIcon = (IconComponent: React.ComponentType<any>) =>
  React.createElement(IconComponent, { className: "w-5 h-5" });

// Connection type configurations
export const CONNECTION_TYPE_CONFIGS: Record<
  ConnectionType,
  ConnectionTypeConfig
> = {
  friendship: {
    label: "Friendship",
    icon: createIcon(Handshake),
    color: "#10b981",
    description: "Characters who are friends or allies",
    defaultStrength: "moderate",
    allowedSourceTypes: ["character"],
    allowedTargetTypes: ["character"],
  },
  rivalry: {
    label: "Rivalry",
    icon: createIcon(Sword),
    color: "#ef4444",
    description: "Characters or factions in opposition",
    defaultStrength: "moderate",
    allowedSourceTypes: ["character", "faction"],
    allowedTargetTypes: ["character", "faction"],
  },
  alliance: {
    label: "Alliance",
    icon: createIcon(Shield),
    color: "#3b82f6",
    description: "Formal partnerships or alliances",
    defaultStrength: "strong",
    allowedSourceTypes: ["character", "faction", "city"],
    allowedTargetTypes: ["character", "faction", "city"],
  },
  conflict: {
    label: "Conflict",
    icon: createIcon(Zap),
    color: "#f59e0b",
    description: "Active conflicts or tensions",
    defaultStrength: "strong",
    allowedSourceTypes: ["character", "faction", "city"],
    allowedTargetTypes: ["character", "faction", "city"],
  },
  location: {
    label: "Location",
    icon: createIcon(MapPin),
    color: "#8b5cf6",
    description: "Connections to places or regions",
    defaultStrength: "moderate",
    allowedSourceTypes: ["character", "faction", "event"],
    allowedTargetTypes: ["city", "location"],
  },
  event: {
    label: "Event",
    icon: createIcon(Calendar),
    color: "#06b6d4",
    description: "Participation in or relation to events",
    defaultStrength: "moderate",
    allowedSourceTypes: ["character", "faction", "city", "location"],
    allowedTargetTypes: ["event"],
  },
  family: {
    label: "Family",
    icon: createIcon(Users),
    color: "#ec4899",
    description: "Blood relations or adopted family",
    defaultStrength: "strong",
    allowedSourceTypes: ["character"],
    allowedTargetTypes: ["character"],
  },
  trade: {
    label: "Trade",
    icon: createIcon(CreditCard),
    color: "#84cc16",
    description: "Commercial or economic relationships",
    defaultStrength: "moderate",
    allowedSourceTypes: ["character", "faction", "city"],
    allowedTargetTypes: ["character", "faction", "city"],
  },
  custom: {
    label: "Custom",
    icon: createIcon(Settings),
    color: "#6b7280",
    description: "Custom relationship type",
    defaultStrength: "moderate",
  },
};
