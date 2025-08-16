import React from "react";
import { NodeFormProps } from "@/types";
import { FactionNodeData } from "@/types/nodeTypes";

const FactionForm: React.FC<NodeFormProps> = ({ data, setData }) => {
  const factionData = data as FactionNodeData;

  return (
    <div className="flex flex-col space-y-4">
      <label className="block mb-1 text-sm font-medium text-gray-300">
        Leader
      </label>
      <input
        type="text"
        value={factionData.leaderId ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            motto: e.target.value,
          }))
        }
        className=" w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
      />

      <label className="block mt-4 mb-1 text-sm font-medium text-gray-300">
        Goals
      </label>
      <textarea
        value={factionData.goals ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            goals: e.target.value,
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
    </div>
  );
};

export default FactionForm;
