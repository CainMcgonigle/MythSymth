// ImportExportModal.tsx
import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  Eye,
} from "lucide-react";
import "reactflow/dist/style.css";
import GraphPreviewModal from "./graphPreviewModal";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, mergeStrategy: "replace" | "merge") => Promise<void>;
  onExport: (
    format: "json" | "csv" | "graphml",
    filename?: string
  ) => void;
  nodeCount: number;
  edgeCount: number;
  importDetails?: {
    nodesCreated?: number;
    edgesCreated?: number;
    conflicts?: string[];
    warnings?: string[];
  };
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  onExport,
  nodeCount,
  edgeCount,
  importDetails = {},
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export">("export");
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "graphml">("json");
  const [exportFilename, setExportFilename] = useState("");
  const [mergeStrategy, setMergeStrategy] = useState<"replace" | "merge">("replace");
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string; }>({ status: "idle" });
  const [previewData, setPreviewData] = useState<{ nodes?: any[]; edges?: any[] } | null>(null);
  const [previewGraphOpen, setPreviewGraphOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const normalizedNodes = (parsed.nodes || []).map((n: any, idx: number) => ({
        id: n.id || `node-${idx}`,
        type: "mythsmith",
        position: n.position || { x: idx * 100, y: idx * 50 },
        data: {
          name: n.data?.name || n.name || `Node ${idx + 1}`,
          description: n.data?.description || n.description || "",
          ...n.data,
        },
      }));
      const normalizedEdges = (parsed.edges || []).map((e: any, idx: number) => ({
        id: e.id || `edge-${idx}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "mythsmith",
        data: e.data || {},
      }));
      setPreviewData({ nodes: normalizedNodes, edges: normalizedEdges });
      setImportStatus({ status: "idle", message: "Preview loaded. Ready to import." });
    } catch (err: any) {
      setImportStatus({ status: "error", message: err.message || "Invalid file format" });
    }
  };

  const handleConfirmImport = () => {
    if (!fileInputRef.current?.files?.[0]) return;
    const file = fileInputRef.current.files[0];
    setImportStatus({ status: "loading", message: "Importing..." });
    onImport(file, mergeStrategy)
      .then(() => {
        setImportStatus({ status: "success", message: "Graph imported successfully!" });
        setPreviewData(null);
        // Close modal after successful import
        setTimeout(() => onClose(), 1500);
      })
      .catch((error) => {
        setImportStatus({ status: "error", message: error.message || "Failed to import graph" });
      });
  };

  const resetImport = () => {
    setImportStatus({ status: "idle" });
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDescriptions = {
    json: "Complete graph data with all properties and metadata (recommended)",
    csv: "Separate CSV files for nodes and edges (for spreadsheet analysis)",
    graphml: "Standard XML format compatible with graph analysis tools",
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" aria-modal="true" role="dialog">
        <div className="bg-gray-800 p-6 rounded-xl w-[460px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Import & Export Graph</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-bold">&times;</button>
          </div>
          {/* Tabs */}
          <div className="border-b border-gray-700 mb-6 flex">
            <button
              onClick={() => { setActiveTab("export"); resetImport(); }}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "export" ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Download size={16} className="inline mr-2" /> Export
            </button>
            <button
              onClick={() => { setActiveTab("import"); resetImport(); }}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === "import" ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700" : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Upload size={16} className="inline mr-2" /> Import
            </button>
          </div>
          {/* Export */}
          {activeTab === "export" && (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-300">
                  <FileText size={16} className="mr-2" />
                  Current graph: {nodeCount} nodes, {edgeCount} edges
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Export Format</label>
                <div className="space-y-3">
                  {(["json", "csv", "graphml"] as const).map((format) => (
                    <label key={format} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="mt-1 accent-blue-500"
                      />
                      <div>
                        <div className="font-medium text-white uppercase">{format}</div>
                        <div className="text-sm text-gray-400">{formatDescriptions[format]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Filename (optional)</label>
                <input
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder={`graph-export-${new Date().toISOString().split("T")[0]}`}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700">Cancel</button>
                <button onClick={() => onExport(exportFormat, exportFilename.trim() || undefined)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                  <Download size={16} className="inline mr-2" /> Export Graph
                </button>
              </div>
            </div>
          )}
          {/* Import */}
          {activeTab === "import" && (
            <div className="space-y-6">
              {/* File Drop */}
              <div
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-blue-400 bg-gray-700" : "border-gray-600"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-300">Drag & drop a graph JSON file here, or click to select a file.</p>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
                />
              </div>
              {previewData && (
                <div className="flex gap-3">
                  <button onClick={() => setPreviewGraphOpen(true)} className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                    <Eye size={16} className="inline mr-2" /> Preview Graph
                  </button>
                  <select
                    value={mergeStrategy}
                    onChange={(e) => setMergeStrategy(e.target.value as any)}
                    className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="replace">Replace Existing Graph</option>
                    <option value="merge">Merge with Existing Graph</option>
                  </select>
                </div>
              )}
              {importStatus.message && (
                <div className={`text-sm font-medium ${
                  importStatus.status === "error" ? "text-red-500" :
                  importStatus.status === "success" ? "text-green-500" : "text-gray-300"
                }`}>
                  {importStatus.message}
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700">Cancel</button>
                <button onClick={handleConfirmImport} disabled={!previewData} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                  <Upload size={16} className="inline mr-2" /> Import Graph
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Graph Preview Modal */}
      {previewData && (
        <GraphPreviewModal
          isOpen={previewGraphOpen}
          onClose={() => setPreviewGraphOpen(false)}
          nodes={previewData.nodes || []}
          edges={previewData.edges || []}
        />
      )}
    </>
  );
};

export default ImportExportModal;