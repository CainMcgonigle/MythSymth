import React, { useMemo, useCallback } from "react";
import { Node, NodeType } from "@/types";
import { NodeSkeleton } from "@/components/ui/LoadingSkeleton";
import VirtualizedList from "@/components/ui/VirtualizedList";

interface SidebarItemProps {
  node: Node;
  isSelected: boolean;
  onSelect: (node: Node) => void;
}

const SidebarItem = React.memo<SidebarItemProps>(({ node, isSelected, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(node);
  }, [node, onSelect]);

  const nodeTypeColors = {
    character: 'bg-blue-600',
    faction: 'bg-red-600',
    city: 'bg-yellow-600',
    event: 'bg-emerald-600',
    location: 'bg-purple-600',
  };

  return (
    <div
      onClick={handleClick}
      className={`
        p-3 rounded-lg cursor-pointer transition-all duration-200 group
        ${isSelected
          ? 'bg-blue-600/20 border border-blue-500'
          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600'
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          w-3 h-3 rounded-full mt-1 flex-shrink-0
          ${nodeTypeColors[node.data.type] || 'bg-gray-500'}
        `} />
        <div className="flex-1 min-w-0">
          <h3 className={`
            font-medium text-sm truncate
            ${isSelected ? 'text-blue-300' : 'text-gray-200 group-hover:text-white'}
          `}>
            {node.data.name}
          </h3>
          <p className={`
            text-xs mt-1 truncate
            ${isSelected ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}
          `}>
            {node.data.type} • {node.data.description || 'No description'}
          </p>
        </div>
      </div>
    </div>
  );
});

SidebarItem.displayName = 'SidebarItem';

interface FilterButtonProps {
  filter: NodeType | "all";
  currentFilter: NodeType | "all";
  onFilterChange: (filter: NodeType | "all") => void;
  count: number;
}

const FilterButton = React.memo<FilterButtonProps>(({ 
  filter, 
  currentFilter, 
  onFilterChange, 
  count 
}) => {
  const handleClick = useCallback(() => {
    onFilterChange(filter);
  }, [filter, onFilterChange]);

  const isActive = currentFilter === filter;
  
  return (
    <button
      onClick={handleClick}
      className={`
        px-3 py-1.5 rounded-md text-xs font-medium transition-colors
        ${isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
        }
      `}
    >
      {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)} ({count})
    </button>
  );
});

FilterButton.displayName = 'FilterButton';

interface SidebarProps {
  nodes: Node[];
  filteredNodes: Node[];
  filter: NodeType | "all";
  onFilterChange: (filter: NodeType | "all") => void;
  onNodeSelect: (node: Node | null) => void;
  selectedNode: Node | null;
  isOpen: boolean;
  isLoading?: boolean;
}

const Sidebar = React.memo<SidebarProps>(({
  nodes,
  filteredNodes,
  filter,
  onFilterChange,
  onNodeSelect,
  selectedNode,
  isOpen,
  isLoading = false,
}) => {
  const nodeTypeCounts = useMemo(() => {
    const counts = nodes.reduce((acc, node) => {
      acc[node.data.type] = (acc[node.data.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    return {
      all: nodes.length,
      ...counts,
    };
  }, [nodes]);

  const filters = useMemo(() => [
    'all' as const,
    'character' as const,
    'faction' as const,
    'city' as const,
    'event' as const,
    'location' as const,
  ], []);

  const renderItem = useCallback(({ index, style, data }: { 
    index: number; 
    style: React.CSSProperties; 
    data: Node[] 
  }) => {
    const node = data[index];
    return (
      <div style={style} className="px-4 py-1">
        <SidebarItem
          node={node}
          isSelected={selectedNode?.id === node.id}
          onSelect={onNodeSelect}
        />
      </div>
    );
  }, [selectedNode, onNodeSelect]);

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">World Elements</h2>
        
        <div className="flex flex-wrap gap-2">
          {filters.map((filterType) => (
            <FilterButton
              key={filterType}
              filter={filterType}
              currentFilter={filter}
              onFilterChange={onFilterChange}
              count={nodeTypeCounts[filterType] || 0}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="mb-3">
                <NodeSkeleton />
              </div>
            ))}
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
            <div className="text-center">
              <p className="text-sm">No {filter === 'all' ? 'nodes' : filter} found</p>
              <p className="text-xs mt-1">Create your first world element</p>
            </div>
          </div>
        ) : filteredNodes.length > 50 ? (
          <VirtualizedList
            items={filteredNodes}
            height={600}
            itemHeight={80}
            renderItem={renderItem}
            className="p-2"
          />
        ) : (
          <div className="p-4 space-y-3 overflow-y-auto">
            {filteredNodes.map((node) => (
              <SidebarItem
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                onSelect={onNodeSelect}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          {filteredNodes.length} of {nodes.length} elements shown
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;