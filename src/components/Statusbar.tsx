import React, { useState, useEffect } from 'react'
import { Node } from '../types'
import { apiService } from '../services/api'
import {
  Database,
  BarChart2,
  MapPin,
  Save,
  Wifi,
  Zap,
  Check,
  X,
  RefreshCcw
} from 'lucide-react'

interface StatusBarProps {
  nodeCount: number
  isOnline: boolean
  selectedNode: Node | null
}

export const StatusBar: React.FC<StatusBarProps> = ({
  nodeCount,
  isOnline,
  selectedNode
}) => {
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const healthy = await apiService.checkHealth()
        setBackendStatus(healthy ? 'connected' : 'disconnected')
        if (healthy) {
          setLastSaved(new Date())
        }
      } catch {
        setBackendStatus('disconnected')
      }
    }

    checkBackendStatus()

    const interval = setInterval(checkBackendStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Refactored to return a Tailwind CSS class
  const getStatusColorClass = () => {
    switch (backendStatus) {
      case 'connected': return 'text-green-500'
      case 'disconnected': return 'text-red-500'
      case 'checking': return 'text-amber-500'
      default: return 'text-gray-500'
    }
  }
  
  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected': return <Check size={16} />
      case 'disconnected': return <X size={16} />
      case 'checking': return <RefreshCcw size={16} className="animate-spin" />
      default: return <Database size={16} />
    }
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected': return 'Connected'
      case 'disconnected': return 'Disconnected'
      case 'checking': return 'Checking...'
      default: return 'Unknown'
    }
  }

  return (
    <div className="flex justify-between items-center px-4 py-2 text-sm bg-neutral-900 border-t border-gray-700 text-gray-400 shadow-lg">
      <div className="flex items-center gap-6">
        <div className={`flex items-center gap-1.5 ${getStatusColorClass()}`}>
          {getStatusIcon()}
          <span>Backend: {getStatusText()}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-blue-500">
          <BarChart2 size={16} />
          <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
        </div>

        {selectedNode && (
          <div className="flex items-center gap-1.5 text-violet-500">
            <MapPin size={16} />
            <span className="truncate max-w-[200px]">
              {selectedNode.data.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {lastSaved && backendStatus === 'connected' && (
          <div className="flex items-center gap-1.5 text-emerald-500">
            <Save size={16} />
            <span>Last saved: {formatTime(lastSaved)}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1.5 text-gray-400">
          <Wifi size={16} className={isOnline ? 'text-green-500' : 'text-gray-500'} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-500">
          <Zap size={16} />
          <span>MythSmith v1.0.0</span>
        </div>
      </div>
    </div>
  )
}