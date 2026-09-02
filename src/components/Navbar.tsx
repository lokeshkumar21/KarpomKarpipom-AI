import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  MessageSquare,
  History,
  User,
  Settings,
  Info,
  Flame,
  Menu,
  X,
  Sparkles,
  LogIn,
  LogOut,
  Award,
  BarChart3,
} from "lucide-react";
import { AppPage } from "../types";

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, user, isAuthenticated, isGuest, logoutUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AppPage; label: string; icon: React.ReactNode }[] = [
    { id: "landing", label: "Home", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "chat", label: "AI Tutor", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "quiz", label: "Quiz Studio", icon: <Award className="w-4 h-4" /> },
    ...(isAuthenticated
      ? [
          { id: "dashboard" as AppPage, label: "Dashboard", icon: <BarChart3 className="w-4 h-4" /> },
          { id: "history" as AppPage, label: "History", icon: <History className="w-4 h-4" /> },
        ]
      : []),
    { id: "about", label: "About", icon: <Info className="w-4 h-4" /> },
  ];

  const handleNav = (page: AppPage) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav("landing")}
            className="flex items-center gap-3 cursor-pointer group select-none"
            id="nav-brand"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleNav("landing");
            }}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-800 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 tracking-tight font-heading">
                  KarpomKarpipom <span className="text-emerald-700">AI</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                  கற்போம் கற்பிப்போம்
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                AI-Powered Educational Assistant
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Status / CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && !isGuest && user ? (
              /* Authenticated User State */
              <>
                {/* Study Streak Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs font-semibold"
                  title="Consecutive Days of Study"
                  id="user-streak-badge"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>{user.streakDays || 1}d Streak</span>
                </div>

                {/* Profile Pill */}
                <button
                  id="nav-profile-button"
                  onClick={() => handleNav("profile")}
                  aria-label="View Student Profile"
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg border text-xs font-medium transition-all ${
                    currentPage === "profile"
                      ? "border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/30"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                    {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.displayName || user.name || "User"}</span>
                </button>

                {/* Settings Icon */}
                <button
                  id="nav-settings-button"
                  onClick={() => handleNav("settings")}
                  className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ${
                    currentPage === "settings" ? "bg-slate-100 text-emerald-700" : ""
                  }`}
                  title="Preferences & Settings"
                  aria-label="Preferences & Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Direct Sign Out Button */}
                <button
                  id="nav-logout-btn"
                  onClick={logoutUser}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                  title="Sign out of current account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </>
            ) : isGuest ? (
              /* Guest User State */
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Guest</span>
                </div>
                <button
                  id="nav-guest-create-account-btn"
                  onClick={() => handleNav("signup")}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
                <button
                  id="nav-exit-guest-btn"
                  onClick={logoutUser}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                >
                  Exit Guest Mode
                </button>
              </div>
            ) : (
              /* Unauthenticated State */
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => handleNav("login")}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Log In
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => handleNav("signup")}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated && !isGuest && user && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{user.streakDays || 1}d</span>
              </div>
            )}
            {isGuest && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 text-[11px] font-semibold">
                Guest
              </span>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-1.5 animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                currentPage === item.id
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <hr className="border-slate-100 my-2" />

          {isAuthenticated && !isGuest && user ? (
            <>
              <button
                onClick={() => handleNav("profile")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span>My Profile ({user.displayName || user.name})</span>
              </button>
              <button
                onClick={() => handleNav("settings")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings & Preferences</span>
              </button>
              <button
                onClick={logoutUser}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : isGuest ? (
            <div className="space-y-2 pt-1">
              <div className="text-xs text-slate-500 px-1">Currently exploring in Guest Mode</div>
              <button
                onClick={() => handleNav("signup")}
                className="w-full py-2 text-center text-xs font-semibold text-white bg-emerald-700 rounded-lg"
              >
                Create Account
              </button>
              <button
                onClick={logoutUser}
                className="w-full py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Exit Guest Mode
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => handleNav("login")}
                className="w-full py-2 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav("signup")}
                className="w-full py-2 text-center text-xs font-semibold text-white bg-emerald-700 rounded-lg"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
