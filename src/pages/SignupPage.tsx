import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Brain,
  Languages,
  Sparkles,
  School,
} from "lucide-react";
import { EngineeringBranch, ExplanationLanguage, LearningStyle } from "../types";

export const SignupPage: React.FC = () => {
  const { signupWithEmailUser, loginWithGoogleUser, setCurrentPage } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [college, setCollege] = useState("");
  const [degreeCourse, setDegreeCourse] = useState("B.E. Computer Science and Engineering");
  const [branch, setBranch] = useState<EngineeringBranch>("Computer Science & AI");
  const [yearOfStudy, setYearOfStudy] = useState<any>("3rd Year (Pre-final)");
  const [preferredLanguage, setPreferredLanguage] = useState<ExplanationLanguage>("english");
  const [learningStyle, setLearningStyle] = useState<LearningStyle>("intuitive");
  const [showOptionalProfile, setShowOptionalProfile] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Full Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await signupWithEmailUser(email.trim(), password.trim(), {
        name: name.trim(),
        displayName: name.trim(),
        email: email.trim(),
        college: college.trim() || undefined,
        degreeCourse: degreeCourse.trim() || undefined,
        branch,
        yearOfStudy,
        preferredLanguage,
        learningStyle,
        targetExam: "University Semester Finals & Tech Placements",
      });

      if (!res.success) {
        setError(res.error || "Failed to create account. Please check your information.");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogleUser({
        name: name.trim() || undefined,
        displayName: name.trim() || undefined,
        college: college.trim() || undefined,
        degreeCourse: degreeCourse.trim() || undefined,
        branch: branch || undefined,
        yearOfStudy: yearOfStudy || undefined,
        preferredLanguage: preferredLanguage || undefined,
        learningStyle: learningStyle || undefined,
        targetExam: "University Semester Finals & Tech Placements",
      });
      if (!res.success) {
        setError(res.error || "Google sign-up was unable to complete. Please try again or use Email sign-up.");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-up failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-6 sm:p-7 space-y-5 my-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 flex items-center justify-center mx-auto shadow-2xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif pt-1">
            Create Account
          </h1>
          <p className="text-xs text-slate-500">
            &ldquo;கற்போம் கற்பிப்போம்&rdquo; — Join KarpomKarpipom AI to master concepts
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google One-Click Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Sign up with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider absolute">
            Or create with Email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priyadharshini R"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Confirm Password <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
              />
            </div>
          </div>

          {/* Optional Profile Section Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowOptionalProfile(!showOptionalProfile)}
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Customize Academic Profile</p>
                  <p className="text-[10px] text-slate-500">Degree, college, language & learning style (Optional)</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {showOptionalProfile ? "Hide" : "Customize"}
              </span>
            </button>
          </div>

          {showOptionalProfile && (
            <div className="space-y-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>College / Institution</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. College of Engineering, Guindy"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Degree / Course</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={degreeCourse}
                    onChange={(e) => setDegreeCourse(e.target.value)}
                    placeholder="B.E. Computer Science"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Year of Study</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  >
                    <option value="1st Year (Freshman)">1st Year (Freshman)</option>
                    <option value="2nd Year (Sophomore)">2nd Year (Sophomore)</option>
                    <option value="3rd Year (Pre-final)">3rd Year (Pre-final)</option>
                    <option value="4th Year / Final Year">4th Year / Final Year</option>
                    <option value="Postgraduate / Master's / PhD">Postgraduate / Master's / PhD</option>
                    <option value="Self-Learner / Professional">Self-Learner / Professional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Explanation Language</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as ExplanationLanguage)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  >
                    <option value="english">English (Standard)</option>
                    <option value="tanglish">Tanglish (Tamil + English)</option>
                    <option value="tamil">Tamil (தமிழ்)</option>
                    <option value="hinglish">Hinglish (Hindi + English)</option>
                    <option value="hindi">Hindi (हिंदी)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Learning Style</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={learningStyle}
                    onChange={(e) => setLearningStyle(e.target.value as LearningStyle)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                  >
                    <option value="intuitive">Intuition & Visual Analogies</option>
                    <option value="derivation">Step-by-Step Derivations</option>
                    <option value="exam_focused">Exam & Problem Solver</option>
                    <option value="practical_code">Practical Code & Hands-on</option>
                    <option value="socratic_viva">Socratic Questioning & Viva</option>
                    <option value="concise_summary">Concise Bullet Points</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors group mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Toggle to Sign In */}
        <div className="text-center text-xs text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => setCurrentPage("login")}
            className="font-semibold text-emerald-700 hover:underline"
          >
            Sign In
          </button>
        </div>

        {/* Footnote with Privacy assurance */}
        <div className="pt-2 border-t border-slate-100 space-y-1 text-center text-[11px] text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Privacy First: No sensitive personal or financial info collected</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Profile preferences are optional and used exclusively to adapt AI explanations to your syllabus.
          </p>
        </div>
      </div>
    </div>
  );
};
