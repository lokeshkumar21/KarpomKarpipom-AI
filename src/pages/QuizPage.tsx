import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Timer,
  BarChart3,
  HelpCircle,
  Layers,
  Flame,
  Clock,
  Trash2,
  PlusCircle,
  MessageSquare,
  Copy,
  Check,
  Zap,
  Filter,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  EngineeringBranch,
  QuizData,
  QuizDifficulty,
  QuizQuestion,
  QuizResultSummary,
} from "../types";

const SUBJECT_OPTIONS: { name: string; branch: EngineeringBranch; icon: string; popularTopics: string[] }[] = [
  {
    name: "Computer Science & AI",
    branch: "Computer Science & AI",
    icon: "💻",
    popularTopics: [
      "Transformer Self-Attention & LLM Architecture",
      "Dynamic Programming & Bellman Equations",
      "Operating Systems Deadlocks & Banker's Algorithm",
      "B-Trees, B+ Trees & Database Indexing",
      "TCP/IP Flow Control & Congestion Management",
    ],
  },
  {
    name: "Electronics & Communication",
    branch: "Electronics & Communication",
    icon: "📡",
    popularTopics: [
      "Fast Fourier Transform (FFT) & Butterfly Computation",
      "MOSFET Small-Signal High-Frequency Model",
      "Phase-Locked Loops (PLL) & Frequency Synthesizers",
      "Smith Chart Transmission Line Impedance Matching",
      "Shannon Channel Capacity & QAM Modulation",
    ],
  },
  {
    name: "Electrical & Electronics",
    branch: "Electrical & Electronics",
    icon: "⚡",
    popularTopics: [
      "Three-Phase Induction Motor Torque-Slip Characteristics",
      "Synchronous Generator Power-Angle Curve & Stability",
      "Buck-Boost Converter State Space Averaging",
      "Symmetrical Components & Fault Analysis",
      "Kirchhoff's Laws & Thevenin Norton Equivalents",
    ],
  },
  {
    name: "Mechanical & Robotics",
    branch: "Mechanical & Robotics",
    icon: "⚙️",
    popularTopics: [
      "Bernoulli & Navier-Stokes Fluid Flow Derivations",
      "Rankine & Brayton Thermodynamic Power Cycles",
      "Mohr's Circle & Principal Stress Tensors",
      "Robotic Denavit-Hartenberg (DH) Parameters",
      "Finite Element Analysis (FEA) Stiffness Matrix",
    ],
  },
  {
    name: "Engineering Mathematics",
    branch: "Engineering Mathematics",
    icon: "📐",
    popularTopics: [
      "Eigenvalues, Eigenvectors & Spectral Theorem",
      "Cauchy Integral Formula & Residue Theorem",
      "Fourier Series & Boundary Value PDE Problems",
      "Laplace Transforms & Transfer Functions",
      "Probability Distributions & Bayes Theorem",
    ],
  },
];

const DIFFICULTY_CONFIG: Record<
  QuizDifficulty,
  { label: string; desc: string; color: string; bg: string; border: string }
