import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File, mergeStrategy: "replace" | "merge") => Promise<void>;
  onExport: (format: "json" | "csv" | "graphml", filename?: string) => void;
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
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "graphml">(
    "json"
  );
  const [exportFilename, setExportFilename] = useState("");
  const [mergeStrategy, setMergeStrategy] = useState<"replace" | "merge">(
    "replace"
  );
  const [dragOver, setDragOver] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
    nodesCreated?: number;
    edgesCreated?: number;
    conflicts?: string[];
    warnings?: string[];
  }>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleExport = () => {
    const filename = exportFilename.trim() || undefined;
    onExport(exportFormat, filename);
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    setImportStatus({
      status: "loading",
      message: "Processing file...",
    });

    onImport(file, mergeStrategy)
      .then(() => {
        // Import was successful, show the details we tracked
        setImportStatus({
          status: "success",
          message: "Graph imported successfully!",
          nodesCreated: importDetails.nodesCreated || 0,
          edgesCreated: importDetails.edgesCreated || 0,
          conflicts: importDetails.conflicts || [],
          warnings: importDetails.warnings || [],
        });
      })
      .catch((error) => {
        setImportStatus({
          status: "error",
          message: error.message || "Failed to import graph",
        });
      });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(
      (file) => file.type === "application/json" || file.name.endsWith(".json")
    );
    if (jsonFile) {
      handleFileSelect(jsonFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const resetImport = () => {
    setImportStatus({ status: "idle" });
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
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-gray-800 p-6 rounded-xl w-[460px] max-w-[90vw] max-h-[90vh] overflow-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">
            Import & Export Graph
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab("export");
                resetImport();
              }}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === "export"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                setActiveTab("import");
                resetImport();
              }}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === "import"
                  ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Import
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="space-y-6">
          {activeTab === "export" && (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center text-sm text-gray-300">
                  <FileText size={16} className="mr-2" />
                  Current graph: {nodeCount} nodes, {edgeCount} edges
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="space-y-3">
                  {(["json", "csv", "graphml"] as const).map((format) => (
                    <label
                      key={format}
                      className="flex items-start space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="mt-1 accent-blue-500"
                      />
                      <div>
                        <div className="font-medium text-white uppercase">
                          {format}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatDescriptions[format]}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="filename"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Filename (optional)
                </label>
                <input
                  id="filename"
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder={`graph-export-${new Date().toISOString().split("T")[0]}`}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to use default filename
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
                >
                  <Download size={16} className="mr-2" />
                  Export Graph
                </button>
              </div>
            </div>
          )}
          {activeTab === "import" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Import Strategy
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeStrategy"
                      value="replace"
                      checked={mergeStrategy === "replace"}
                      onChange={(e) => setMergeStrategy(e.target.value as any)}
                      className="accent-blue-500"
                      disabled={importStatus.status !== "idle"}
                    />
                    <div>
                      <div className="font-medium text-white">
                        Replace Current Graph
                      </div>
                      <div className="text-sm text-gray-400">
                        Remove all existing nodes and edges, replace with
                        imported data
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="mergeStrategy"
                      value="merge"
                      checked={mergeStrategy === "merge"}
                      onChange={(e) => setMergeStrategy(e.target.value as any)}
                      className="accent-blue-500"
                      disabled={importStatus.status !== "idle"}
                    />
                    <div>
                      <div className="font-medium text-white">
                        Merge with Current Graph
                      </div>
                      <div className="text-sm text-gray-400">
                        Add imported data to existing graph (conflicts will be
                        renamed)
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              {/* File Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-blue-400 bg-gray-700"
                    : "border-gray-600 hover:border-gray-500"
                } ${importStatus.status === "loading" ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                  disabled={importStatus.status === "loading"}
                />
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Drop your JSON file here or click to browse
                    </p>
                    <p className="text-xs text-gray-400">
                      Maximum file size: 10MB
                    </p>
                  </div>
                </div>
              </div>
              {/* Import Status */}
              {importStatus.status !== "idle" && (
                <div
                  className={`rounded-lg p-4 ${
                    importStatus.status === "loading"
                      ? "bg-gray-700 border border-blue-500"
                      : importStatus.status === "success"
                        ? "bg-gray-700 border border-green-500"
                        : "bg-gray-700 border border-red-500"
                  }`}
                >
                  <div className="flex items-center">
                    {importStatus.status === "loading" && (
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                    )}
                    {importStatus.status === "success" && (
                      <CheckCircle size={20} className="text-green-400 mr-3" />
                    )}
                    {importStatus.status === "error" && (
                      <AlertTriangle size={20} className="text-red-400 mr-3" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        importStatus.status === "loading"
                          ? "text-blue-400"
                          : importStatus.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                      }`}
                    >
                      {importStatus.message}
                    </span>
                  </div>

                  {/* Success Details */}
                  {importStatus.status === "success" && (
                    <>
                      {(importStatus.nodesCreated ||
                        importStatus.edgesCreated) && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <p className="text-xs font-medium text-green-400 mb-1">
                            Import Summary:
                          </p>
                          <div className="text-xs text-green-300">
                            {importStatus.nodesCreated && (
                              <div>
                                • {importStatus.nodesCreated} nodes imported
                              </div>
                            )}
                            {importStatus.edgesCreated && (
                              <div>
                                • {importStatus.edgesCreated} edges imported
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conflicts */}
                      {importStatus.conflicts &&
                        importStatus.conflicts.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs font-medium text-yellow-400 mb-1">
                              Conflicts Resolved:
                            </p>
                            <ul className="text-xs text-yellow-300 space-y-1 max-h-24 overflow-y-auto">
                              {importStatus.conflicts.map((conflict, index) => (
                                <li key={index}>• {conflict}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {/* Warnings */}
                      {importStatus.warnings &&
                        importStatus.warnings.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-600">
                            <p className="text-xs font-medium text-yellow-400 mb-1">
                              Warnings:
                            </p>
                            <ul className="text-xs text-yellow-300 space-y-1 max-h-24 overflow-y-auto">
                              {importStatus.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {importStatus.status === "idle" && (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
                {importStatus.status === "success" && (
                  <>
                    <button
                      onClick={resetImport}
                      className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Import Another
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </>
                )}
                {importStatus.status === "error" && (
                  <>
                    <button
                      onClick={resetImport}
                      className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700 flex items-center justify-center"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-2 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
