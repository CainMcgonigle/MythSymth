import { LocationNodeData } from "@/types/nodeTypes";

export const defaultLocationData = (): Partial<LocationNodeData> => ({
  type: "location",
  name: "",
  description: "",
  climate: "",
  terrain: "",
  connectionDirection: "all",
  coordinates: "",
  notableFeatures: [],
});
