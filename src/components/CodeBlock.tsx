import React, { useState, useMemo } from "react";
import { Check, Copy, Terminal, Code2 } from "lucide-react";
import Prism from "prismjs";

// Import common languages for Prism
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";

interface CodeBlockProps {
  language?: string;
  code: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  python3: "python",
  c: "c",
  cpp: "cpp",
  "c++": "cpp",
  cs: "csharp",
  "c#": "csharp",
  java: "java",
  sql: "sql",
  mysql: "sql",
  pgsql: "sql",
  postgres: "sql",
  bash: "bash",
  sh: "bash",
  zsh: "bash",
  shell: "bash",
  json: "json",
  html: "markup",
  xml: "markup",
  svg: "markup",
  markup: "markup",
  css: "css",
  yaml: "yaml",
  yml: "yaml",
  md: "markdown",
  rust: "rust",
  rs: "rust",
  go: "go",
  golang: "go",
};

const DISPLAY_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "React JSX",
  tsx: "React TSX",
  python: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  sql: "SQL",
  bash: "Terminal / Bash",
  json: "JSON",
  markup: "HTML / XML",
  css: "CSS",
  yaml: "YAML",
  markdown: "Markdown",
  rust: "Rust",
  go: "Go",
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = "", code }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = code.replace(/\n$/, "");
  const normalizedLang = LANGUAGE_ALIASES[language.toLowerCase()] || language.toLowerCase();
  const displayName = DISPLAY_NAMES[normalizedLang] || (language ? language.toUpperCase() : "CODE");

  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[normalizedLang] || Prism.languages.javascript;
      if (grammar) {
        return Prism.highlight(cleanCode, grammar, normalizedLang);
      }
    } catch (e) {
      console.warn("Prism highlight fallback:", e);
    }
    // Fallback safe escape
    return cleanCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }, [cleanCode, normalizedLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const isTerminal = normalizedLang === "bash" || normalizedLang === "shell";

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-slate-800/90 bg-[#0d1117] shadow-lg shadow-black/20 text-slate-100 font-mono text-xs">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-800/80 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          {isTerminal ? (
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Code2 className="w-3.5 h-3.5 text-teal-400" />
          )}
          <span className="font-semibold tracking-wide text-slate-200">{displayName}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-95 ${
            copied
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50"
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor Body */}
      <div className="p-4 overflow-x-auto selection:bg-emerald-800/40 selection:text-emerald-200 leading-relaxed text-[12.5px] font-mono">
        <pre className="!bg-transparent !p-0 !m-0 !border-0 font-mono">
          <code
            className={`language-${normalizedLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
};
