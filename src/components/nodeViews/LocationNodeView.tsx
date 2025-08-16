import React from "react";
import { MapPin, Navigation, Cloud, Mountain, Star, Info } from "lucide-react";
import { LocationNodeData } from "@/types/nodeTypes";

interface LocationNodeViewProps {
  data: LocationNodeData;
  onEdit?: () => void;
}

const LocationNodeView: React.FC<LocationNodeViewProps> = ({
  data,
  onEdit,
}) => {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6 max-w-full">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-full">
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.name}</h2>
            <span className="text-sm text-gray-400 capitalize">Location</span>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {}
      <div className="space-y-4">
        {}
        {data.coordinates && (
          <div className="flex items-start space-x-3">
            <Navigation className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Coordinates</h3>
              <p className="text-gray-100 font-mono text-sm">
                {data.coordinates}
              </p>
            </div>
          </div>
        )}

        {}
        {data.climate && (
          <div className="flex items-start space-x-3">
            <Cloud className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Climate</h3>
              <p className="text-gray-100">{data.climate}</p>
            </div>
          </div>
        )}

        {}
        {data.terrain && (
          <div className="flex items-start space-x-3">
            <Mountain className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Terrain</h3>
              <p className="text-gray-100">{data.terrain}</p>
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
        {data.notableFeatures && data.notableFeatures.length > 0 && (
          <div className="flex items-start space-x-3">
            <Star className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">
                Notable Features
              </h3>
              <ul className="text-gray-100 text-sm space-y-1">
                {data.notableFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
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

export default LocationNodeView;
