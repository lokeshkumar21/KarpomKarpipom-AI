import React from "react";
import { useApp } from "../context/AppContext";
import { GraduationCap, Heart, Sparkles, BookOpen, Compass, Code, ShieldCheck } from "lucide-react";
import { EngineeringBranch } from "../types";

export const Footer: React.FC = () => {
  const { setCurrentPage, setSelectedBranch, createNewConversation } = useApp();

  const engineeringDomains: EngineeringBranch[] = [
    "Computer Science & AI",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical & Robotics",
    "Civil & Structural",
    "Engineering Mathematics",
  ];

  const handleDomainClick = (branch: EngineeringBranch) => {
    setSelectedBranch(branch);
    createNewConversation(branch, `${branch} Inquiries`);
    setCurrentPage("chat");
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Philosophy */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">
                KarpomKarpipom <span className="text-emerald-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              &ldquo;கற்போம் கற்பிப்போம்&rdquo; — <em>Let us learn and teach</em>.
              Empowering college & engineering students worldwide to master complex concepts through first-principles reasoning and step-by-step clarity.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Server-Side Gemini AI</span>
            </div>
          </div>

          {/* Column 2: Engineering Disciplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Disciplines</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {engineeringDomains.map((domain) => (
                <li key={domain}>
                  <button
                    onClick={() => handleDomainClick(domain)}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {domain}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Academic Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Study Capabilities</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setCurrentPage("chat")} className="hover:text-emerald-400">
                  Step-by-Step Derivation Engine
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("chat")} className="hover:text-emerald-400">
                  Mock Exam & Viva Practice Generator
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("chat")} className="hover:text-emerald-400">
                  Intuitive Real-World Analogies
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("chat")} className="hover:text-emerald-400">
                  Algorithmic Dry-Run & Complexity
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("chat")} className="hover:text-emerald-400">
                  Multilingual / Tanglish Explanations
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Links & Mission */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-amber-400" />
              <span>About Platform</span>
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setCurrentPage("about")} className="hover:text-emerald-400">
                  Our Mission & Pedagogy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("history")} className="hover:text-emerald-400">
                  Saved Notes & History
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("settings")} className="hover:text-emerald-400">
                  AI Model & Language Preferences
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage("profile")} className="hover:text-emerald-400">
                  Student Progress & Mastery
                </button>
              </li>
            </ul>
            <div className="pt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Firebase Auth & Firestore Architecture Ready</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-800 my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} KarpomKarpipom AI. Built for engineering and college scholars.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for curious minds worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
