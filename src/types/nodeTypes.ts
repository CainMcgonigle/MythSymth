import { NodeType } from ".";

interface BaseNodeData {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  connectionDirection?: "all" | "vertical" | "horizontal";
}

export interface CharacterNodeData extends BaseNodeData {
  type: "character";
  age?: number;
  backstory?: string;
}

export interface FactionNodeData extends BaseNodeData {
  type: "faction";
  description?: string;
  leaderId?: string;
  goals?: string;
}

export interface CityNodeData extends BaseNodeData {
  type: "city";
  population?: string;
  notableLocations?: string[];
  region?: string;
}

export interface EventNodeData extends BaseNodeData {
  type: "event";
  date?: string;
  location?: string;
  impact?: string;
}

export interface LocationNodeData extends BaseNodeData {
  type: "location";
  coordinates?: string;
  notableFeatures?: string[];
  climate?: string;
  terrain?: string;
}
