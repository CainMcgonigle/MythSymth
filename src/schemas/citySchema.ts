import { CityNodeData } from "@/types/nodeTypes";

export const defaultCityData = (): Partial<CityNodeData> => ({
  type: "city",
  name: "",
  description: "",
  population: undefined,
  region: "",
  notableLocations: [],
  connectionDirection: "all",
});