> = {
  Easy: {
    label: "Easy",
    desc: "Foundational definitions, standard formula recall, and basic conceptual checks",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  Medium: {
    label: "Medium",
    desc: "University semester final questions, analytical calculations, and multi-step derivations",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Hard: {
    label: "Hard",
    desc: "GATE / Competitive exam tier, subtle boundary conditions, and complex numerical traps",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

export const QuizPage: React.FC = () => {
  const {
    selectedBranch,
    setSelectedBranch,
    generateQuiz,
    abortQuizGeneration,
    submitQuiz,
    isGeneratingQuiz,
    quizHistory,
    deleteQuizResult,
    setCurrentPage,
    createNewConversation,
    sendMessage,
  } = useApp();

  // Mode: "config" | "active" | "results" | "history"
  const [viewMode, setViewMode] = useState<"config" | "active" | "results" | "history">("config");

  // Config Form State
  const [selectedSubject, setSelectedSubject] = useState<string>(selectedBranch || "Computer Science & AI");
  const [customSubject, setCustomSubject] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("Medium");
  const [formError, setFormError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // Results State
  const [currentResult, setCurrentResult] = useState<QuizResultSummary | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "correct" | "incorrect">("all");
  const [copied, setCopied] = useState<boolean>(false);

  // Timer Effect during Active Quiz
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (viewMode === "active") {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [viewMode]);

  // Keyboard navigation for active quiz
  useEffect(() => {
    if (viewMode !== "active" || !activeQuiz) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const q = activeQuiz.questions[currentQuestionIndex];
      if (!q) return;

      // 1-4 or A-D selection
      if (["1", "2", "3", "4"].includes(e.key)) {
        const optIdx = parseInt(e.key, 10) - 1;
        if (q.options[optIdx]) {
          setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: q.options[optIdx] }));
        }
      } else if (["a", "b", "c", "d"].includes(e.key.toLowerCase())) {
        const optIdx = e.key.toLowerCase().charCodeAt(0) - 97;
        if (q.options[optIdx]) {
          setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: q.options[optIdx] }));
        }
      } else if (e.key === "ArrowRight") {
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      } else if (e.key === "ArrowLeft") {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeQuiz, currentQuestionIndex]);

  const currentSubjectMeta =
    SUBJECT_OPTIONS.find((s) => s.name === selectedSubject) || SUBJECT_OPTIONS[0];

  // Handle Generate Quiz
  const handleStartGeneration = async () => {
    const finalTopic = topic.trim();
    if (!finalTopic) {
      setFormError("Please enter or select a topic to test.");
      return;
    }

    setFormError(null);
    const effectiveSubject = customSubject.trim() || selectedSubject;

    try {
      const quiz = await generateQuiz({
        subject: effectiveSubject,
        topic: finalTopic,
        numQuestions,
        difficulty,
      });

      setActiveQuiz(quiz);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setStartTime(Date.now());
      setElapsedSeconds(0);
      setViewMode("active");
    } catch (err: any) {
      setFormError(err.message || "Failed to generate quiz. Please check topic or connection.");
    }
  };

  // Handle Option Select
  const handleOptionSelect = (optionText: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionText,
    }));
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;
    const timeSpent = Math.max(1, elapsedSeconds);
    const summary = submitQuiz(activeQuiz, selectedAnswers, timeSpent);
    setCurrentResult(summary);
    setViewMode("results");
    setShowConfirmSubmit(false);

    if (summary.scorePercentage >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Retake Active Quiz
  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setElapsedSeconds(0);
    setViewMode("active");
  };

  // Ask AI in Chat about a missed question
  const handleAskAITutor = (qRecord: { question: string; explanation: string; correctAnswer: string; selectedOption: string }) => {
    const prompt = `I was practicing a quiz on "${activeQuiz?.topic || currentResult?.topic || "Engineering"}" and need help understanding this question:

Question: ${qRecord.question}
Correct Answer: ${qRecord.correctAnswer}
My Choice: ${qRecord.selectedOption || "None"}

Explanation provided: ${qRecord.explanation}

Can you please explain from first principles why the correct answer is right and why my choice was wrong? Walk me through any relevant mathematical derivations or physical intuitions.`;

    const branch = (currentResult?.subject as EngineeringBranch) || selectedBranch;
    createNewConversation(branch, `Quiz Review: ${qRecord.question.slice(0, 30)}...`);
    setCurrentPage("chat");
    setTimeout(() => {
      sendMessage(prompt);
    }, 150);
  };

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    if (!currentResult) return;
    const text = `KarpomKarpipom AI Practice Quiz Summary
Topic: ${currentResult.topic} (${currentResult.subject})
Difficulty: ${currentResult.difficulty}
Score: ${currentResult.scorePercentage}% (${currentResult.correctCount}/${currentResult.totalQuestions} Correct)
Time Spent: ${Math.floor(currentResult.timeSpentSeconds / 60)}m ${currentResult.timeSpentSeconds % 60}s

Performance Summary:
${currentResult.performanceSummary}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 pb-16">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight font-heading">
                  Karpom AI Quiz Generator
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                  Schema-Validated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Structured assessments with verified step-by-step solutions
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("config")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === "config"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Quiz</span>
            </button>

            {currentResult && (
              <button
                onClick={() => setViewMode("results")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  viewMode === "results"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Latest Result</span>
              </button>
            )}

            <button
              onClick={() => setViewMode("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === "history"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>History ({quizHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* =========================================================================
            1. QUIZ CONFIGURATOR VIEW
        ========================================================================= */}
        {viewMode === "config" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="p-6 sm:p-7 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-xs relative overflow-hidden">
              <div className="relative z-10 space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 text-xs font-semibold border border-emerald-800/60">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Structured Exam Simulation Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
                  Design Your Customized Academic Assessment
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Select your engineering discipline, enter any concept or theorem, choose target difficulty, and get a structured, exam-grade assessment with step-by-step solutions.
                </p>
              </div>
            </div>

            {/* Config Form Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-xs text-rose-900 animate-fadeIn">
                  <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Select Subject */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>1. Select Subject / Engineering Discipline</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    {selectedSubject}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {SUBJECT_OPTIONS.map((sub) => {
                    const isSelected = selectedSubject === sub.name && !customSubject;
                    return (
                      <button
                        key={sub.name}
                        onClick={() => {
                          setSelectedSubject(sub.name);
                          setSelectedBranch(sub.branch);
                          setCustomSubject("");
                        }}
                        className={`p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
                          isSelected
                            ? "border-emerald-700 bg-emerald-50/70 shadow-2xs text-emerald-950"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-lg">{sub.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate font-heading">{sub.name}</p>
                          <p className="text-[10px] text-slate-500">Curated syllabus</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Subject Option */}
                <div className="pt-1">
                  <input
                    type="text"
                    placeholder="Or enter a custom domain (e.g., Aerospace, Bio-Informatics, Chemical)..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors"
                  />
                </div>
              </div>

              {/* Step 2: Topic Input & Popular Quick-Pills */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  2. Academic Topic or Concept
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Radix-2 FFT Butterfly, Operating Systems Paging, Navier Stokes Equation..."
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors font-medium"
                  />
                  {topic && (
                    <button
                      onClick={() => setTopic("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Selection Topic Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Recommended topics in {currentSubjectMeta.name}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubjectMeta.popularTopics.map((pt) => (
                      <button
                        key={pt}
                        onClick={() => setTopic(pt)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors text-left ${
                          topic === pt
                            ? "bg-emerald-800 text-white font-semibold shadow-xs"
                            : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Difficulty & Number of Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                {/* Difficulty Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    3. Target Difficulty Tier
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {(["Easy", "Medium", "Hard"] as QuizDifficulty[]).map((level) => {
                      const cfg = DIFFICULTY_CONFIG[level];
                      const isSelected = difficulty === level;
                      return (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`p-2.5 rounded-lg border text-center transition-colors ${
                            isSelected
                              ? `${cfg.bg} ${cfg.border} shadow-xs`
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <p className={`text-xs font-bold font-heading ${isSelected ? cfg.color : "text-slate-800"}`}>
                            {level}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {level === "Easy" ? "Basics" : level === "Medium" ? "Sem Final" : "GATE Tier"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {DIFFICULTY_CONFIG[difficulty].desc}
                  </p>
                </div>

                {/* Number of Questions */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                    <span>4. Question Count</span>
                    <span className="text-xs font-bold text-emerald-800">{numQuestions} Questions</span>
                  </label>

                  <div className="grid grid-cols-5 gap-2">
                    {[3, 5, 10, 15, 20].map((num) => {
                      const isSelected = numQuestions === num;
                      return (
                        <button
                          key={num}
                          onClick={() => setNumQuestions(num)}
                          className={`py-2.5 rounded-lg border text-center font-bold text-xs transition-colors ${
                            isSelected
                              ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Standard recommended session length: 5 to 10 questions.
                  </p>
                </div>
              </div>

              {/* Generate Assessment CTA */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Strict schema validation · Instant scoring · Verified derivations</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {isGeneratingQuiz && (
                    <button
                      type="button"
                      onClick={abortQuizGeneration}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleStartGeneration}
                    disabled={isGeneratingQuiz}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors group"
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating Assessment...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate Quiz Assessment</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. ACTIVE QUIZ ASSESSMENT VIEW
        ========================================================================= */}
        {viewMode === "active" && activeQuiz && (
          <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
            {/* Sticky Assessment Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 font-heading">{activeQuiz.topic}</h2>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      DIFFICULTY_CONFIG[activeQuiz.difficulty]?.bg
                    } ${DIFFICULTY_CONFIG[activeQuiz.difficulty]?.color} border ${
                      DIFFICULTY_CONFIG[activeQuiz.difficulty]?.border
                    }`}
                  >
                    {activeQuiz.difficulty}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{activeQuiz.subject}</p>
              </div>

              {/* Timer and Progress */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-emerald-800" />
                  <span>{formatTime(elapsedSeconds)}</span>
                </div>

                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  Submit Quiz
                </button>
              </div>
            </div>

            {/* Question Navigation Palette */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2.5">
                <span className="font-semibold text-slate-800">
                  Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                </span>
                <span className="text-slate-500">
                  {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length} answered
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {activeQuiz.questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isCurrent = currentQuestionIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                        isCurrent
                          ? "bg-slate-900 text-white shadow-xs"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Main Card */}
            {activeQuiz.questions[currentQuestionIndex] && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span className="font-bold text-emerald-800 font-heading">
                    Question #{currentQuestionIndex + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    Level: {activeQuiz.questions[currentQuestionIndex].difficulty || activeQuiz.difficulty}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-heading">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h3>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5 pt-1">
                  {activeQuiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionSelect(opt)}
                        className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm transition-colors flex items-center justify-between group ${
                          isSelected
                            ? "border-emerald-700 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected
                                ? "bg-emerald-800 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            {letter}
                          </span>
                          <span className="leading-relaxed break-words">{opt}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowConfirmSubmit(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finish & Submit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Submit Modal */}
            {showConfirmSubmit && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-fadeIn">
                  <h4 className="text-base font-bold text-slate-900 font-heading">Submit Assessment?</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You have answered{" "}
                    <strong>
                      {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length}
                    </strong>{" "}
                    questions in <strong>{formatTime(elapsedSeconds)}</strong>. Unanswered questions will be scored as incorrect.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowConfirmSubmit(false)}
                      className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Return to Test
                    </button>
                    <button
                      onClick={handleSubmitQuiz}
                      className="flex-1 px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Yes, Score My Quiz
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            3. POST-SUBMISSION RESULTS & COMPREHENSIVE PERFORMANCE SUMMARY
        ========================================================================= */}
        {viewMode === "results" && currentResult && (
          <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
            {/* Score & Master Performance Banner */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900">
                      {currentResult.difficulty} Tier
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">{currentResult.subject}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 font-heading">{currentResult.topic}</h2>
                  <p className="text-xs text-slate-500">
                    Completed in {Math.floor(currentResult.timeSpentSeconds / 60)}m {currentResult.timeSpentSeconds % 60}s
                  </p>
                </div>

                {/* Big Score Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3.5 min-w-[170px]">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg text-white shadow-xs ${
                      currentResult.scorePercentage >= 80
                        ? "bg-emerald-800"
                        : currentResult.scorePercentage >= 50
                        ? "bg-amber-700"
                        : "bg-rose-700"
                    }`}
                  >
                    {currentResult.scorePercentage}%
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Total Score</p>
                    <p className="text-sm font-bold text-slate-900 font-heading">
                      {currentResult.correctCount} / {currentResult.totalQuestions} Correct
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Performance Summary */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5 font-heading">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>AI Learning Performance Summary</span>
                </h4>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {currentResult.performanceSummary}
                </p>
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetake}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                  <button
                    onClick={handleCopySummary}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Summary"}</span>
                  </button>
                </div>

                <button
                  onClick={() => setViewMode("config")}
                  className="px-4 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Assessment</span>
                </button>
              </div>
            </div>

            {/* Answer Key & Step-by-Step Explanations */}
            <div className="space-y-3.5">
              {/* Filter Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterTab("all")}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      filterTab === "all"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All ({currentResult.records.length})
                  </button>
                  <button
                    onClick={() => setFilterTab("correct")}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      filterTab === "correct"
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Correct ({currentResult.records.filter((r) => r.isCorrect).length})</span>
                  </button>
                  <button
                    onClick={() => setFilterTab("incorrect")}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      filterTab === "incorrect"
                        ? "bg-rose-800 text-white shadow-xs"
                        : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Incorrect ({currentResult.records.filter((r) => !r.isCorrect).length})</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {currentResult.records
                .filter((r) => {
                  if (filterTab === "correct") return r.isCorrect;
                  if (filterTab === "incorrect") return !r.isCorrect;
                  return true;
                })
                .map((rec) => (
                  <div
                    key={rec.questionIndex}
                    className={`bg-white rounded-xl border p-5 space-y-3.5 shadow-xs transition-colors ${
                      rec.isCorrect
                        ? "border-emerald-200 bg-emerald-50/15"
                        : "border-rose-200 bg-rose-50/15"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 font-heading">
                          Question #{rec.questionIndex + 1}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug font-heading">
                          {rec.question}
                        </h4>
                      </div>
                      {rec.isCorrect ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded text-xs font-bold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Correct</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-900 rounded text-xs font-bold shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>Incorrect</span>
                        </span>
                      )}
                    </div>

                    {/* Answers Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                          Correct Answer
                        </span>
                        <p className="text-xs font-bold text-emerald-950">{rec.correctAnswer}</p>
                      </div>

                      <div
                        className={`p-3 rounded-lg border space-y-1 ${
                          rec.isCorrect
                            ? "bg-emerald-50/30 border-emerald-200 text-emerald-950"
                            : "bg-rose-50/60 border-rose-200 text-rose-950"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            rec.isCorrect ? "text-emerald-800" : "text-rose-800"
                          }`}
                        >
                          Your Selection
                        </span>
                        <p className="text-xs font-bold">
                          {rec.selectedOption || "Unanswered (Skipped)"}
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Explanation */}
                    <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-heading">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Step-by-Step Explanation & Derivation Key:</span>
                      </h5>
                      <p className="text-xs text-slate-700 leading-relaxed">{rec.explanation}</p>
                    </div>

                    {/* Ask AI in Chat Deep-Dive CTA */}
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleAskAITutor(rec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Deep-Dive with AI Tutor in Chat</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            4. ASSESSMENT HISTORY LOG
        ========================================================================= */}
        {viewMode === "history" && (
          <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-heading">Your Assessment History</h2>
                <p className="text-xs text-slate-500">
                  Track your mastery scores and review past practice assessments
                </p>
              </div>
              <button
                onClick={() => setViewMode("config")}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Quiz</span>
              </button>
            </div>

            {quizHistory.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-slate-800 font-heading">No Assessment History Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Take your first practice quiz on any academic topic to track your performance and mastery scores.
                </p>
                <button
                  onClick={() => setViewMode("config")}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Generate First Quiz
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quizHistory.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 font-heading">
                        {item.topic}
                      </h4>
                      <p className="text-xs text-slate-500">{item.subject}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-base font-bold font-heading ${
                            item.scorePercentage >= 80
                              ? "text-emerald-800"
                              : item.scorePercentage >= 50
                              ? "text-amber-800"
                              : "text-rose-800"
                          }`}
                        >
                          {item.scorePercentage}%
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({item.correctCount}/{item.totalQuestions})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentResult(item);
                            setViewMode("results");
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
                        >
                          View Solutions
                        </button>
                        <button
                          onClick={() => deleteQuizResult(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 rounded transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
