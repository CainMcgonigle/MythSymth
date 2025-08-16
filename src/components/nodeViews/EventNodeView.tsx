import React from "react";
import { Calendar, MapPin, Zap, Info } from "lucide-react";
import { EventNodeData } from "@/types/nodeTypes";

interface EventNodeViewProps {
  data: EventNodeData;
  onEdit?: () => void;
}

const EventNodeView: React.FC<EventNodeViewProps> = ({ data, onEdit }) => {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6 max-w-full">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 rounded-full">
            <Calendar className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.name}</h2>
            <span className="text-sm text-gray-400 capitalize">Event</span>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {}
      <div className="space-y-4">
        {}
        {data.date && (
          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Date</h3>
              <p className="text-gray-100">{data.date}</p>
            </div>
          </div>
        )}

        {}
        {data.location && (
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Location</h3>
              <p className="text-gray-100">{data.location}</p>
            </div>
          </div>
        )}

        {}
        {data.description && (
          <div className="flex items-start space-x-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Description</h3>
              <p className="text-gray-100 text-sm leading-relaxed">
                {data.description}
              </p>
            </div>
          </div>
        )}

        {}
        {data.impact && (
          <div className="flex items-start space-x-3">
            <Zap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Impact</h3>
              <p className="text-gray-100 text-sm leading-relaxed">
                {data.impact}
              </p>
            </div>
          </div>
        )}

        {}
        <div className="pt-2 border-t border-gray-600">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Connection Type:</span>
            <span className="capitalize">
              {data.connectionDirection || "all"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventNodeView;
