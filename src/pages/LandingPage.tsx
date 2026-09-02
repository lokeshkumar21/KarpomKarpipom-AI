import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Layers,
  Award,
  Zap,
  HelpCircle,
  Code,
  Languages,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  Flame,
  User,
  Loader2,
} from "lucide-react";
import { EngineeringBranch } from "../types";

export const LandingPage: React.FC = () => {
  const {
    setCurrentPage,
    setSelectedBranch,
    createNewConversation,
    sendMessage,
    loginAsGuestUser,
    isAuthenticated,
    isGuest,
    user,
    isAuthLoading,
  } = useApp();
  const [activeTabBranch, setActiveTabBranch] = useState<EngineeringBranch>("Computer Science & AI");

  const engineeringDomains: { branch: EngineeringBranch; icon: string; samplePrompt: string; snippet: string }[] = [
    {
      branch: "Computer Science & AI",
      icon: "💻",
      samplePrompt: "Explain the Transformer Self-Attention mechanism with matrix dimensions",
      snippet: "Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k)) V. Let's break down query, key, value projection matrices step-by-step...",
    },
    {
      branch: "Electronics & Communication",
      icon: "📡",
      samplePrompt: "Derive the Cooley-Tukey Radix-2 FFT butterfly computation",
      snippet: "DFT complexity drops from O(N^2) to O(N log N) by decomposing into even and odd index sub-transforms with twiddle factors W_N^k...",
    },
    {
      branch: "Electrical & Electronics",
      icon: "⚡",
      samplePrompt: "Explain Three-Phase induction motor torque-slip characteristics",
      snippet: "Starting torque, maximum breakdown torque, and slip relationship derived from the equivalent rotor circuit impedance...",
    },
    {
      branch: "Mechanical & Robotics",
      icon: "⚙️",
      samplePrompt: "Step-by-step derivation of Bernoulli's equation from Euler's equation",
      snippet: "Integrating Euler's equation along a streamline for steady, incompressible, inviscid flow: P/ρ + v^2/2 + gz = Constant...",
    },
    {
      branch: "Engineering Mathematics",
      icon: "📐",
      samplePrompt: "Geometric intuition of Eigenvalues and Eigenvectors in linear transformations",
      snippet: "A v = λ v. Eigenvectors represent the invariant directional axes where transformation behaves as pure scalar scaling...",
    },
  ];

  const handleStartWithPrompt = (branch: EngineeringBranch, prompt: string) => {
    setSelectedBranch(branch);
    if (!isAuthenticated && !isGuest) {
      loginAsGuestUser();
    }
    const newConv = createNewConversation(branch, prompt.slice(0, 36) + "...");
    setCurrentPage("chat");
    setTimeout(() => {
      sendMessage(prompt);
    }, 100);
  };

  const handleGuestContinue = () => {
    loginAsGuestUser();
    setCurrentPage("chat");
  };

  const currentDomainData = engineeringDomains.find((d) => d.branch === activeTabBranch) || engineeringDomains[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs">
              <span className="text-emerald-800 font-bold">கற்போம் கற்பிப்போம்</span>
              <span className="text-emerald-400">·</span>
              <span className="text-slate-700 italic">"Learn. Ask. Understand."</span>
            </div>

            {/* Brand Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-serif">
                KarpomKarpipom <span className="text-emerald-700">AI</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl font-medium text-emerald-800 tracking-tight">
                AI-Powered Conversational Educational Assistant
              </p>
            </div>

            {/* Short Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Your AI-powered learning companion for programming, technology, academics, and everyday questions. Master step-by-step derivations, clarify doubts from first principles, and generate practice assessments.
            </p>

            {/* Dynamic Action Area according to Session State */}
            {isAuthLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500 font-medium animate-pulse">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Checking authentication session...</span>
              </div>
            ) : isAuthenticated && !isGuest && user ? (
              /* Authenticated Scholar Hero Experience */
              <div className="pt-2 max-w-xl mx-auto space-y-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left shadow-2xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                        {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          Welcome back, {user.displayName || user.name || "Scholar"}!
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {user.branch} · {user.college || "Engineering College"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100/80 border border-amber-300 rounded-md text-amber-900 text-xs font-bold">
                      <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                      <span>{user.streakDays || 1}d Streak</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="landing-authenticated-chat-btn"
                    onClick={() => setCurrentPage("chat")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open AI Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="landing-authenticated-dashboard-btn"
                    onClick={() => setCurrentPage("dashboard")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Student Dashboard</span>
                  </button>

                  <button
                    id="landing-authenticated-quiz-btn"
                    onClick={() => setCurrentPage("quiz")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Quiz Studio</span>
                  </button>
                </div>
              </div>
            ) : isGuest ? (
              /* Guest Scholar Hero Experience */
              <div className="pt-2 max-w-xl mx-auto space-y-4">
                <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white text-slate-700 text-xs font-semibold border border-slate-200">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Active Guest Session</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    You are exploring in guest mode. Create an account to permanently sync conversations across devices.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="landing-guest-resume-chat-btn"
                    onClick={() => setCurrentPage("chat")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Continue in AI Tutor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="landing-guest-upgrade-btn"
                    onClick={() => setCurrentPage("signup")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>Create Account to Save</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Unauthenticated Primary Action Buttons */
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  id="landing-create-account-btn"
                  onClick={() => setCurrentPage("signup")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  id="landing-login-btn"
                  onClick={() => setCurrentPage("login")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Log In</span>
                </button>

                <button
                  id="landing-guest-btn"
                  onClick={handleGuestContinue}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  <span>Continue as Guest</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            {/* Trust Badges */}
            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No hardcoded accounts</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Private user data isolation</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Firebase Authentication ready</span>
              </span>
            </div>
          </div>

          {/* Interactive AI Preview Card */}
          <div className="mt-10 max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Domain Tabs */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-slate-300 overflow-x-auto border-b border-slate-800 text-xs custom-scrollbar">
              <span className="text-[11px] font-semibold text-emerald-400 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discipline:</span>
              </span>
              {engineeringDomains.map((d) => (
                <button
                  key={d.branch}
                  onClick={() => setActiveTabBranch(d.branch)}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeTabBranch === d.branch
                      ? "bg-slate-800 text-emerald-400 border border-slate-700 font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.branch.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Interactive Preview Body */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0">
                  Q
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Student Doubt · {currentDomainData.branch}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    "{currentDomainData.samplePrompt}"
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    AI
                  </div>
                  <span className="text-xs font-semibold text-slate-900">
                    Step-by-Step Mathematical Derivation:
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-mono leading-relaxed pl-7">
                  {currentDomainData.snippet}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-500">
                  Explore full derivations and interactive simulations directly in the tutor workspace.
                </p>
                <button
                  onClick={() => handleStartWithPrompt(currentDomainData.branch, currentDomainData.samplePrompt)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors group"
                >
                  <span>Ask in AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Academic Features Section */}
      <section id="features-section" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold uppercase tracking-wider rounded-md">
              Engineered for Engineering Curriculum
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-serif">
              First-Principles Pedagogy
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Unlike generic assistants, KarpomKarpipom AI is calibrated specifically for university syllabus standards, university exam formats (2-mark definitions & 16-mark derivations), and active recall.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 font-serif">Step-by-Step Derivations</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive rigorous mathematical proofs with explicit boundary conditions and step-by-step algebraic transformations.
              </p>
            </div>

            {/* Feature 2: Quiz Generator */}
            <div
              onClick={() => setCurrentPage("quiz")}
              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2.5 cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors font-serif">
                Exam & Viva Practice Generator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generate structured, schema-validated multiple choice assessments with customized difficulties, instant scoring, and step explanations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 font-serif">Intuitive Physical Analogies</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grasp abstract concepts like Virtual Memory, Quantum Tunneling, or Fourier Analysis using physical intuition before complex equations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
                <Code className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 font-serif">Algorithm Proofs & Big-O</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Production-ready implementations in C++, Python, or Java with memory state dry-runs, edge-case analysis, and time complexity proofs.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2.5 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                <Languages className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900 font-serif">Multilingual & Tanglish Mode</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive explanations in English, Tanglish (Tamil + English), or Tamil with rigorous preservation of technical engineering terms.
              </p>
            </div>

            {/* Feature 6: Dashboard */}
            <div
              onClick={() => setCurrentPage("dashboard")}
              className="p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors space-y-2.5 cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h3 className="font-semibold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors font-serif">
                Real-Time Student Dashboard
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monitor learning activity timelines, questions asked, quiz accuracy, and recently mastered engineering topics backed by secure Firestore persistence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-slate-900 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="px-2.5 py-0.5 bg-slate-800 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider rounded-md border border-slate-700">
              Three-Step Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
              From Inquiry to Exam Mastery
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A structured workflow designed for rapid comprehension and durable retention.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative">
              <span className="w-7 h-7 rounded-md bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h3 className="font-semibold text-base text-white font-serif">Submit Your Inquiry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type your doubt, upload circuit/diagram screenshots, or dictate voice questions with your target branch and year of study.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative">
              <span className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h3 className="font-semibold text-base text-white font-serif">First-Principles Derivations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The AI processes your query server-side, returning LaTeX mathematical proofs, step justifications, and intuitive physical analogies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 relative">
              <span className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 text-teal-400 font-mono font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h3 className="font-semibold text-base text-white font-serif">Solidify & Assess</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an interactive 5-question practice quiz, analyze common exam traps, and review flashcard summaries to ensure readiness.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated && !isGuest ? (
              <>
                <button
                  id="landing-bottom-auth-chat-btn"
                  onClick={() => setCurrentPage("chat")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Resume in AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="landing-bottom-auth-dashboard-btn"
                  onClick={() => setCurrentPage("dashboard")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Student Dashboard</span>
                </button>
              </>
            ) : isGuest ? (
              <>
                <button
                  id="landing-bottom-guest-chat-btn"
                  onClick={() => setCurrentPage("chat")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Continue in AI Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="landing-bottom-guest-signup-btn"
                  onClick={() => setCurrentPage("signup")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>Create Account to Save</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  id="landing-bottom-signup-btn"
                  onClick={() => setCurrentPage("signup")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  id="landing-bottom-guest-btn"
                  onClick={handleGuestContinue}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span>Try as Guest</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
