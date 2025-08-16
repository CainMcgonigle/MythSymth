import React from "react";
import { NodeFormProps } from "@/types";
import { CityNodeData } from "@/types/nodeTypes";

const CityForm: React.FC<NodeFormProps> = ({ data, setData }) => {
  const cityData = data as CityNodeData;

  return (
    <div className="flex flex-col space-y-4">
      <label className="block mb-1 text-sm font-medium text-gray-300">
        Population
      </label>
      <input
        type="text"
        value={cityData.population ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            population: e.target.value,
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block mb-1 text-sm font-medium text-gray-300">
        Region
      </label>
      <input
        type="text"
        value={cityData.region ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            region: e.target.value,
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <label className="block mb-1 text-sm font-medium text-gray-300">
        Notable Locations
      </label>
      <textarea
        value={cityData.notableLocations ?? ""}
        onChange={(e) =>
          setData((prev) => ({
            ...prev,
            notableLocations: e.target.value,
          }))
        }
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={3}
      />
    </div>
  );
};

export default CityForm;
