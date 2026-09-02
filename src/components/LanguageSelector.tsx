import React, { useState, useRef, useEffect } from "react";
import { Languages, Check, ChevronDown, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ExplanationLanguage } from "../types";

interface LanguageSelectorProps {
  variant?: "segmented" | "dropdown" | "compact";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "segmented",
  className = "",
}) => {
  const { selectedLanguage, setSelectedLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: {
    id: ExplanationLanguage;
    label: string;
    shortLabel: string;
    subtext: string;
    description: string;
    badge: string;
  }[] = [
    {
      id: "english",
      label: "English",
      shortLabel: "EN",
      subtext: "Academic English",
      description: "Precise university-level academic prose and standard engineering terminology.",
      badge: "Standard",
    },
    {
      id: "tanglish",
      label: "Tanglish",
      shortLabel: "Tanglish",
      subtext: "Tamil + English in Latin script",
      description: "Natural conversational Tamil in English script. Keeps technical terms in English for intuitive peer-to-peer clarity.",
      badge: "Peer Tutoring",
    },
    {
      id: "tamil",
      label: "Tamil (தமிழ்)",
      shortLabel: "தமிழ்",
      subtext: "தமிழ் எழுத்து விளக்கம்",
      description: "Rich explanations in Tamil script while retaining standard English technical terms & formulas.",
      badge: "தமிழ் Script",
    },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.id === selectedLanguage) || languages[0];

  if (variant === "compact" || variant === "dropdown") {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-95"
          title={`Language: ${currentLang.label} — Click to switch`}
          id="btn-language-dropdown"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold text-slate-900">{currentLang.label}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1.5 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Response Language Mode
              </span>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                KarpomKarpipom AI
              </span>
            </div>

            <div className="p-1 space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 ${
                    selectedLanguage === lang.id
                      ? "bg-emerald-50/80 border border-emerald-200 text-emerald-950"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900">{lang.label}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {lang.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                      {lang.description}
                    </p>
                  </div>
                  {selectedLanguage === lang.id && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
              Technical terms and equations are kept in English for exam clarity.
            </div>
          </div>
        )}
      </div>
    );
  }

  // Segmented Pill Control (Default in Input bar)
  return (
    <div
      className={`inline-flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium ${className}`}
      role="group"
      aria-label="Language Mode Selector"
    >
      <Languages className="w-3.5 h-3.5 text-slate-500 mx-1 shrink-0 hidden sm:inline" />
      {languages.map((lang) => {
        const isActive = selectedLanguage === lang.id;
        return (
          <button
            key={lang.id}
            type="button"
            onClick={() => setSelectedLanguage(lang.id)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
              isActive
                ? "bg-white text-emerald-900 shadow-2xs font-bold ring-1 ring-black/5"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
            title={`${lang.label}: ${lang.description}`}
            id={`lang-btn-${lang.id}`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};
