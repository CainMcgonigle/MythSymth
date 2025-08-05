import React from 'react'
import { Node, NodeType } from '../types'
import {
  User,
  Swords,
  Building,
  CloudLightning,
  MapPin,
  Globe
} from 'lucide-react'

interface SidebarProps {
  nodes: Node[] // All nodes for counting
  filteredNodes?: Node[] // Optional filtered nodes for display
  filter: NodeType | 'all'
  onFilterChange: (filter: NodeType | 'all') => void
  onNodeSelect: (node: Node) => void
  selectedNode: Node | null
  isOpen: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  filteredNodes,
  filter,
  onFilterChange,
  onNodeSelect,
  selectedNode,
  isOpen
}) => {
  
  // Tailwind text color classes for the default (unselected) state
  const iconColors: Record<NodeType | 'all', string> = {
    all: 'text-gray-500',
    character: 'text-blue-500',
    faction: 'text-red-500',
    city: 'text-amber-500',
    event: 'text-emerald-500',
    location: 'text-violet-500'
  }

  // Tailwind text and background classes for the filter buttons
  const filterStyles: Record<NodeType | 'all', { bg: string; text: string }> = {
    all: { bg: 'bg-gray-700', text: 'text-gray-200' },
    character: { bg: 'bg-blue-900', text: 'text-blue-200' },
    faction: { bg: 'bg-red-900', text: 'text-red-200' },
    city: { bg: 'bg-amber-900', text: 'text-amber-200' },
    event: { bg: 'bg-emerald-900', text: 'text-emerald-200' },
    location: { bg: 'bg-violet-900', text: 'text-violet-200' },
  };

  const getNodeIcon = (type: NodeType, className: string = '') => {
    const baseClass = iconColors[type]
    const icons = {
      character: <User size={20} className={`${baseClass} ${className}`} />,
      faction: <Swords size={20} className={`${baseClass} ${className}`} />,
      city: <Building size={20} className={`${baseClass} ${className}`} />,
      event: <CloudLightning size={20} className={`${baseClass} ${className}`} />,
      location: <MapPin size={20} className={`${baseClass} ${className}`} />
    }
    return icons[type] || <Globe size={20} className={`${iconColors.all} ${className}`} />
  }

  const filterOptions: Array<{ key: NodeType | 'all'; label: string; icon: React.ReactNode }> = [
    { key: 'all', label: 'All', icon: <Globe size={16} className={iconColors.all} /> },
    { key: 'character', label: 'Characters', icon: <User size={16} className={iconColors.character} /> },
    { key: 'faction', label: 'Factions', icon: <Swords size={16} className={iconColors.faction} /> },
    { key: 'city', label: 'Cities', icon: <Building size={16} className={iconColors.city} /> },
    { key: 'event', label: 'Events', icon: <CloudLightning size={16} className={iconColors.event} /> },
    { key: 'location', label: 'Locations', icon: <MapPin size={16} className={iconColors.location} /> }
  ]

  // Use filteredNodes if provided, otherwise filter nodes based on current filter
  const displayNodes = filteredNodes || (filter === 'all' 
    ? nodes 
    : nodes.filter(node => node.data.type === filter))

  // Always calculate counts from the full nodes array
  const getNodeCounts = () => {
    const counts = {
      all: nodes.length,
      character: 0,
      faction: 0,
      city: 0,
      event: 0,
      location: 0
    }
    
    nodes.forEach(node => {
      counts[node.data.type as NodeType]++
    })
    
    return counts
  }

  const counts = getNodeCounts()

  return (
    <div className={`
      flex flex-col flex-shrink-0
      bg-neutral-800 text-gray-200
      transition-all duration-300 ease-in-out
      ${isOpen ? 'w-80' : 'w-0 overflow-hidden'}
    `}>
      {/* Opacity transition added to the sidebar header */}
      <div className={`
        sidebar-header px-4 py-3 border-b border-gray-700
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}>
        <h3 className="sidebar-title text-lg font-semibold text-white mb-3 whitespace-nowrap">World Elements</h3>
          <div className="flex flex-wrap overflow-x-hidden gap-2">
          {filterOptions.map(option => (
            <button
              key={option.key}
              onClick={() => onFilterChange(option.key)}
              title={`${option.label} (${counts[option.key]})`}
              className={`
                flex items-center space-x-1.5 
                px-3 py-1.5 rounded-full text-sm font-medium
                transition-colors duration-200
                whitespace-nowrap
                ${filter === option.key
                  ? `${filterStyles[option.key].bg} ${filterStyles[option.key].text}`
                  : 'bg-neutral-900 text-gray-400 hover:text-gray-200 hover:bg-neutral-700'
                }
              `}
            >
              <span className="inline-flex items-center">{option.icon}</span>
              <span>{option.label}</span>
              <span className={`
                text-xs font-semibold rounded-full px-2 py-0.5 
                ${filter === option.key ? 'bg-white bg-opacity-20 text-opacity-10 text-black' : 'bg-neutral-800 text-gray-400'}
                select-none
              `}>
                {counts[option.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-content flex-grow overflow-y-auto px-3 py-2">
        {displayNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 py-16 px-4 select-none">
            <div className="text-4xl mb-3 inline-flex">
              {filter === 'all' ? <Globe size={32} className={iconColors.all} /> : getNodeIcon(filter as NodeType)}
            </div>
            <div className="text-sm font-semibold mb-1 whitespace-nowrap">
              No {filter === 'all' ? 'nodes' : `${filter}s`} yet
            </div>
            <div className="text-xs whitespace-nowrap">
              Create your first {filter === 'all' ? 'world element' : filter} to get started
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {displayNodes.map(node => (
              <div
                key={node.id}
                onClick={() => onNodeSelect(node)}
                className={`
                  cursor-pointer flex items-center space-x-3 p-2 rounded-md group
                  transition-colors duration-150 relative
                  ${selectedNode?.id === node.id 
                    ? 'bg-indigo-800/40 border-l-4 border-indigo-500 pl-[12px]'
                    : 'hover:bg-neutral-600'
                  }
                `}
              >
                <div className="node-icon inline-flex items-center">
                  {getNodeIcon(node.data.type, `
                    ${selectedNode?.id === node.id ? 'text-indigo-400' : 'group-hover:text-indigo-400'}
                  `)}
                </div>
                <div className="node-info flex flex-col overflow-hidden">
                  <div className={`
                    node-name font-semibold truncate
                    ${selectedNode?.id === node.id ? 'text-white' : 'text-gray-200 group-hover:text-white'}
                  `}>
                    {node.data.name}
                  </div>
                  <div className={`
                    text-xs font-medium uppercase
                    ${selectedNode?.id === node.id ? 'text-indigo-300' : `${iconColors[node.data.type]} group-hover:text-indigo-300`}
                  `}>
                    {node.data.type}
                  </div>
                  {node.data.description && (
                    <div className={`
                      text-xs text-gray-400 mt-1 leading-tight
                      line-clamp-2 overflow-hidden
                      ${selectedNode?.id === node.id ? 'text-gray-300' : 'group-hover:text-gray-300'}
                    `}>
                      {node.data.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}