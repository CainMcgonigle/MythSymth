import { CharacterNodeData } from "@/types/nodeTypes";

export const defaultCharacterData = (): Partial<CharacterNodeData> => ({
  type: "character",
  name: "",
  description: "",
  age: undefined,
  backstory: "",
  connectionDirection: "all",
});
