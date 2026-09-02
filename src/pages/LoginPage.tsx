import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, UserCheck, AlertCircle, Loader2 } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { loginWithGoogleUser, loginWithEmailUser, loginAsGuestUser, setCurrentPage } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await loginWithEmailUser(email.trim(), password.trim());
      if (!res.success) {
        setError(res.error || "Failed to sign in. Please verify your email and password.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign-in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogleUser();
      if (!res.success) {
        setError(res.error || "Google sign-in was cancelled or encountered an error.");
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuestUser();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-lg bg-slate-900 text-emerald-400 border border-slate-800 flex items-center justify-center mx-auto shadow-2xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-serif pt-1">
            KarpomKarpipom AI
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your persistent notes, conversations, and syllabus progress
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Option */}
        <button
          id="google-signin-btn"
          type="button"
          onClick={handleGoogleSignIn}
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
          <span>Sign in with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-2.5 text-[11px] text-slate-400 uppercase font-semibold tracking-wider absolute">
            Or with Email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <button
            id="email-signin-submit-btn"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Button */}
        <button
          onClick={handleGuestLogin}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Continue as Guest Scholar</span>
        </button>

        {/* Toggle to Sign Up */}
        <div className="text-center text-xs text-slate-600">
          New to KarpomKarpipom AI?{" "}
          <button
            onClick={() => setCurrentPage("signup")}
            className="font-semibold text-emerald-700 hover:underline"
          >
            Create an Account
          </button>
        </div>

        {/* Firebase Ready Architecture Footnote */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secured with Firebase Authentication & Firestore</span>
        </div>
      </div>
    </div>
  );
};
