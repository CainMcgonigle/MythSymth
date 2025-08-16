import React from "react";
import { User, Calendar, BookOpen, Info } from "lucide-react";
import { CharacterNodeData } from "@/types/nodeTypes";

interface CharacterNodeViewProps {
  data: CharacterNodeData;
  onEdit?: () => void;
}

const CharacterNodeView: React.FC<CharacterNodeViewProps> = ({
  data,
  onEdit,
}) => {
  return (
    <div className="bg-gray-700 rounded-lg shadow-lg border border-gray-600 p-6 max-w-full">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.name}</h2>
            <span className="text-sm text-gray-400 capitalize">Character</span>
          </div>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {}
      <div className="space-y-4">
        {}
        {data.age !== undefined && (
          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Age</h3>
              <p className="text-gray-100">{data.age} years old</p>
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
        {data.backstory && (
          <div className="flex items-start space-x-3">
            <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-300">Backstory</h3>
              <p className="text-gray-100 text-sm leading-relaxed">
                {data.backstory}
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

export default CharacterNodeView;
