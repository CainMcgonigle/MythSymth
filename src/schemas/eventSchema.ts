import { EventNodeData } from "@/types/nodeTypes";

export const defaultEventData = (): Partial<EventNodeData> => ({
  type: "event",
  name: "",
  description: "",
  date: "",
  impact: "",
  location: "",
  connectionDirection: "all",
});
