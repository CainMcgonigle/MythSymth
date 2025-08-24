import { useEffect } from 'react';

interface GraphKeyboardHandlerProps {
  undo: () => void;
  redo: () => void;
  hasUnsavedChanges: () => boolean;
  isSaving: boolean;
  saveMap: () => void;
}

export const useGraphKeyboardHandler = ({
  undo,
  redo,
  hasUnsavedChanges,
  isSaving,
  saveMap,
}: GraphKeyboardHandlerProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        !event.shiftKey
      ) {
        event.preventDefault();
        undo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'z' &&
        event.shiftKey
      ) {
        event.preventDefault();
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges() && !isSaving) {
          saveMap();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, hasUnsavedChanges, isSaving, saveMap]);
};