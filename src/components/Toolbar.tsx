import React from 'react'
import { Node, NodeType } from '../types'
import {
  User,
  Swords,
  Building,
  CloudLightning,
  MapPin,
  Menu,
  Plus,
  Trash2,
  HelpCircle,
  PanelLeftClose,  
} from 'lucide-react'

interface ToolbarProps {
  onCreateNode: () => void
  onToggleSidebar: () => void
  onQuickCreate: (type: NodeType) => void
  selectedNode: Node | null
  onDeleteNode: (nodeId: string) => void
  isSidebarOpen: boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onCreateNode,
  onToggleSidebar,
  onQuickCreate,
  selectedNode,
  onDeleteNode,
  isSidebarOpen 
}) => {
  const quickCreateOptions = [
    {
      type: 'character' as NodeType,
      label: 'Character',
      icon: <User size={18} />,
      title: 'Create Character',
      baseClasses: 'text-gray-400',
      hoverClasses: 'hover:bg-blue-700/20 hover:text-blue-400 focus:ring-blue-400'
    },
    {
      type: 'faction' as NodeType,
      label: 'Faction',
      icon: <Swords size={18} />,
      title: 'Create Faction',
      baseClasses: 'text-gray-400',
      hoverClasses: 'hover:bg-red-700/20 hover:text-red-400 focus:ring-red-400'
    },
    {
      type: 'city' as NodeType,
      label: 'City',
      icon: <Building size={18} />,
      title: 'Create City',
      baseClasses: 'text-gray-400',
      hoverClasses: 'hover:bg-orange-700/20 hover:text-orange-400 focus:ring-orange-400'
    },
    {
      type: 'event' as NodeType,
      label: 'Event',
      icon: <CloudLightning size={18} />,
      title: 'Create Event',
      baseClasses: 'text-gray-400',
      hoverClasses: 'hover:bg-emerald-700/20 hover:text-emerald-400 focus:ring-emerald-400'
    },
    {
      type: 'location' as NodeType,
      label: 'Location',
      icon: <MapPin size={18} />,
      title: 'Create Location',
      baseClasses: 'text-gray-400',
      hoverClasses: 'hover:bg-purple-700/20 hover:text-purple-400 focus:ring-purple-400'
    }
  ]

  return (
    <div className="relative flex justify-between items-center bg-neutral-900 border-b border-gray-700 shadow-lg h-[56px] pr-4 pl-4">
      {/* Left side: Sidebar toggle, create button, quick create buttons */}
      <div className="flex items-center gap-2 h-full">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          className="flex items-center gap-1.5 font-semibold text-gray-300 hover:text-white px-2 h-full rounded-md transition-colors duration-150"
        >
          {/* Conditional icon rendering */}
          {isSidebarOpen ? <PanelLeftClose size={18} /> : <Menu size={18} />}
        </button>

        {/* Updated 'Create' button for a more subtle look */}
        <button
          onClick={onCreateNode}
          title="Create New Node"
          className="flex items-center gap-1.5 font-semibold bg-blue-700/20 text-blue-400 px-3 py-1.5 rounded-md shadow-md hover:bg-blue-700/40 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-150"
        >
          <Plus size={18} />
        </button>

        {/* Updated Quick Create buttons with text labels */}
        <div className="flex gap-2">
          {quickCreateOptions.map(option => (
            <button
              key={option.type}
              onClick={() => onQuickCreate(option.type)}
              title={option.title}
              className={`
                flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-full transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-neutral-900
                ${option.baseClasses} ${option.hoverClasses}
              `}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: App title - absolutely centered */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center font-semibold text-orange-400 text-lg select-none pointer-events-none">
        <img 
          src="/assets/android-chrome-192x192.png" 
          alt="MythSmith logo" 
          className="w-8 h-8 mr-1"
        />
        <span>MythSmith</span>
      </div>
      {/* Right side: Selected node info, delete button, help */}
      <div className="flex items-center space-x-3 text-gray-300">
        {selectedNode && (
          <>
            <div className="flex items-center gap-1 text-sm opacity-90 select-text max-w-xs truncate">
              <span>Selected:</span>
              <span className="font-semibold truncate max-w-xs">{selectedNode.data.name}</span>
            </div>

            <button
              onClick={() => onDeleteNode(selectedNode.data.id.toString())}
              title="Delete Selected Node"
              className="flex items-center gap-1.5 font-semibold bg-red-700 text-white px-3 py-1.5 rounded-md shadow-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-150"
            >
              <Trash2 size={18} />
              <span>Delete</span>
            </button>
          </>
        )}

        <button
          onClick={() => {
            alert(
              'MythSmith - A worldbuilding engine for writers and RPG designers.\n\nFeatures:\n• Visual node-based world creation\n• Character, faction, city, event, and location management\n• Drag and drop interface\n• Persistent storage'
            )
          }}
          title="About MythSmith"
          className="flex items-center gap-1.5 font-semibold bg-indigo-700 text-indigo-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors duration-150"
        >
          <HelpCircle size={18} />
          <span>Help</span>
        </button>
      </div>
    </div>
  )
}