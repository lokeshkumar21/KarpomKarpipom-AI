import React, { useState } from "react";
import confetti from "canvas-confetti";
import {
  X,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Sparkles,
  ChevronRight,
  BookOpen,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
} from "lucide-react";
import { QuizData, QuizQuestion, QuizResultSummary } from "../types";
import { useApp } from "../context/AppContext";

interface QuizModalProps {
  quiz: QuizData;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose }) => {
  const { submitQuiz, setCurrentPage } = useApp();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultSummary, setResultSummary] = useState<QuizResultSummary | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "correct" | "incorrect">("all");
  const [startTime] = useState<number>(Date.now());

  const questions: QuizQuestion[] = quiz.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: option,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const timeSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const summary = submitQuiz(quiz, selectedAnswers, timeSpent);
    setResultSummary(summary);
    setIsSubmitted(true);

    if (summary.scorePercentage >= 60) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setCurrentQuestionIndex(0);
    setResultSummary(null);
  };

  const isAllAnswered = questions.length > 0 && questions.every((_, idx) => !!selectedAnswers[idx]);
  const answeredCount = Object.keys(selectedAnswers).length;

  const filteredRecords = resultSummary?.records.filter((rec) => {
    if (filterTab === "correct") return rec.isCorrect;
    if (filterTab === "incorrect") return !rec.isCorrect;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4 sm:my-8 animate-fadeIn"
        id="quiz-modal-card"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base leading-tight">{quiz.topic}</h3>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider">
                  {quiz.difficulty}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {quiz.subject} · {questions.length} Structured Multiple Choice Questions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {!isSubmitted ? (
            <>
              {/* Question Progress Tracker */}
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-emerald-700">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-slate-400">({answeredCount}/{questions.length} answered)</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto py-1">
                  {questions.map((_, idx) => {
                    const isAnswered = !!selectedAnswers[idx];
                    const isCurrent = currentQuestionIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-6 h-6 rounded-md text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-emerald-600 text-white shadow-xs"
                            : isAnswered
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Question Card */}
              {currentQ && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      Level: {currentQ.difficulty || quiz.difficulty}
                    </span>
                  </div>

                  <h4 className="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                    {currentQ.question}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2.5 pt-1">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-xs ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isSelected
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results Screen */
            <div className="space-y-6 animate-fadeIn">
              {/* Score Card */}
              {resultSummary && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <div className="inline-flex p-3.5 rounded-2xl bg-emerald-100 text-emerald-700 shadow-xs">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-900">
                      {resultSummary.scorePercentage}%
                    </h4>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {resultSummary.correctCount} of {resultSummary.totalQuestions} Questions Correct
                    </p>
                  </div>
                  
                  {/* Performance Summary Banner */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed text-left">
                    <p className="font-bold text-emerald-900 mb-0.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Performance Summary</span>
                    </p>
                    <p>{resultSummary.performanceSummary}</p>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterTab === "all"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    All ({resultSummary?.records.length || 0})
                  </button>
                  <button
                    onClick={() => setFilterTab("correct")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      filterTab === "correct"
                        ? "bg-emerald-600 text-white"
                        : "text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct ({resultSummary?.records.filter((r) => r.isCorrect).length || 0})</span>
                  </button>
                  <button
                    onClick={() => setFilterTab("incorrect")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      filterTab === "incorrect"
                        ? "bg-rose-600 text-white"
                        : "text-rose-700 hover:bg-rose-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Incorrect ({resultSummary?.records.filter((r) => !r.isCorrect).length || 0})</span>
                  </button>
                </div>
              </div>

              {/* Review Questions */}
              <div className="space-y-4">
                {filteredRecords.map((rec) => (
                  <div
                    key={rec.questionIndex}
                    className={`p-4 rounded-xl border ${
                      rec.isCorrect
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-rose-200 bg-rose-50/40"
                    } space-y-2.5 text-xs`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-800">
                        Q{rec.questionIndex + 1}: {rec.question}
                      </span>
                      {rec.isCorrect ? (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold shrink-0 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-700 font-bold shrink-0 bg-rose-100 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 space-y-1.5">
                      <p>
                        <span className="font-semibold text-slate-700">Correct Answer:</span>{" "}
                        <strong className="text-slate-900 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          {rec.correctAnswer}
                        </strong>
                      </p>
                      {!rec.isCorrect && (
                        <p>
                          <span className="font-semibold text-rose-700">Your Answer:</span>{" "}
                          <span className="text-rose-900 bg-rose-100/70 px-1.5 py-0.5 rounded line-through">
                            {rec.selectedOption || "Unanswered"}
                          </span>
                        </p>
                      )}
                      
                      <div className="p-3 bg-white rounded-lg border border-slate-200/80 mt-2 text-slate-700 leading-relaxed">
                        <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Detailed Explanation:</span>
                        </p>
                        <p className="text-slate-800">{rec.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={!isAllAnswered}
                    className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg shadow-md transition-all ${
                      isAllAnswered
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit & Score ({answeredCount}/{questions.length})</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between flex-wrap gap-2">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Quiz</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    setCurrentPage("quiz");
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Open Quiz Studio</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
