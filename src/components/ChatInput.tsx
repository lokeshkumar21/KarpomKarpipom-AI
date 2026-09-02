import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  X,
  Languages,
  BookOpen,
  ArrowUp,
  FileImage,
  Layers,
  Square,
  FileText,
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ExplanationLanguage, MessageFile, StudyMode } from "../types";
import { LanguageSelector } from "./LanguageSelector";

type MicState = "idle" | "listening" | "error" | "unavailable";

export const ChatInput: React.FC = () => {
  const {
    sendMessage,
    isGenerating,
    stopGeneration,
    selectedBranch,
    selectedStudyMode,
    setSelectedStudyMode,
    selectedLanguage,
    setSelectedLanguage,
    activeDocument,
    setIsDocumentModalOpen,
    removeActiveDocument,
  } = useApp();

  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<MessageFile | null>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [voiceNotice, setVoiceNotice] = useState<{ message: string; hint?: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check speech recognition capability without requesting permission
  const isSpeechSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  // Cleanup timers & recognition on unmount
  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (errorResetTimerRef.current) clearTimeout(errorResetTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // Silent cleanup
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Helper to show dismissible voice notice with auto-expiry
  const showVoiceNotice = useCallback((message: string, hint?: string, durationMs = 6000) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setVoiceNotice({ message, hint });
    noticeTimerRef.current = setTimeout(() => {
      setVoiceNotice(null);
      noticeTimerRef.current = null;
    }, durationMs);
  }, []);

  const dismissVoiceNotice = () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setVoiceNotice(null);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  // Focus textarea when generation ends or stops so user can immediately write next prompt
  useEffect(() => {
    if (!isGenerating && textareaRef.current) {
      if (document.activeElement === document.body || document.activeElement === textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isGenerating]);

  const handleSend = () => {
    if (isGenerating) return;
    if (!input.trim() && !attachedFile) return;
    const currentInput = input.trim();
    const currentFile = attachedFile || undefined;
    setInput("");
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    sendMessage(currentInput, currentFile);
  };

  const handleStop = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    stopGeneration();
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && (input.trim() || attachedFile)) {
        handleSend();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload a file under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      const base64Data = result.split(",")[1];
      setAttachedFile({
        data: base64Data,
        mimeType: file.type || "image/jpeg",
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
  };

  // Stop active recognition safely
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      recognitionRef.current = null;
    }
    setMicState("idle");
  }, []);

  // Safe Voice Input Trigger via Web Speech API
  const toggleVoiceInput = () => {
    // 1. If currently listening, stop immediately
    if (micState === "listening") {
      stopVoiceRecognition();
      return;
    }

    // 2. Check browser support
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicState("unavailable");
      showVoiceNotice(
        "Voice input is not supported in this browser.",
        "You can continue typing your questions in the text box."
      );
      return;
    }

    // 3. Clean up any lingering instance before starting
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    dismissVoiceNotice();

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        selectedLanguage === "tamil"
          ? "ta-IN"
          : selectedLanguage === "tanglish"
          ? "ta-IN"
          : "en-US";

      recognition.onstart = () => {
        setMicState("listening");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput((prev) => {
            const trimmedPrev = prev.trim();
            return trimmedPrev ? `${trimmedPrev} ${transcript.trim()}` : transcript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        const errType = event?.error;

        // Graceful error differentiation without unhandled warnings
        switch (errType) {
          case "not-allowed":
          case "service-not-allowed":
            setMicState("error");
            showVoiceNotice(
              "Microphone access is unavailable. You can continue using text input.",
              "To use voice, allow microphone access in your browser site permissions."
            );
            break;

          case "no-speech":
            // Normal timeout when no speech is detected - return to idle silently
            setMicState("idle");
            break;

          case "audio-capture":
            setMicState("error");
            showVoiceNotice(
              "Microphone could not be accessed.",
              "Please verify your microphone hardware and browser audio permissions."
            );
            break;

          case "network":
            setMicState("error");
            showVoiceNotice(
              "Speech recognition requires an active network connection.",
              "Please check your internet connectivity."
            );
            break;

          case "aborted":
            // Deliberately stopped by user or system - reset to idle without error banner
            setMicState("idle");
            break;

          case "language-not-supported":
            setMicState("error");
            showVoiceNotice(
              "Selected language is not supported for voice recognition on this browser.",
              "Try switching to English in the language selector."
            );
            break;

          default:
            // Generic non-fatal error
            setMicState("idle");
            break;
        }

        // Clean up instance on error
        recognitionRef.current = null;

        // Auto-return mic button to idle state after brief visual feedback
        if (errorResetTimerRef.current) clearTimeout(errorResetTimerRef.current);
        errorResetTimerRef.current = setTimeout(() => {
          setMicState("idle");
          errorResetTimerRef.current = null;
        }, 2000);
      };

      recognition.onend = () => {
        setMicState("idle");
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      // Synchronous start error fallback
      setMicState("idle");
      recognitionRef.current = null;
      showVoiceNotice(
        "Voice input could not be initiated.",
        "You can continue using standard text input."
      );
    }
  };

  const quickPromptPills = [
    { label: "📐 Step-by-step derivation", mode: "derivation" as StudyMode, promptPrefix: "Can you provide a rigorous step-by-step derivation for: " },
    { label: "💡 Explain with real-world analogy", mode: "simplify" as StudyMode, promptPrefix: "Explain the intuitive real-world analogy behind: " },
    { label: "🎯 High-yield exam prep & pitfalls", mode: "exam" as StudyMode, promptPrefix: "What are the most frequent exam questions, formulas, and common traps in: " },
    { label: "💻 Code & Complexity (Big-O)", mode: "code" as StudyMode, promptPrefix: "Provide optimized code and Big-O time & space complexity analysis for: " },
    { label: "🧠 Socratic Tutor mode", mode: "socratic" as StudyMode, promptPrefix: "Guide me step-by-step with hints on how to solve: " },
  ];

  const handleApplyPromptPill = (item: typeof quickPromptPills[0]) => {
    setSelectedStudyMode(item.mode);
    setInput(item.promptPrefix);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Quick Academic Suggestions Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Prompt Aids:</span>
          </span>
          {quickPromptPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPromptPill(pill)}
              className="shrink-0 px-2.5 py-1 rounded-md bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Active Document Pill (if present) */}
        {activeDocument && (
          <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-950 w-fit animate-fadeIn">
            <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold truncate max-w-[200px]">{activeDocument.name}</span>
            {activeDocument.status === "uploading" && (
              <span className="text-[10px] text-amber-800 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Uploading ({activeDocument.progress || 35}%)</span>
              </span>
            )}
            {activeDocument.status === "processing" && (
              <span className="text-[10px] text-teal-800 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Extracting...</span>
              </span>
            )}
            {activeDocument.status === "ready" && (
              <span className="text-[10px] text-emerald-800 flex items-center gap-1 font-semibold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Grounded ({activeDocument.wordCount?.toLocaleString() || "Ready"} words)</span>
              </span>
            )}
            <button
              type="button"
              onClick={removeActiveDocument}
              className="p-1 hover:bg-emerald-200 rounded text-emerald-900 ml-1 transition-colors"
              title="Remove document context"
              aria-label="Remove document"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment Pill (if present) */}
        {attachedFile && (
          <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 w-fit animate-fadeIn">
            <FileImage className="w-4 h-4 text-emerald-700" />
            <span className="font-medium max-w-[200px] truncate">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-emerald-200 rounded text-emerald-800 ml-1"
              title="Remove file"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Voice Input Feedback / Permission Notice Banner */}
        {voiceNotice && (
          <div
            id="voice-input-notice"
            role="status"
            className="flex items-start justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg text-xs animate-fadeIn shadow-2xs"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">{voiceNotice.message}</p>
                {voiceNotice.hint && (
                  <p className="text-[11px] text-amber-800 mt-0.5">{voiceNotice.hint}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={dismissVoiceNotice}
              className="p-1 hover:bg-amber-100 rounded text-amber-800 transition-colors shrink-0"
              title="Dismiss message"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Input Box Container */}
        <div className="relative flex flex-col bg-slate-50/80 border border-slate-300 rounded-xl p-2.5 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 focus-within:bg-white transition-colors">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="chat-textarea-input"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask any academic question in ${selectedBranch} (e.g. derivations, theorems, exam questions, code)...`}
            className="w-full bg-transparent px-1.5 py-1 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none leading-relaxed min-h-[44px]"
          />

          {/* Controls Bar at bottom of input */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-1 px-1">
            {/* Left Controls: File Upload, Voice, Language & Mode Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Document QA Upload Trigger */}
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors"
                title="Upload PDF, DOCX, or TXT for Document Question Answering"
                id="btn-open-doc-upload"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Doc</span>
              </button>

              {/* File Attachment */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                title="Attach lecture diagram, equation image, or slide"
                id="btn-attach-file"
                aria-label="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
                  micState === "listening"
                    ? "bg-rose-600 text-white animate-pulse shadow-2xs"
                    : micState === "error"
                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                    : micState === "unavailable"
                    ? "text-slate-400 bg-slate-100 cursor-not-allowed"
                    : "text-slate-600 hover:text-emerald-800 hover:bg-emerald-50"
                }`}
                title={
                  micState === "listening"
                    ? "Listening... Click to stop voice input"
                    : micState === "error"
                    ? "Microphone error. Click to retry voice input"
                    : micState === "unavailable"
                    ? "Voice input is not supported on this browser"
                    : "Speak your doubt (Speech to Text)"
                }
                id="btn-voice-input"
                aria-label="Voice input"
              >
                {micState === "listening" ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold">Listening...</span>
                  </>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>

              {/* Language Selector Component */}
              <LanguageSelector variant="segmented" />

              {/* Study Mode Indicator */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                <BookOpen className="w-3 h-3 text-emerald-700" />
                <span className="capitalize">{selectedStudyMode}</span>
              </span>
            </div>

            {/* Right: Submit or Stop Button */}
            {Boolean(input.trim() || attachedFile) ? (
              <button
                type="button"
                id="chat-send-btn"
                onClick={handleSend}
                className="flex items-center justify-center p-2 rounded text-white font-medium bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-2xs active:scale-95"
                title="Send academic query (Enter)"
                aria-label="Send query"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            ) : isGenerating ? (
              <button
                type="button"
                id="chat-stop-btn"
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-2xs"
                title="Stop response generation"
                aria-label="Stop generation"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                id="chat-send-btn"
                disabled={true}
                className="flex items-center justify-center p-2 rounded text-slate-400 bg-slate-200/80 cursor-not-allowed transition-colors"
                title="Type a doubt or question to send"
                aria-label="Send query disabled"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Pro Tip Subtitle */}
        <p className="text-[11px] text-center text-slate-500">
          KarpomKarpipom AI provides verified college-level reasoning · Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 text-[10px] font-mono text-slate-700 font-semibold">Enter</kbd> to ask
        </p>
      </div>
    </div>
  );
};
