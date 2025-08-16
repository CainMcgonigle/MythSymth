import { FactionNodeData } from "@/types/nodeTypes";

export const defaultFactionData = (): Partial<FactionNodeData> => ({
  type: "faction",
  name: "",
  description: "",
  leaderId: "",
  goals: "",
  connectionDirection: "all",
});
