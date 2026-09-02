import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Sparkles,
  HelpCircle,
  Loader2,
  FileCode,
  FileType,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const DocumentBanner: React.FC = () => {
  const {
    activeDocument,
    removeActiveDocument,
    setIsDocumentModalOpen,
    sendMessage,
    isGenerating,
  } = useApp();

  if (!activeDocument) return null;

  const getDocIcon = () => {
    switch (activeDocument.docType) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-600" />;
      case "docx":
        return <FileType className="w-4 h-4 text-blue-600" />;
      case "markdown":
      case "txt":
        return <FileCode className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const quickDocPrompts = [
    "Summarize key concepts from this document",
    "List all formulas, definitions, and theorems",
    "Generate 5 exam practice questions based on this document",
    "Explain the most complex topic in this document in simple terms",
  ];

  return (
    <div
      id="active-document-grounding-banner"
      className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-slate-50 border-b border-emerald-200/80 px-4 py-2.5 transition-all shadow-2xs"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Left: Document Info & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs shrink-0 flex items-center justify-center">
            {getDocIcon()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[220px] sm:max-w-xs"
                title={activeDocument.name}
              >
                {activeDocument.name}
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                {formatSize(activeDocument.size)}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {activeDocument.status === "uploading" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Uploading ({activeDocument.progress || 30}%)...</span>
                </span>
              )}

              {activeDocument.status === "processing" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700">
                  <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                  <span>Extracting & Understanding Content...</span>
                </span>
              )}

              {activeDocument.status === "ready" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Document Grounding Active</span>
                  {activeDocument.wordCount ? (
                    <span className="text-slate-500 font-normal">
                      · {activeDocument.wordCount.toLocaleString()} words
                    </span>
                  ) : null}
                </span>
              )}

              {activeDocument.status === "error" && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{activeDocument.errorMessage || "Processing failed"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Actions & Remove */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {activeDocument.status === "ready" && (
            <button
              onClick={() => setIsDocumentModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              title="Inspect extracted text and summary details"
              id="btn-inspect-doc"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspect</span>
            </button>
          )}

          <button
            onClick={removeActiveDocument}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors shadow-2xs"
            title="Remove document context"
            id="btn-remove-active-doc"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Remove</span>
          </button>
        </div>
      </div>

      {/* Quick Question Prompts based on the document */}
      {activeDocument.status === "ready" && (
        <div className="max-w-4xl mx-auto mt-2 pt-2 border-t border-emerald-200/50 flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
          <span className="text-[10px] font-bold text-emerald-800 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Ask Document:</span>
          </span>
          {quickDocPrompts.map((qPrompt, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(qPrompt)}
              className="shrink-0 px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-emerald-600 hover:text-white border border-emerald-300 text-emerald-900 rounded-full transition-all shadow-2xs active:scale-95"
            >
              {qPrompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
