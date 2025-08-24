import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Edge, Node as FlowNode } from 'reactflow';
import ImportExportModal from '@/components/ui/ImportExportModal';
import { 
  exportToFormat, 
  importGraphData, 
  prepareImportData 
} from '@/utils/importExportUtils';
import { clearLocalStorage } from '@/utils/graphUtils';
import { apiService } from '@/services/apiService';
import { nodeKeys } from '@/hooks/useNodes';
import { useToast } from '@/components/ui/Toast';
import { Node } from '@/types';

interface GraphImportExportProps {
  nodes: FlowNode[];
  edges: Edge[];
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setHistory: (history: Array<{nodes: FlowNode[], edges: Edge[]}>) => void;
  setHistoryIndex: (index: number) => void;
  setPendingChanges: (changes: any) => void;
  setShouldLoadFromDB: (value: boolean) => void;
}

export const useGraphImportExport = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  setHistory,
  setHistoryIndex,
  setPendingChanges,
  setShouldLoadFromDB,
}: GraphImportExportProps) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [importExportModal, setImportExportModal] = useState({ isOpen: false });
  const [importDetails, setImportDetails] = useState<{
    nodesCreated?: number;
    edgesCreated?: number;
    conflicts?: string[];
    warnings?: string[];
  }>({});

  const handleExport = useCallback(
    (format: 'json' | 'csv' | 'graphml', filename?: string) => {
      try {
        const backendNodes: Node[] = nodes.map((fNode) => ({
          id: fNode.id,
          data: fNode.data,
          position: fNode.position,
          createdAt: fNode.data.createdAt,
          updatedAt: fNode.data.updatedAt,
        }));
        
        exportToFormat(backendNodes, edges, format, filename);
        addToast(`Graph exported as ${format.toUpperCase()}`, 'success');
      } catch (error) {
        console.error('Export failed:', error);
        addToast('Failed to export graph', 'error');
      }
    },
    [nodes, edges, addToast]
  );

  const handleImport = useCallback(
    async (file: File, mergeStrategy: 'replace' | 'merge') => {
      try {
        const importResult = await importGraphData(file);
        if (!importResult.success) {
          throw new Error(importResult.error);
        }
        if (!importResult.data) {
          throw new Error('No data in import result');
        }

        const importRequest = prepareImportData(importResult.data, mergeStrategy);
        const response = await apiService.import.importMap(importRequest);
        
        setImportDetails({
          nodesCreated: response.nodesCreated,
          edgesCreated: response.edgesCreated,
          conflicts: response.conflicts,
          warnings: response.warnings,
        });

        clearLocalStorage();

        let message = `Imported ${response.nodesCreated} nodes and ${response.edgesCreated} edges`;
        if (response.conflicts && response.conflicts.length > 0) {
          message += ` (${response.conflicts.length} conflicts resolved)`;
        }
        addToast(message, 'success');

        if (response.warnings && response.warnings.length > 0) {
          const warningCount = response.warnings.length;
          setTimeout(() => {
            addToast(`Import completed with ${warningCount} warnings`, 'warning');
          }, 1000);
        }

        // Reset graph state and force reload from DB
        setNodes([]);
        setEdges([]);
        setHistory([]);
        setHistoryIndex(0);
        setPendingChanges({
          newNodes: [],
          updatedNodes: [],
          deletedNodes: [],
          newEdges: [],
          updatedEdges: [],
          deletedEdges: [],
        });

        queryClient.invalidateQueries({ queryKey: nodeKeys.all });
        queryClient.invalidateQueries({ queryKey: ['edges'] });
        setShouldLoadFromDB(true);
      } catch (error) {
        console.error('Import failed:', error);
        throw error;
      }
    },
    [
      queryClient,
      setShouldLoadFromDB,
      addToast,
      setNodes,
      setEdges,
      setHistory,
      setHistoryIndex,
      setPendingChanges,
    ]
  );

  const handleImportExportClick = useCallback(() => {
    setImportExportModal({ isOpen: true });
  }, []);

  const handleImportExportClose = useCallback(() => {
    setImportExportModal({ isOpen: false });
  }, []);

  const ImportExportModalComponent = (
    <ImportExportModal
      importDetails={importDetails}
      isOpen={importExportModal.isOpen}
      onClose={handleImportExportClose}
      onImport={handleImport}
      onExport={handleExport}
      nodeCount={nodes.length}
      edgeCount={edges.length}
    />
  );

  return {
    handleImportExportClick,
    ImportExportModalComponent,
  };
};