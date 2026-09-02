import React, { useState } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  Layers,
  AlertTriangle,
  Copy,
  Check,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { SummaryData } from "../types";

interface SummaryModalProps {
  summary: SummaryData;
  onClose: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ summary, onClose }) => {
  const [activeTab, setActiveTab] = useState<"cheatSheet" | "flashcards">("cheatSheet");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  const flashcards = summary.flashcards || [];
  const currentCard = flashcards[flashcardIndex];

  const handleNextCard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleCopyNotes = () => {
    const md = `# ${summary.title} - Academic Study Sheet\n\n## 1-Minute Summary\n${summary.oneMinuteSummary}\n\n## Key Formulas\n${(summary.keyFormulas || []).map((f) => `- **${f.name}**: \`${f.equation}\` (${f.meaning})`).join("\n")}\n\n## Core Takeaways\n${(summary.coreTakeaways || []).map((t) => `- ${t}`).join("\n")}\n\n## Common Exam Mistakes\n${(summary.commonExamMistakes || []).map((m) => `- ⚠️ ${m}`).join("\n")}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">{summary.title || "Academic Study Sheet"}</h3>
              <p className="text-xs text-teal-100">Exam Revision · Key Formulas · Active Recall</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNotes}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
              title="Copy notes in Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Export Markdown"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-4">
          <button
            onClick={() => setActiveTab("cheatSheet")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "cheatSheet"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Revision Cheat Sheet</span>
          </button>

          {flashcards.length > 0 && (
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "flashcards"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Interactive Flashcards ({flashcards.length})</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {activeTab === "cheatSheet" ? (
            <div className="space-y-6">
              {/* 1-Minute Executive Summary */}
              {summary.oneMinuteSummary && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1-Minute Core Summary</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                    {summary.oneMinuteSummary}
                  </p>
                </div>
              )}

              {/* Key Formulas */}
              {summary.keyFormulas && summary.keyFormulas.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>Essential Formulas to Memorize</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {summary.keyFormulas.map((formula, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                      >
                        <p className="text-xs font-bold text-slate-800">{formula.name}</p>
                        <p className="font-mono text-xs font-semibold text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-100">
                          {formula.equation}
                        </p>
                        <p className="text-[11px] text-slate-500">{formula.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Takeaways */}
              {summary.coreTakeaways && summary.coreTakeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    High-Yield Exam Takeaways
                  </h4>
                  <ul className="space-y-1.5">
                    {summary.coreTakeaways.map((point, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Common Pitfalls & Exam Mistakes */}
              {summary.commonExamMistakes && summary.commonExamMistakes.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Frequent Exam Pitfalls & Traps</span>
                  </h4>
                  <ul className="space-y-1">
                    {summary.commonExamMistakes.map((mistake, idx) => (
                      <li key={idx} className="text-xs text-amber-950 flex items-start gap-2">
                        <span className="font-bold text-amber-600">⚠️</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Flashcards Mode */
            <div className="space-y-6">
              <div className="text-center text-xs text-slate-500">
                Card {flashcardIndex + 1} of {flashcards.length} · Click card to flip
              </div>

              {/* Interactive Flashcard */}
              {currentCard && (
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="min-h-[220px] p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white cursor-pointer shadow-lg border border-slate-700 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.01] select-none relative group"
                >
                  <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                    {isFlipped ? "Answer / Derivation" : "Concept / Question"}
                  </span>
                  <RotateCw className="w-4 h-4 text-slate-400 absolute top-4 right-4 group-hover:rotate-180 transition-transform duration-300" />

                  <p className="text-base sm:text-lg font-semibold leading-relaxed px-4">
                    {isFlipped ? currentCard.back : currentCard.front}
                  </p>

                  <span className="mt-4 text-[11px] text-slate-400">
                    {isFlipped ? "Tap to view question" : "Tap to reveal answer"}
                  </span>
                </div>
              )}

              {/* Flashcard Controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevCard}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200"
                >
                  Flip Card
                </button>
                <button
                  onClick={handleNextCard}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Done & Return
          </button>
        </div>
      </div>
    </div>
  );
};
