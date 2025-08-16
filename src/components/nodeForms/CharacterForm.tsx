import React from "react";
import { NodeFormProps } from "@/types";
import { CharacterNodeData } from "@/types/nodeTypes";

const CharacterForm: React.FC<NodeFormProps> = ({ data, setData }) => {
  const characterData = data as CharacterNodeData;

  return (
    <div className="flex flex-col space-y-4">
      <label className="block mb-1 text-sm font-medium text-gray-300">
        Age
      </label>
      <input
        type="number"
        value={characterData.age ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            age: parseInt(e.target.value, 10),
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block mt-4 mb-1 text-sm font-medium text-gray-300">
        Backstory
      </label>
      <textarea
        value={characterData.backstory ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            backstory: e.target.value,
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
    </div>
  );
};

export default CharacterForm;
