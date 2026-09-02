import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileType,
  FileCode,
  Check,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const DocumentUploadModal: React.FC = () => {
  const {
    activeDocument,
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    uploadAndProcessDocument,
    removeActiveDocument,
    askDocumentQuestion,
    isGenerating,
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [localQuestion, setLocalQuestion] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isDocumentModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  const processSelectedFile = async (file: File) => {
    setLocalError(null);
    setIsUploading(true);
    try {
      await uploadAndProcessDocument(file);
    } catch (err: any) {
      setLocalError(err.message || "Failed to process document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = () => {
    if (!localQuestion.trim()) return;
    askDocumentQuestion(localQuestion.trim());
    setLocalQuestion("");
    setIsDocumentModalOpen(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const quickDocumentQuestions = [
    "What are the core theorems or main topics covered in this document?",
    "Summarize the entire document into 5 concise bullet points",
    "List all mathematical formulas, constants, and derivations mentioned",
    "Create 5 exam-style practice questions with answer keys based strictly on this text",
    "Explain any definitions or key jargon introduced in this document",
  ];

  const getDocIcon = (docType?: string) => {
    switch (docType) {
      case "pdf":
        return <FileText className="w-6 h-6 text-rose-600" />;
      case "docx":
        return <FileType className="w-6 h-6 text-blue-600" />;
      case "markdown":
      case "txt":
        return <FileCode className="w-6 h-6 text-emerald-600" />;
      default:
        return <FileText className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div
      id="document-upload-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setIsDocumentModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Document-Based Question Answering
              </h2>
              <p className="text-xs text-slate-500">
                Upload lecture notes, textbooks, or syllabus sheets for verified answers
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDocumentModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Error Banner */}
          {(localError || (activeDocument?.status === "error" && activeDocument.errorMessage)) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Upload / Processing Error</span>
                <span>
                  {localError || activeDocument?.errorMessage || "Failed to process file."}
                </span>
              </div>
            </div>
          )}

          {/* Active Document Status Card or Upload Dropzone */}
          {activeDocument ? (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    {getDocIcon(activeDocument.docType)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 break-all">
                      {activeDocument.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatSize(activeDocument.size)}</span>
                      <span>·</span>
                      <span className="uppercase font-semibold">{activeDocument.docType}</span>
                      {activeDocument.wordCount ? (
                        <>
                          <span>·</span>
                          <span>{activeDocument.wordCount.toLocaleString()} words</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  onClick={removeActiveDocument}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove document"
                  id="btn-modal-remove-doc"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress & Status */}
              {activeDocument.status === "uploading" && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Uploading document securely...</span>
                    </span>
                    <span>{activeDocument.progress || 35}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${activeDocument.progress || 35}%` }}
                    />
                  </div>
                </div>
              )}

              {activeDocument.status === "processing" && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-teal-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span>Extracting text & analyzing structure...</span>
                    </span>
                    <span>75%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-teal-600 h-2 rounded-full w-3/4 animate-pulse" />
                  </div>
                </div>
              )}

              {activeDocument.status === "ready" && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Processed successfully & ready for question answering.
                    </span>
                  </div>

                  {activeDocument.previewSnippet && (
                    <div className="mt-2 text-xs bg-white border border-slate-200 rounded-lg p-3 max-h-28 overflow-y-auto text-slate-600 font-mono leading-relaxed custom-scrollbar">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                        Extracted Content Preview:
                      </span>
                      {activeDocument.previewSnippet}
                    </div>
                  )}
                </div>
              )}

              {activeDocument.status === "error" && (
                <div className="pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Click to try uploading another document
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                className="hidden"
                id="doc-file-input"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag & drop educational document
                  </p>
                  <p className="text-xs text-slate-500">
                    Supported: <strong>PDF (.pdf)</strong>, <strong>Word (.docx)</strong>, <strong>Text (.txt, .md)</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Maximum file size: 20MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ask Question Interface (When document is ready) */}
          {activeDocument && activeDocument.status === "ready" && (
            <div className="space-y-3 pt-2">
              <label
                htmlFor="modal-doc-question-input"
                className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Ask a question about &ldquo;{activeDocument.name}&rdquo;:</span>
              </label>

              <div className="flex gap-2">
                <input
                  id="modal-doc-question-input"
                  type="text"
                  value={localQuestion}
                  onChange={(e) => setLocalQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAsk();
                  }}
                  placeholder="e.g., Explain the derivation on page 3, or summarize section 2..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                />
                <button
                  onClick={handleAsk}
                  disabled={!localQuestion.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                  id="btn-ask-doc-modal"
                >
                  <span>Ask</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick suggestions list */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Suggested Document Inquiries:</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {quickDocumentQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        askDocumentQuestion(q);
                        setIsDocumentModalOpen(false);
                      }}
                      className="text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 text-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <span>{q}</span>
                      <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        Ask →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Strict grounding: Karpom AI answers purely based on document content.
          </span>
          <button
            onClick={() => setIsDocumentModalOpen(false)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
