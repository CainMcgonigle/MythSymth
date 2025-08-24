import { useEffect } from 'react';

interface GraphAutoSaveProps {
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  hasUnsavedChanges: () => boolean;
  isSaving: boolean;
  isInitialized: boolean;
  saveMap: () => void;
}

export const useGraphAutoSave = ({
  autoSaveEnabled,
  autoSaveInterval,
  hasUnsavedChanges,
  isSaving,
  isInitialized,
  saveMap,
}: GraphAutoSaveProps) => {
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges() || !isInitialized) return;
    
    const intervalId = setInterval(() => {
      if (hasUnsavedChanges() && !isSaving) {
        console.log('Auto-saving changes...');
        saveMap();
      }
    }, autoSaveInterval);
    
    return () => clearInterval(intervalId);
  }, [
    autoSaveEnabled,
    autoSaveInterval,
    hasUnsavedChanges,
    isSaving,
    saveMap,
    isInitialized,
  ]);
};