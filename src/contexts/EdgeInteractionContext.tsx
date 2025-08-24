import React, { createContext, useContext } from 'react';
import { MythSmithEdgeData } from '@/types';

interface EdgeInteractionContextType {
  showConnectionDetails: (edgeId: string, data: MythSmithEdgeData, position: { x: number; y: number }) => void;
}

const EdgeInteractionContext = createContext<EdgeInteractionContextType | null>(null);

export const EdgeInteractionProvider: React.FC<{
  children: React.ReactNode;
  showConnectionDetails: (edgeId: string, data: MythSmithEdgeData, position: { x: number; y: number }) => void;
}> = ({ children, showConnectionDetails }) => {
  return (
    <EdgeInteractionContext.Provider value={{ showConnectionDetails }}>
      {children}
    </EdgeInteractionContext.Provider>
  );
};

export const useEdgeInteraction = () => {
  const context = useContext(EdgeInteractionContext);
  if (!context) {
    throw new Error('useEdgeInteraction must be used within EdgeInteractionProvider');
  }
  return context;
};