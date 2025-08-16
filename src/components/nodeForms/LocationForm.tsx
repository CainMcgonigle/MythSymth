import React from "react";
import { NodeFormProps } from "@/types";
import { LocationNodeData } from "@/types/nodeTypes";

const LocationForm: React.FC<NodeFormProps> = ({ data, setData }) => {
  const locationData = data as LocationNodeData;

  return (
    <>
      <div className="flex flex-col space-y-4">
        <label className="block mb-1 text-sm font-medium text-gray-300">
          Terrain
        </label>
        <input
          type="text"
          value={locationData.terrain ?? ""}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              terrain: e.target.value,
            }))
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1 text-sm font-medium text-gray-300">
          Climate
        </label>
        <input
          type="text"
          value={locationData.climate ?? ""}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              climate: e.target.value,
            }))
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </>
  );
};

export default LocationForm;
