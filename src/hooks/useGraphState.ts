import { useState, useCallback } from "react";
import { useNodesState, useEdgesState } from "reactflow";
import { PendingChanges, HistoryState } from "@/types/graphTypes";
import {
  LOCALSTORAGE_KEYS,
  DEFAULT_AUTO_SAVE_INTERVAL,
  MAX_HISTORY_SIZE,
} from "@/constants/graphConstants";

export const useGraphState = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    newNodes: [],
    updatedNodes: [],
    deletedNodes: [],
    newEdges: [],
    updatedEdges: [],
    deletedEdges: [],
  });
  const [history, setHistory] = useState<HistoryState>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldLoadFromDB, setShouldLoadFromDB] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(() => {
    try {
      const storedSnap = localStorage.getItem(LOCALSTORAGE_KEYS.SNAP_TO_GRID);
      return storedSnap !== null ? JSON.parse(storedSnap) : true;
    } catch (e) {
      console.error(
        "Failed to parse snapToGrid from localStorage, defaulting to true.",
        e
      );
      return true;
    }
  });
  const [isInteractive, setIsInteractive] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(() => {
    try {
      const storedAutoSave = localStorage.getItem(LOCALSTORAGE_KEYS.AUTO_SAVE);
      return storedAutoSave !== null ? JSON.parse(storedAutoSave) : true;
    } catch (e) {
      console.error(
        "Failed to parse autoSave from localStorage, defaulting to true.",
        e
      );
      return true;
    }
  });
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(() => {
    try {
      const storedInterval = localStorage.getItem(
        LOCALSTORAGE_KEYS.AUTO_SAVE_INTERVAL
      );
      return storedInterval !== null
        ? JSON.parse(storedInterval)
        : DEFAULT_AUTO_SAVE_INTERVAL;
    } catch (e) {
      console.error(
        "Failed to parse autoSaveInterval from localStorage, defaulting to 30000.",
        e
      );
      return DEFAULT_AUTO_SAVE_INTERVAL;
    }
  });

  const hasUnsavedChanges = useCallback(() => {
    return (
      pendingChanges.newNodes.length > 0 ||
      pendingChanges.updatedNodes.length > 0 ||
      pendingChanges.deletedNodes.length > 0 ||
      pendingChanges.newEdges.length > 0 ||
      pendingChanges.updatedEdges.length > 0 ||
      pendingChanges.deletedEdges.length > 0
    );
  }, [pendingChanges]);

  const saveStateToHistory = useCallback(() => {
    if (
      history.length === 0 ||
      JSON.stringify(history[historyIndex].nodes) !== JSON.stringify(nodes) ||
      JSON.stringify(history[historyIndex].edges) !== JSON.stringify(edges)
    ) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      });

      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
      }

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [nodes, edges, history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);

      setPendingChanges((prev) => ({
        ...prev,
        updatedNodes: [
          ...new Set([
            ...prev.updatedNodes,
            ...prevState.nodes.map((n) => n.id),
          ]),
        ],
      }));
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);

      setPendingChanges((prev) => ({
        ...prev,
        updatedNodes: [
          ...new Set([
            ...prev.updatedNodes,
            ...nextState.nodes.map((n) => n.id),
          ]),
        ],
      }));
    }
  }, [history, historyIndex, setNodes, setEdges]);

  return {
    // State
    nodes,
    edges,
    pendingChanges,
    history,
    historyIndex,
    isSaving,
    isInitialized,
    shouldLoadFromDB,
    snapToGrid,
    isInteractive,
    autoSaveEnabled,
    autoSaveInterval,

    // Setters
    setNodes,
    setEdges,
    setPendingChanges,
    setHistory,
    setHistoryIndex,
    setIsSaving,
    setIsInitialized,
    setShouldLoadFromDB,
    setSnapToGrid,
    setIsInteractive,
    setAutoSaveEnabled,
    setAutoSaveInterval,

    // Actions
    onNodesChange,
    onEdgesChange,
    hasUnsavedChanges,
    saveStateToHistory,
    undo,
    redo,
  };
};
