import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share2,
  FileText,
  User,
  GraduationCap,
  Square,
  ExternalLink,
} from "lucide-react";
import { ChatMessage as ChatMessageType } from "../types";
import { useApp } from "../context/AppContext";
import { CodeBlock } from "./CodeBlock";

interface ChatMessageProps {
  message: ChatMessageType;
  onGenerateQuiz?: (topic: string) => void;
  onGenerateSummary?: (topic: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onGenerateQuiz,
  onGenerateSummary,
}) => {
  const { launchQuiz, launchSummary, stopGeneration } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(message.feedback || null);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-speech is not supported in this environment.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Reset previous
    // Clean markdown symbols for cleaner speech
    const cleanText = message.content
      .replace(/[*#_`$]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .slice(0, 1000); // Read first 1000 chars

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (message.language === "tamil") {
      utterance.lang = "ta-IN";
    } else if (message.language === "tanglish") {
      utterance.lang = "en-IN";
    } else {
      utterance.lang = "en-US";
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      // Ignore interruption/cancellation errors
      if (e.error !== "interrupted" && e.error !== "canceled") {
        // Silent reset
      }
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`py-4 px-3 sm:px-5 transition-colors ${
        isUser
          ? "bg-slate-50/80 border-b border-slate-200/80"
          : "bg-white border-b border-slate-200/80"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3.5 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-7 h-7 rounded-md bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
              <User className="w-3.5 h-3.5 text-slate-200" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              <GraduationCap className={`w-4 h-4 ${message.isStreaming ? "animate-pulse" : ""}`} />
            </div>
          )}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-heading">
                {isUser ? "You (Student)" : "KarpomKarpipom AI"}
              </span>
              {message.studyMode && !isUser && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                  {message.studyMode} mode
                </span>
              )}
              {message.language && message.language !== "english" && !isUser && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 capitalize">
                  {message.language === "tamil" ? "தமிழ்" : message.language}
                </span>
              )}
              {message.isStreaming && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping" />
                  <span>Synthesizing response...</span>
                </span>
              )}
              {message.branch && (
                <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                  · {message.branch}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {message.isStreaming && (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium transition-colors"
                  title="Stop AI generation"
                  aria-label="Stop generation"
                >
                  <Square className="w-3 h-3 fill-rose-600 text-rose-600" />
                  <span>Stop</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400">{formattedTime}</span>
            </div>
          </div>

          {/* Attachment Preview (if any) */}
          {message.file && (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3 max-w-sm">
              {message.file.mimeType.startsWith("image/") ? (
                <img
                  src={`data:${message.file.mimeType};base64,${message.file.data}`}
                  alt="Attachment"
                  className="w-12 h-12 object-cover rounded border border-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{message.file.name}</p>
                <p className="text-[10px] text-slate-500">Document analyzed</p>
              </div>
            </div>
          )}

          {/* Empty Streaming Placeholder / Typing Indicator */}
          {message.isStreaming && !message.content ? (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                <span className="font-medium">Formulating step-by-step academic response...</span>
              </div>
              <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          ) : (
            /* Markdown Content */
            <div className="prose prose-sm prose-slate max-w-none text-slate-900 leading-relaxed font-sans break-words selection:bg-emerald-100 selection:text-emerald-900">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 font-heading">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold text-slate-900 mt-3 mb-1.5 text-emerald-950 font-heading">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold text-slate-800 mt-2.5 mb-1 text-emerald-900 font-heading">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-2 mb-1 font-heading">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-[13.5px] text-slate-800">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
                  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-slate-800 text-[13.5px]">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-800 text-[13.5px]">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-emerald-600 bg-emerald-50/50 pl-3 py-1.5 my-2.5 rounded-r text-emerald-950 italic text-xs font-medium">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-3 border-slate-200" />,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100/80 text-slate-900 font-semibold">{children}</thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left text-xs font-bold text-slate-900 border-r last:border-r-0 border-slate-200">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-1.5 text-xs text-slate-800 border-r last:border-r-0 border-slate-100">
                      {children}
                    </td>
                  ),
                  a: ({ href, children }) => {
                    const isSafe = href && /^(https?:|\/|mailto:)/i.test(href);
                    if (!isSafe) {
                      return <span>{children}</span>;
                    }
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800 underline font-medium hover:bg-emerald-50 px-1 py-0.5 rounded transition-colors"
                      >
                        <span>{children}</span>
                        <ExternalLink className="w-3 h-3 inline-block ml-0.5 opacity-70" />
                      </a>
                    );
                  },
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const rawText = String(children);
                    const isInline = !match && !rawText.includes("\n");

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-emerald-900 font-mono text-[11.5px] font-semibold border border-slate-200"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    const lang = match ? match[1] : "";
                    return <CodeBlock language={lang} code={rawText} />;
                  },
                }}
              >
                {message.content}
              </Markdown>
              {message.isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-600 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Action Toolbar for Assistant Messages */}
          {!isUser && !message.isStreaming && message.content && (
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs border-t border-slate-100 mt-2.5">
              {/* Quick Study Enhancers */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => launchQuiz()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                  title="Generate a 5-question mock quiz on this concept"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Generate Practice Quiz</span>
                </button>
                <button
                  onClick={() => launchSummary()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition-colors"
                  title="Create exam flashcards & summary sheet"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  <span>Revision Notes & Cards</span>
                </button>
              </div>

              {/* Utility Tools: Copy, Speak, Feedback */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  onClick={handleSpeak}
                  className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                    isSpeaking ? "text-emerald-700 bg-emerald-50" : "hover:text-slate-800"
                  }`}
                  title={isSpeaking ? "Stop speaking" : "Read aloud"}
                  aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="Copy explanation"
                  aria-label="Copy explanation"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="h-3.5 w-px bg-slate-200 mx-0.5" />
                <button
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                  className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                    feedback === "up" ? "text-emerald-700 bg-emerald-50" : "hover:text-slate-800"
                  }`}
                  title="Helpful explanation"
                  aria-label="Mark helpful"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                  className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                    feedback === "down" ? "text-rose-700 bg-rose-50" : "hover:text-slate-800"
                  }`}
                  title="Needs improvement"
                  aria-label="Mark unhelpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
