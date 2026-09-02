import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Settings,
  ShieldCheck,
  Languages,
  BookOpen,
  Volume2,
  Database,
  Download,
  Trash2,
  Check,
  Layers,
  Sparkles,
  Server,
  LogOut,
  User,
} from "lucide-react";
import { EngineeringBranch, ExplanationLanguage, StudyMode } from "../types";
import { storageService } from "../services/storageService";

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, conversations, user, logoutUser, setCurrentPage } = useApp();
  const [savedBanner, setSavedBanner] = useState(false);

  const engineeringBranches: EngineeringBranch[] = [
    "Computer Science & AI",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical & Robotics",
    "Civil & Structural",
    "Biotech & Chemical",
    "Engineering Mathematics",
    "Applied Physics & Chemistry",
    "General Engineering",
  ];

  const handleUpdate = (newPartial: Partial<typeof settings>) => {
    updateSettings(newPartial);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleExportData = () => {
    const backup = {
      settings,
      conversations,
      exportedAt: new Date().toISOString(),
      platform: "KarpomKarpipom AI",
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karpom-karpipom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all local conversations and reset settings?")) {
      storageService.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                App & AI Preferences
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Customize your learning pedagogy, language settings, and AI reasoning depth.
            </p>
          </div>

          {savedBanner && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold animate-fadeIn">
              <Check className="w-3.5 h-3.5" />
              <span>Saved Automatically</span>
            </div>
          )}
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Section 1: Academic Pedagogy */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Academic Defaults</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Primary Engineering Discipline</label>
                <select
                  value={settings.defaultBranch}
                  onChange={(e) => handleUpdate({ defaultBranch: e.target.value as EngineeringBranch })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {engineeringBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Sets the default academic discipline for new inquiries
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Default Study Mode</label>
                <select
                  value={settings.defaultStudyMode}
                  onChange={(e) => handleUpdate({ defaultStudyMode: e.target.value as StudyMode })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 capitalize"
                >
                  <option value="standard">Standard Concept Tutor</option>
                  <option value="derivation">Step-by-Step Derivation & Proofs</option>
                  <option value="exam">Exam & Viva Preparation</option>
                  <option value="socratic">Socratic Guiding Tutor</option>
                  <option value="code">Code & Big-O Complexity</option>
                  <option value="simplify">Intuitive Real-World Analogy</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Default format when you start a conversation
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Explanation Rigor & Depth</label>
                <select
                  value={settings.depthLevel}
                  onChange={(e) => handleUpdate({ depthLevel: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Introductory">Introductory / High School</option>
                  <option value="Undergraduate">Undergraduate Degree Standard</option>
                  <option value="Advanced (GATE/Research)">Advanced (GATE / Research / Postgrad)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Governs mathematical rigor and vocabulary complexity
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Language & Cultural Preference</label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => handleUpdate({ defaultLanguage: e.target.value as ExplanationLanguage })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="english">Standard English (Academic Clarity)</option>
                  <option value="tanglish">Tanglish (Tamil + English mixture)</option>
                  <option value="tamil">Tamil (தமிழ் விளக்கம்)</option>
                  <option value="hinglish">Hinglish (Hindi + English mixture)</option>
                  <option value="hindi">Hindi (हिंदी விளக்கம்)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Honoring bilingual & multilingual engineering pedagogy
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Speech & Read-Aloud */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Volume2 className="w-4 h-4 text-teal-600" />
              <span>Voice & Accessibility</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Voice Playback Speed</p>
                  <p className="text-[11px] text-slate-400">Speed multiplier for Web Speech read-aloud</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-700">{settings.voiceSpeed}x</span>
                  <input
                    type="range"
                    min="0.75"
                    max="1.5"
                    step="0.25"
                    value={settings.voiceSpeed}
                    onChange={(e) => handleUpdate({ voiceSpeed: parseFloat(e.target.value) })}
                    className="accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Architecture & Firebase Readiness */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Architecture & Cloud Storage</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">
                      Firebase Authentication & Firestore Database
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Architecture Ready
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Data is currently stored securely in your client repository. The service layer (`storageService` & `authService`) is decoupled and prepared for immediate synchronization with Firebase Firestore & Firebase Auth when provisioned.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Data Management */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-slate-600" />
              <span>Data Export & Storage</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-800">Backup Study Notes & History</p>
                <p className="text-[11px] text-slate-400">
                  Export all your conversations, notes, and preferences to a single JSON file.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportData}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          </div>
          {/* Section 5: Account & Session */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Current Account Session</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div>
                <p className="font-bold text-slate-800">
                  {user ? `Signed in as ${user.name} (${user.email || "Guest"})` : "Not currently signed in"}
                </p>
                <p className="text-[11px] text-slate-400">
                  Manage your active student session or switch to another scholar profile.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCurrentPage("signup")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl transition-colors"
                >
                  Create New Account
                </button>
                <button
                  id="settings-logout-btn"
                  onClick={logoutUser}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
