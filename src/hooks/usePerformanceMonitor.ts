import React, { useEffect, useRef, useCallback } from 'react';
import { createContextLogger } from '@/services/loggerService';

interface PerformanceMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsage?: number;
  componentName: string;
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  sampleSize?: number;
  logInterval?: number;
}

export const usePerformanceMonitor = (
  componentName: string, 
  options: UsePerformanceMonitorOptions = {}
) => {
  const { 
    enabled = import.meta.env.DEV, 
    sampleSize = 10,
    logInterval = 30000 // 30 seconds
  } = options;

  const logger = createContextLogger('PerformanceMonitor');
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    componentName,
  });
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const logTimerRef = useRef<NodeJS.Timeout>();

  // Mark render start
  const markRenderStart = useCallback(() => {
    if (!enabled) return;
    startTimeRef.current = performance.now();
  }, [enabled]);

  // Mark render end
  const markRenderEnd = useCallback(() => {
    if (!enabled || startTimeRef.current === 0) return;

    const renderTime = performance.now() - startTimeRef.current;
    renderTimesRef.current.push(renderTime);
    
    // Keep only last N samples
    if (renderTimesRef.current.length > sampleSize) {
      renderTimesRef.current.shift();
    }

    // Calculate average
    const averageRenderTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;

    // Update metrics
    metricsRef.current = {
      ...metricsRef.current,
      renderCount: metricsRef.current.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    };

    // Log warning if render time is high
    if (renderTime > 16.67) { // More than one frame at 60fps
      logger.warn(`Slow render detected in ${componentName}`, undefined, {
        renderTime,
        averageRenderTime,
        renderCount: metricsRef.current.renderCount,
      });
    }

    startTimeRef.current = 0;
  }, [enabled, sampleSize, componentName, logger]);

  // Periodic logging
  useEffect(() => {
    if (!enabled) return;

    logTimerRef.current = setInterval(() => {
      const metrics = metricsRef.current;
      if (metrics.renderCount > 0) {
        logger.debug(`Performance metrics for ${componentName}`, {
          renderCount: metrics.renderCount,
          averageRenderTime: metrics.averageRenderTime.toFixed(2),
          lastRenderTime: metrics.lastRenderTime.toFixed(2),
          memoryUsage: metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A',
        });
      }
    }, logInterval);

    return () => {
      if (logTimerRef.current) {
        clearInterval(logTimerRef.current);
      }
    };
  }, [enabled, componentName, logInterval, logger]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      componentName,
    };
    renderTimesRef.current = [];
  }, [componentName]);

  return {
    markRenderStart,
    markRenderEnd,
    getMetrics,
    resetMetrics,
    enabled,
  };
};

// HOC for automatic performance monitoring
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const MonitoredComponent = React.memo<P>((props) => {
    const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const { markRenderStart, markRenderEnd } = usePerformanceMonitor(displayName);

    // Mark render start
    markRenderStart();

    useEffect(() => {
      // Mark render end after component has rendered
      markRenderEnd();
    });

    return React.createElement(WrappedComponent, props);
  });

  MonitoredComponent.displayName = `withPerformanceMonitor(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return MonitoredComponent;
}

// Hook for monitoring expensive operations
export const useOperationMonitor = () => {
  const logger = createContextLogger('OperationMonitor');

  const monitorOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T> | T,
    warnThreshold: number = 1000
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      if (duration > warnThreshold) {
        logger.warn(`Slow operation: ${operationName}`, undefined, {
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${warnThreshold}ms`,
        });
      } else {
        logger.debug(`Operation completed: ${operationName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Operation failed: ${operationName}`, error as Error, {
        duration: `${duration.toFixed(2)}ms`,
      });
      throw error;
    }
  }, [logger]);

  return { monitorOperation };
};

export default usePerformanceMonitor;