import { useEffect } from "react";
import { LOCALSTORAGE_KEYS } from "@/constants/graphConstants";

export const useGraphPersistence = (state: any, isInitialized: boolean) => {
  const {
    nodes,
    edges,
    pendingChanges,
    snapToGrid,
    autoSaveEnabled,
    autoSaveInterval,
  } = state;

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCALSTORAGE_KEYS.NODES, JSON.stringify(nodes));
    }
  }, [nodes, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(LOCALSTORAGE_KEYS.EDGES, JSON.stringify(edges));
    }
  }, [edges, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        LOCALSTORAGE_KEYS.PENDING_CHANGES,
        JSON.stringify(pendingChanges)
      );
    }
  }, [pendingChanges, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        LOCALSTORAGE_KEYS.SNAP_TO_GRID,
        JSON.stringify(snapToGrid)
      );
    }
  }, [snapToGrid, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        LOCALSTORAGE_KEYS.AUTO_SAVE,
        JSON.stringify(autoSaveEnabled)
      );
    }
  }, [autoSaveEnabled, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        LOCALSTORAGE_KEYS.AUTO_SAVE_INTERVAL,
        JSON.stringify(autoSaveInterval)
      );
    }
  }, [autoSaveInterval, isInitialized]);
};
