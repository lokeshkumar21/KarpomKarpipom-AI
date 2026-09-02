import React from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  Heart,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Languages,
  Award,
  Zap,
} from "lucide-react";

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-semibold">
            <span className="text-emerald-700 font-bold">கற்போம் கற்பிப்போம்</span>
            <span className="text-emerald-600">·</span>
            <span>"Let us learn and teach"</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            About KarpomKarpipom AI
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A specialized academic companion built by educators and engineers to help college students understand foundational concepts, solve complex derivations, and conquer exam anxiety.
          </p>
        </div>

        {/* The Meaning of Karpom Karpipom */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">The Peer-Learning Ethos</h2>
              <p className="text-xs text-emerald-600 font-medium">கற்போம் (Let us learn) · கற்பிப்போம் (Let us teach)</p>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
            <p>
              In traditional engineering study circles, the best way to master a tough subject like Signals & Systems, Thermodynamics, or Operating Systems is to learn it thoroughly and then explain it to a classmate.
            </p>
            <p>
              <strong>KarpomKarpipom AI</strong> embodies this exact peer-learning dynamic. It acts as both a patient, world-class professor and a collaborative study buddy who explains concepts until you truly grasp the underlying mathematical and physical intuition.
            </p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Our 4 Pedagogical Pillars
            </h2>
            <p className="text-xs text-slate-500">
              How we approach academic learning differently from generic AI models.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">1. First-Principles Reasoning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We avoid rote memorization shortcuts. Every equation is broken down from fundamental physical laws (conservation of mass, energy, momentum, or Boolean algebra) with clear step-by-step proofs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">2. Active Recall & Exam Simulation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Reading notes is passive. KarpomKarpipom AI actively turns your conversations into 5-question mock tests, formula cheat sheets, and flashcards to lock knowledge in long-term memory.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">3. Physical & Practical Analogies</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Abstract concepts become clear when grounded in real-world systems — comparing virtual memory paging to a library desk, or Fourier transforms to separating musical chords.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">4. Linguistic Accessibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Technical brilliance shouldn't be gated by English fluency. Students can explore explanations in pure English, Tanglish (Tamil + English mixture), or Tamil, preserving technical terminology.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <h3 className="text-2xl font-black">Ready to master your engineering syllabus?</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Experience step-by-step academic explanations and practice quizzes with zero setup.
          </p>
          <button
            onClick={() => setCurrentPage("chat")}
            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all group"
          >
            <span>Open AI Tutor Now</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
