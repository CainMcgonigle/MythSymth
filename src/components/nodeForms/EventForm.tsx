import React from "react";
import { NodeFormProps } from "@/types";
import { EventNodeData } from "@/types/nodeTypes";

const EventForm: React.FC<NodeFormProps> = ({ data, setData }) => {
  const eventData = data as EventNodeData;

  return (
    <>
      <div className="flex flex-col space-y-4">
        <label className="block mb-1 text-sm font-medium text-gray-300">
          Date
        </label>
        <input
          type="text"
          value={eventData.date ?? ""}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              date: e.target.value,
            }))
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4">
        <label className="block mb-1 text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          value={eventData.description ?? ""}
          onChange={(e) =>
            setData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
    </>
  );
};

export default EventForm;
