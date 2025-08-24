import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "./index.css";

// Performance monitoring in development
if (import.meta.env.DEV) {
  // Enable React DevTools profiler
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.settings?.profilerEnabled;
  
  // Log initial performance metrics
  if ('performance' in window && 'memory' in (performance as any)) {
    console.log('Initial memory usage:', {
      used: `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${((performance as any).memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
    });
  }
}

const root = ReactDOM.createRoot(document.getElementById("root")!);

// Use concurrent features in React 18
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance monitoring
if (import.meta.env.DEV) {
  // Monitor performance periodically
  setInterval(() => {
    if ('performance' in window && 'memory' in (performance as any)) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      
      // Warn if memory usage is high
      if (usedMB > 100) {
        console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB`);
      }
    }
  }, 30000); // Check every 30 seconds
}