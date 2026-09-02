import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  Flame,
  Award,
  BookOpen,
  CheckCircle2,
  Edit2,
  Plus,
  X,
  Target,
  Sparkles,
  LogOut,
  ShieldCheck,
  BarChart3,
  Languages,
  Brain,
  School,
  FileCheck,
  Check,
  HelpCircle,
  ArrowRight,
  Sparkle,
} from "lucide-react";
import { EngineeringBranch, ExplanationLanguage, LearningStyle, YearOfStudy } from "../types";

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, setCurrentPage, createNewConversation, logoutUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  // Form states with initial user values
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [degreeCourse, setDegreeCourse] = useState(user?.degreeCourse || "B.E. Computer Science and Engineering");
  const [branch, setBranch] = useState<EngineeringBranch>(user?.branch || "Computer Science & AI");
  const [yearOfStudy, setYearOfStudy] = useState<string>(user?.yearOfStudy || "3rd Year (Pre-final)");
  const [preferredLanguage, setPreferredLanguage] = useState<ExplanationLanguage>(user?.preferredLanguage || "english");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(user?.learningStyle || "intuitive");
  const [targetExam, setTargetExam] = useState(user?.targetExam || "University Semester Finals & Placements");
  const [newTopic, setNewTopic] = useState("");

  // Sync state when user object changes
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || "");
      setCollege(user.college || "");
      setDegreeCourse(user.degreeCourse || "B.E. Computer Science and Engineering");
      setBranch(user.branch || "Computer Science & AI");
      setYearOfStudy(user.yearOfStudy || "3rd Year (Pre-final)");
      setPreferredLanguage(user.preferredLanguage || "english");
      setLearningStyle(user.learningStyle || "intuitive");
      setTargetExam(user.targetExam || "University Semester Finals & Placements");
    }
  }, [user]);

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

  const yearOfStudyOptions: YearOfStudy[] = [
    "1st Year (Freshman)",
    "2nd Year (Sophomore)",
    "3rd Year (Pre-final)",
    "4th Year / Final Year",
    "Postgraduate / Master's / PhD",
    "Self-Learner / Professional",
  ];

  const languageOptions: { id: ExplanationLanguage; label: string; desc: string }[] = [
    { id: "english", label: "English", desc: "Clear, precise academic prose with standard terminology" },
    { id: "tanglish", label: "Tanglish (Tamil + English)", desc: "Conversational Tamil in Latin script with English formulas" },
    { id: "tamil", label: "Tamil (தமிழ்)", desc: "Formal Tamil explanations with English technical terms" },
    { id: "hinglish", label: "Hinglish (Hindi + English)", desc: "Conversational Hindi in Latin script with English formulas" },
    { id: "hindi", label: "Hindi (हिंदी)", desc: "Formal Hindi explanations with English technical terms" },
  ];

  const learningStyleOptions: { id: LearningStyle; label: string; desc: string; icon: string }[] = [
    {
      id: "intuitive",
      label: "Visual Analogies & Intuition First",
      desc: "Everyday mental models, diagrams, and physical intuition before complex equations.",
      icon: "💡",
    },
    {
      id: "derivation",
      label: "Rigorous Step-by-Step Derivations",
      desc: "Detailed mathematical proofs, algebraic step justifications, and boundary conditions.",
      icon: "📐",
    },
    {
      id: "exam_focused",
      label: "Exam & GATE Problem Solver",
      desc: "High-yield 2-mark definitions, 16-mark structured answers, and calculation traps.",
      icon: "🎯",
    },
    {
      id: "practical_code",
      label: "Practical Code & Hands-on Implementation",
      desc: "Executable code snippets, algorithm walkthroughs, and Big-O complexity analysis.",
      icon: "💻",
    },
    {
      id: "socratic_viva",
      label: "Socratic Questioning & Viva Prep",
      desc: "Guided questions, active recall checks, and oral exam defense inquiries.",
      icon: "🗣️",
    },
    {
      id: "concise_summary",
      label: "Concise Bullet Points & Quick Revision",
      desc: "High-density bullet points, comparison tables, and essential takeaway formulas.",
      icon: "📝",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Student Profile</h2>
          <p className="text-xs text-slate-500">Please sign in to configure your personalized student profile and learning preferences.</p>
          <button
            onClick={() => setCurrentPage("login")}
            className="w-full px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Sign In to Account
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: displayName.trim() || user.name,
      displayName: displayName.trim(),
      college: college.trim(),
      degreeCourse: degreeCourse.trim(),
      branch,
      yearOfStudy: yearOfStudy as any,
      preferredLanguage,
      learningStyle,
      targetExam: targetExam.trim(),
    });
    setIsEditing(false);
    setSaveSuccessBanner(true);
    setTimeout(() => setSaveSuccessBanner(false), 3000);
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    if (!user.masteredTopics.includes(newTopic.trim())) {
      updateProfile({
        masteredTopics: [...user.masteredTopics, newTopic.trim()],
      });
    }
    setNewTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    updateProfile({
      masteredTopics: user.masteredTopics.filter((t) => t !== topic),
    });
  };

  // Human-readable labels for badges
  const currentLanguageObj = languageOptions.find((l) => l.id === (user.preferredLanguage || "english"));
  const currentLearningStyleObj = learningStyleOptions.find((s) => s.id === (user.learningStyle || "intuitive"));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Save Banner */}
        {saveSuccessBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn shadow-2xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Student profile preferences saved successfully! AI explanations are now personalized to your curriculum.</span>
            </div>
            <button onClick={() => setSaveSuccessBanner(false)} className="text-emerald-700 hover:text-emerald-900 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-7 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 flex items-center justify-center text-2xl font-bold font-serif shrink-0 shadow-2xs">
                {(user.displayName || user.name || "S").charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                    {user.displayName || user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {user.branch}
                  </span>
                  {user.yearOfStudy && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {user.yearOfStudy}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-3 pt-0.5">
                  {user.college ? (
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      {user.college}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Institution not set</span>
                  )}

                  {user.degreeCourse && (
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      {user.degreeCourse}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Student Member since {user.joinedDate || "Recent"} · {user.email || "Scholar Account"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
              <button
                id="profile-dashboard-btn"
                onClick={() => setCurrentPage("dashboard")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dashboard</span>
              </button>
              <button
                id="edit-profile-toggle-btn"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors border ${
                  isEditing
                    ? "bg-slate-100 text-slate-900 border-slate-300"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{isEditing ? "Close Editor" : "Edit Preferences"}</span>
              </button>
            </div>
          </div>

          {/* Edit Profile Form Drawer */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-200 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Personalize Student Profile & Curriculum Preferences</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    All fields below are optional and calibrated to tailor AI derivations and practice problems to your exact curriculum.
                  </p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                  Curriculum Setup
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Display Name</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lokesh Kumar or Scholar"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">Used by AI tutor in responses and study sessions.</p>
                </div>

                {/* 2. College */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Institution / University</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anna University, IIT Madras, NIT Trichy, PSG Tech..."
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">Helps calibrate syllabus patterns and question types.</p>
                </div>

                {/* 3. Degree / Course */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Degree / Specialization</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.E. Computer Science, B.Tech AI & DS, M.Tech VLSI..."
                    value={degreeCourse}
                    onChange={(e) => setDegreeCourse(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">Calibrates the disciplinary depth and industrial applications.</p>
                </div>

                {/* 4. Year of Study */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Academic Standing</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  >
                    {yearOfStudyOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Calibrates depth (foundation fundamentals vs. advanced systems).</p>
                </div>

                {/* 5. Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Primary Discipline</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as EngineeringBranch)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  >
                    {engineeringBranches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">Sets your default domain for practice assessments and quick prompts.</p>
                </div>

                {/* 6. Target Exam / Goal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Target Exam / Milestone</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. University Finals, GATE 2027, Tech Interviews..."
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <p className="text-[10px] text-slate-400">Guides high-yield 2-mark definitions and 16-mark structured answers.</p>
                </div>
              </div>

              {/* 7. Preferred Explanation Language */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Preferred Explanation Language</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        preferredLanguage === lang.id
                          ? "bg-emerald-50/80 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900">{lang.label}</span>
                        {preferredLanguage === lang.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">{lang.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 8. Preferred Learning Style */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-slate-700" />
                    <span>Preferred Pedagogical Approach</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {learningStyleOptions.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setLearningStyle(style.id)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        learningStyle === style.id
                          ? "bg-slate-900 border-slate-900 text-white ring-1 ring-slate-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{style.icon}</span>
                          {learningStyle === style.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className={`font-semibold text-xs mb-1 ${learningStyle === style.id ? "text-white" : "text-slate-900"}`}>{style.label}</p>
                        <p className={`text-[10px] leading-tight ${learningStyle === style.id ? "text-slate-300" : "text-slate-500"}`}>{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Save / Cancel Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* AI Personalization Summary Card */}
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-2xs border border-slate-800 relative">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkle className="w-3 h-3 fill-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Active Curriculum Calibration
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-serif">
                How KarpomKarpipom AI Adapts to Your Learning
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Based on your profile, AI explanations calibrate to{" "}
                <span className="text-emerald-300 font-semibold">{user.yearOfStudy || "Engineering Standing"}</span>, emphasizing{" "}
                <span className="text-emerald-300 font-semibold">{currentLearningStyleObj?.label || "Visual Intuition"}</span> in{" "}
                <span className="text-emerald-300 font-semibold">{currentLanguageObj?.label || "English"}</span> for{" "}
                <span className="text-emerald-300 font-semibold">{user.branch}</span>.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <button
                onClick={() => {
                  createNewConversation(user.branch, `Personalized Study: ${user.branch}`);
                  setCurrentPage("chat");
                }}
                className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>Launch AI Tutor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preferences Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-slate-800 text-xs">
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Style</span>
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                <span>{currentLearningStyleObj?.icon}</span>
                <span className="truncate">{currentLearningStyleObj?.label.split(" ")[0]}</span>
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Language</span>
              <span className="font-semibold text-emerald-400 truncate block">
                {currentLanguageObj?.label.split(" ")[0]}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Standing</span>
              <span className="font-semibold text-slate-200 truncate block">
                {user.yearOfStudy?.split("(")[0] || "Undergraduate"}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60 space-y-0.5">
              <span className="text-[10px] text-slate-400 block">Target Goal</span>
              <span className="font-semibold text-slate-200 truncate block">
                {user.targetExam || "University Finals"}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Daily Study Streak
              </span>
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">{user.streakDays || 1} Days</p>
            <p className="text-[11px] text-slate-500">Consistent daily inquiries</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Questions Asked
              </span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">{user.questionsCount || 0}</p>
            <p className="text-[11px] text-slate-500">Derivations & conceptual inquiries</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-teal-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quizzes Completed
              </span>
              <Award className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">{user.quizzesTaken || 0}</p>
            <p className="text-[11px] text-slate-500">Exam-level practice sets</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Quiz Accuracy
              </span>
              <Target className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-2xl font-bold text-slate-900 font-mono">{user.quizHighScore || 0}%</p>
            <p className="text-[11px] text-slate-500">Top score across all domains</p>
          </div>
        </div>

        {/* Mastered Concepts & Learning Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Mastered Topics Badges */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mastered Concepts & Theorems</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {user.masteredTopics?.length || 0} Topics
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[44px]">
              {user.masteredTopics && user.masteredTopics.length > 0 ? (
                user.masteredTopics.map((topic) => (
                  <div
                    key={topic}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800"
                  >
                    <span>{topic}</span>
                    <button
                      onClick={() => handleRemoveTopic(topic)}
                      className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove topic"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-1">
                  No concepts listed yet. Add theorems and formulas you have mastered below.
                </p>
              )}
            </div>

            {/* Add New Topic Input */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Add concept (e.g. Fourier Transforms, Dijkstra, Maxwell's Equations)..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
              <button
                onClick={handleAddTopic}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Target Exam Goal Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Primary Academic Target</span>
              </h3>
              <p className="text-base font-bold text-slate-900 font-serif">{user.targetExam || "University Semester Finals"}</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                KarpomKarpipom AI automatically tailors exam-prep suggestions, 2-mark definitions, and 16-mark derivations for this milestone.
              </p>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  createNewConversation(user.branch, `Exam Prep: ${user.targetExam || "Syllabus Revision"}`);
                  setCurrentPage("chat");
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg text-center transition-colors"
              >
                Start Target Prep
              </button>
              <button
                onClick={() => setCurrentPage("quiz")}
                className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg text-center transition-colors"
              >
                Practice Quiz Studio
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Safe Student Environment Guarantee */}
        <div className="p-4 bg-slate-100/90 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800">Student Privacy Commitment</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              We never collect phone numbers, physical addresses, or sensitive financial information. Configured fields are used exclusively to calibrate AI tutoring explanations to your syllabus.
            </p>
          </div>
        </div>

        {/* Account & Session Controls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Account & Session</h3>
            </div>
            <p className="text-xs text-slate-600">
              Signed in as <span className="font-semibold text-slate-800">{user.email || user.name}</span>. Your syllabus progress and preferences are synchronized.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage("signup")}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
            >
              + Create Account
            </button>
            <button
              id="profile-logout-btn"
              onClick={logoutUser}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
