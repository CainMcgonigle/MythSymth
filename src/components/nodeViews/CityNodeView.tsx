import React from "react";
import { Building, Users, MapPin, Navigation, Info } from "lucide-react";
import { CityNodeData } from "@/types/nodeTypes";

interface CityNodeViewProps {
  data: CityNodeData;
  onEdit?: () => void;
}

const CityNodeView: React.FC<CityNodeViewProps> = ({ data, onEdit }) => {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6 max-w-full">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <Building className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.name}</h2>
            <span className="text-sm text-gray-400 capitalize">City</span>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {}
      <div className="space-y-4">
        {}
        {data.population !== undefined && (
          <div className="flex items-start space-x-3">
            <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Population</h3>
              <p className="text-gray-100">
                {data.population.toLocaleString()} inhabitants
              </p>
            </div>
          </div>
        )}

        {}
        {data.region && (
          <div className="flex items-start space-x-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Region</h3>
              <p className="text-gray-100">{data.region}</p>
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
        {data.notableLocations && data.notableLocations.length > 0 && (
          <div className="flex items-start space-x-3">
            <Navigation className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">
                Notable Locations
              </h3>
              <ul className="text-gray-100 text-sm space-y-1">
                {data.notableLocations.map((location, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>{location}</span>
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

export default CityNodeView;
