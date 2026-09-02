import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Sidebar } from "../components/Sidebar";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { QuizModal } from "../components/QuizModal";
import { SummaryModal } from "../components/SummaryModal";
import { DocumentBanner } from "../components/DocumentBanner";
import { DocumentUploadModal } from "../components/DocumentUploadModal";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Menu,
  Sparkles,
  HelpCircle,
  FileText,
  Trash2,
  Share2,
  Plus,
  BookOpen,
  AlertCircle,
  GraduationCap,
  Layers,
  Check,
  Edit2,
  UploadCloud,
} from "lucide-react";
import { EngineeringBranch } from "../types";

export const ChatPage: React.FC = () => {
  const {
    activeConversation,
    createNewConversation,
    clearCurrentConversation,
    selectedBranch,
    setSelectedBranch,
    selectedStudyMode,
    isGenerating,
    error,
    clearError,
    activeQuizModal,
    closeQuizModal,
    activeSummaryModal,
    closeSummaryModal,
    launchQuiz,
    isGeneratingQuiz,
    abortQuizGeneration,
    launchSummary,
    isGeneratingSummary,
    abortSummaryGeneration,
    sendMessage,
    renameConversation,
    activeDocument,
    setIsDocumentModalOpen,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isGenerating]);

  const handleStartEditingTitle = () => {
    if (activeConversation) {
      setEditedTitle(activeConversation.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (activeConversation && editedTitle.trim()) {
      renameConversation(activeConversation.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  // High-yield branch prompts for empty state
  const curatedBranchPrompts: Record<string, string[]> = {
    "Computer Science & AI": [
      "Explain Cache Coherence & the MESI Protocol with an intuitive state diagram analogy",
      "Step-by-step derivation of Dijkstra's algorithm vs A* with Big-O space/time proofs",
      "How does Backpropagation in Deep Neural Networks calculate weight gradients via Chain Rule?",
      "Explain Operating System Virtual Memory, Page Fault handling & TLB hits",
    ],
    "Electronics & Communication": [
      "Derive the Cooley-Tukey Radix-2 FFT Butterfly computation step-by-step",
      "Explain Phase-Locked Loops (PLL) frequency synthesis & loop filter design",
      "What is the physical meaning of Maxwell's 4 equations and electromagnetic wave propagation?",
      "Explain Quadrature Amplitude Modulation (QAM-16 vs QAM-64) constellation diagrams",
    ],
    "Electrical & Electronics": [
      "Derive the torque-speed equation for a 3-Phase Induction Motor",
      "Explain Synchronous Generator armature reaction under lagging & leading power factors",
      "State-space representation and controllability/observability criteria in Modern Control Theory",
      "Explain Buck-Boost Converter design calculations with inductor ripple current",
    ],
    "Mechanical & Robotics": [
      "Step-by-step derivation of Navier-Stokes equations for viscous fluid flow",
      "Explain Mohr's Circle derivation for principal stresses and maximum shear stress",
      "Forward Kinematics using Denavit-Hartenberg (DH) parameters for a 3-DOF robotic arm",
      "Explain the Carnot cycle efficiency limit using Second Law of Thermodynamics",
    ],
    "Engineering Mathematics": [
      "Geometric and algebraic proof of Singular Value Decomposition (SVD)",
      "How to solve Second-Order Linear Differential Equations with constant coefficients",
      "Explain Bayes' Theorem with a medical diagnostic testing problem",
      "Cauchy-Riemann equations for analytic functions in Complex Analysis",
    ],
  };

  const currentPrompts =
    curatedBranchPrompts[selectedBranch] ||
    curatedBranchPrompts["Computer Science & AI"];

  const messages = activeConversation?.messages || [];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-10">
          {/* Left: Mobile Toggle & Title */}
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden shrink-0 transition-colors"
              aria-label="Toggle Conversations Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation Title & Badge */}
            <div className="flex items-center gap-2 overflow-hidden">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="text-xs sm:text-sm font-bold text-slate-900 border border-emerald-600 rounded px-2 py-0.5 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-emerald-700 hover:text-emerald-800"
                    aria-label="Save title"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 overflow-hidden group">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md font-heading">
                    {activeConversation?.title || "New Academic Chat"}
                  </h2>
                  <button
                    onClick={handleStartEditingTitle}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                    title="Rename conversation"
                    aria-label="Rename conversation"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Branch Pill */}
              <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {selectedBranch}
              </span>

              {/* Language Selector Dropdown in Header */}
              <div className="hidden sm:block">
                <LanguageSelector variant="compact" />
              </div>
            </div>
          </div>

          {/* Right Header Actions: Quiz, Summary, Document QA, Clear */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Upload Document / QA Button */}
            <button
              onClick={() => setIsDocumentModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 transition-colors"
              title="Upload PDF, DOCX, or TXT for Document Question Answering"
              id="btn-header-upload-doc"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Doc Q&A</span>
            </button>

            {/* Launch Quiz Button */}
            <button
              onClick={() => launchQuiz()}
              disabled={isGeneratingQuiz || messages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50/70 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-800 text-xs font-semibold rounded border border-emerald-200 transition-colors"
              title="Generate a 5-question mock quiz based on this session"
            >
              {isGeneratingQuiz ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              )}
              <span className="hidden sm:inline">Mock Exam</span>
            </button>

            {/* Launch Summary Sheet Button */}
            <button
              onClick={() => launchSummary()}
              disabled={isGeneratingSummary || messages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 disabled:opacity-40 disabled:cursor-not-allowed text-teal-800 text-xs font-semibold rounded border border-teal-200 transition-colors"
              title="Generate exam revision cheat-sheet and flashcards"
            >
              {isGeneratingSummary ? (
                <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              )}
              <span className="hidden sm:inline">Study Sheet</span>
            </button>

            {/* Clear Chat */}
            {messages.length > 0 && (
              <button
                onClick={clearCurrentConversation}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Clear current messages"
                aria-label="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* New Query */}
            <button
              onClick={() => createNewConversation(selectedBranch)}
              className="p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded transition-colors"
              title="Start brand new inquiry"
              aria-label="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Active Document Grounding Banner */}
        <DocumentBanner />

        {/* Quiz / Exam Generation Progress Banner */}
        {isGeneratingQuiz && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                <strong>Generating Mock Exam:</strong> Curating high-yield questions, options & explanations...
              </span>
            </div>
            <button
              onClick={abortQuizGeneration}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Study Sheet Generation Progress Banner */}
        {isGeneratingSummary && (
          <div className="bg-teal-50/90 border-b border-teal-200 px-4 py-2.5 flex items-center justify-between text-xs text-teal-950 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>
                <strong>Generating Study Sheet:</strong> Extracting core takeaways, formulas & active recall flashcards...
              </span>
            </div>
            <button
              onClick={abortSummaryGeneration}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-100 hover:bg-teal-200 px-2.5 py-1 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Error Alert Bar */}
        {error && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center space-y-7 animate-fadeIn">
              {/* Brand Center Banner */}
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  What concept are we learning today?
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  &ldquo;கற்போம் கற்பிப்போம்&rdquo; · Ask any academic doubt in{" "}
                  <strong className="text-emerald-800">{selectedBranch}</strong>, request step-by-step proofs, or prepare for university finals.
                </p>
              </div>

              {/* Document Q&A Feature Card in Empty State */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-heading">
                      Document-Based Question Answering
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload your lecture PDF, Word doc, or syllabus notes. Karpom AI will strictly ground answers on your material without guessing.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDocumentModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                  id="btn-empty-state-upload-doc"
                >
                  <span>Upload Document</span>
                  <span>→</span>
                </button>
              </div>

              {/* Curated Prompt Cards */}
              <div className="space-y-2 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>High-Yield Academic Queries:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(prompt)}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/30 text-left transition-colors group flex flex-col justify-between"
                    >
                      <span className="text-xs font-medium text-slate-800 group-hover:text-slate-900 leading-snug">
                        {prompt}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold mt-2.5 flex items-center gap-1">
                        <span>Ask this topic</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput />
      </main>

      {/* Quiz Modal */}
      {activeQuizModal && (
        <QuizModal quiz={activeQuizModal} onClose={closeQuizModal} />
      )}

      {/* Summary / Flashcard Modal */}
      {activeSummaryModal && (
        <SummaryModal summary={activeSummaryModal} onClose={closeSummaryModal} />
      )}

      {/* Document Upload & QA Modal */}
      <DocumentUploadModal />
    </div>
  );
};
