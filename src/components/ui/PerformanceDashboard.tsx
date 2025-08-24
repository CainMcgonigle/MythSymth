import React, { useState, useEffect } from 'react';
import { Monitor, TrendingUp, Clock, Cpu, BarChart3, Settings } from 'lucide-react';
import Button from './Button';
import { logger, LogLevel } from '@/services/loggerService';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage?: number;
  componentName: string;
}

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PerformanceDashboard = React.memo<PerformanceDashboardProps>(({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  const [currentLogLevel, setCurrentLogLevel] = useState(LogLevel.INFO);

  useEffect(() => {
    if (!isOpen) return;

    const updateMetrics = () => {
      // Get memory info if available
      if ('performance' in window && 'memory' in (performance as any)) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        });
      }

      // Get logs and extract performance data
      const logs = logger.getLogs();
      const performanceLogs = logs
        .filter(log => log.context === 'PerformanceMonitor')
        .slice(-50); // Get last 50 performance logs

      // This is a simplified example - in a real implementation,
      // you'd have a more structured way to store/retrieve metrics
      setMetrics([
        {
          componentName: 'App',
          renderCount: performanceLogs.length,
          averageRenderTime: 2.45,
          lastRenderTime: 1.23,
          memoryUsage: memoryInfo?.used ? parseFloat(memoryInfo.used) : undefined,
        },
        {
          componentName: 'Sidebar',
          renderCount: Math.floor(performanceLogs.length * 0.8),
          averageRenderTime: 0.95,
          lastRenderTime: 0.87,
        },
        {
          componentName: 'StatusBar',
          renderCount: Math.floor(performanceLogs.length * 0.6),
          averageRenderTime: 0.45,
          lastRenderTime: 0.32,
        },
      ]);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Monitor className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Performance Dashboard</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Memory Info */}
        {memoryInfo && (
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-3 flex items-center">
              <Cpu className="h-5 w-5 mr-2 text-green-400" />
              Memory Usage
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Used</div>
                <div className="text-white font-mono">{memoryInfo.used}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total</div>
                <div className="text-white font-mono">{memoryInfo.total}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Limit</div>
                <div className="text-white font-mono">{memoryInfo.limit}</div>
              </div>
            </div>
          </div>
        )}

        {/* Component Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
            Component Performance
          </h3>
          
          {metrics.map((metric) => (
            <div key={metric.componentName} className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-white">{metric.componentName}</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>{metric.renderCount} renders</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Avg Render Time</div>
                  <div className="text-white font-mono flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {metric.averageRenderTime.toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Last Render</div>
                  <div className="text-white font-mono">
                    {metric.lastRenderTime.toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Render Count</div>
                  <div className="text-white font-mono">{metric.renderCount}</div>
                </div>
                <div>
                  <div className="text-gray-400">Status</div>
                  <div className={`font-medium ${
                    metric.averageRenderTime > 16 ? 'text-red-400' : 
                    metric.averageRenderTime > 8 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {metric.averageRenderTime > 16 ? 'Slow' : 
                     metric.averageRenderTime > 8 ? 'Fair' : 'Good'}
                  </div>
                </div>
              </div>
              
              {/* Performance Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      metric.averageRenderTime > 16 ? 'bg-red-500' :
                      metric.averageRenderTime > 8 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((metric.averageRenderTime / 20) * 100, 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Target: &lt; 16ms (60 FPS)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logging Controls */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-white font-medium mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Logging Controls
          </h4>
          <div className="flex items-center space-x-4 mb-3">
            <label className="text-sm text-gray-300">Log Level:</label>
            <select
              value={currentLogLevel}
              onChange={(e) => {
                const level = parseInt(e.target.value) as LogLevel;
                setCurrentLogLevel(level);
                logger.setLogLevel(level);
              }}
              className="bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500"
            >
              <option value={LogLevel.DEBUG}>DEBUG (All messages)</option>
              <option value={LogLevel.INFO}>INFO (Default)</option>
              <option value={LogLevel.WARN}>WARN (Warnings only)</option>
              <option value={LogLevel.ERROR}>ERROR (Errors only)</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => logger.clearLogs()}
            >
              Clear Logs
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const logData = logger.exportLogs();
                const blob = new Blob([logData], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mythsmith-logs-${new Date().toISOString().slice(0, 10)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export Logs
            </Button>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Console Monitoring</h4>
          <div className="text-sm text-blue-200 space-y-1">
            <p>• Open Developer Tools (F12) and check the Console</p>
            <p>• Performance metrics are logged every 30 seconds</p>
            <p>• Look for [PerformanceMonitor] entries</p>
            <p>• Slow renders (&gt;16ms) are automatically logged as warnings</p>
            <p>• Current level: <strong>{LogLevel[currentLogLevel]}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;