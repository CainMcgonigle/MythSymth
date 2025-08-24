import React from 'react';
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Node } from '@/types';

interface StatusBarProps {
  nodeCount: number;
  isOnline: boolean;
  selectedNode: Node | null;
  pendingOperationsCount?: number;
  lastSyncTime?: Date;
}

const StatusBar = React.memo<StatusBarProps>(({
  nodeCount,
  isOnline,
  selectedNode,
  pendingOperationsCount = 0,
  lastSyncTime,
}) => {
  const formatSyncTime = (time: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="h-8 bg-gray-800 border-t border-gray-700 px-4 flex items-center justify-between text-xs">
      <div className="flex items-center space-x-4">
        {/* Connection status */}
        <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
        </div>

        {/* Node count */}
        <div className="text-gray-400">
          {nodeCount} {nodeCount === 1 ? 'element' : 'elements'}
        </div>

        {/* Pending operations */}
        {pendingOperationsCount > 0 && (
          <div className="flex items-center space-x-1 text-yellow-400">
            <Clock className="h-3 w-3 animate-spin" />
            <span>{pendingOperationsCount} pending</span>
          </div>
        )}

        {/* Sync status */}
        {isOnline && (
          <div className="flex items-center space-x-1 text-gray-400">
            {pendingOperationsCount === 0 ? (
              <CheckCircle className="h-3 w-3 text-green-400" />
            ) : (
              <AlertCircle className="h-3 w-3 text-yellow-400" />
            )}
            <span>
              {pendingOperationsCount === 0 ? 'Synced' : 'Syncing'}
              {lastSyncTime && pendingOperationsCount === 0 && (
                <span className="ml-1">• {formatSyncTime(lastSyncTime)}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Selected node info */}
        {selectedNode && (
          <div className="text-gray-400">
            <span className="text-blue-400">{selectedNode.data.name}</span>
            <span className="ml-2">({selectedNode.data.type})</span>
          </div>
        )}

        {/* App version/build info - only in development */}
        {import.meta.env.DEV && (
          <div className="text-gray-500">
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'} • Dev
          </div>
        )}
      </div>
    </div>
  );
});

StatusBar.displayName = 'StatusBar';

export default StatusBar;