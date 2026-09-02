import {
  ChatMessage,
  EngineeringBranch,
  ExplanationLanguage,
  MessageFile,
  QuizData,
  QuizDifficulty,
  StudentProfileContext,
  StudyMode,
  SummaryData,
} from "../types";
import { getAuthHeaders } from "./firebase";

export interface SendMessageOptions {
  messages: ChatMessage[];
  studyMode: StudyMode;
  branch: EngineeringBranch;
  language: ExplanationLanguage;
  fileData?: MessageFile;
  studentProfile?: StudentProfileContext;
}

export interface StreamChatOptions extends SendMessageOptions {
  onChunk: (chunk: string, fullText: string) => void;
  signal?: AbortSignal;
}

export interface ProcessedDocumentResponse {
  success: boolean;
  document: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    docType: "pdf" | "docx" | "txt" | "markdown" | "other";
    wordCount: number;
    charCount: number;
    previewSnippet: string;
    extractedText?: string;
    base64Data?: string;
  };
}

/**
 * Uploads and processes a document (PDF, DOCX, TXT, MD) on the server
 */
export async function processDocumentApi(
  fileName: string,
  base64Data: string,
  mimeType: string
): Promise<ProcessedDocumentResponse["document"]> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch("/api/document/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      fileName,
      fileData: base64Data,
      mimeType,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `Server error ${response.status}` }));
    throw new Error(err.error || "Failed to process uploaded document.");
  }

  const json: ProcessedDocumentResponse = await response.json();
  return json.document;
}

/**
 * Streams academic tutoring response progressively via Server-Sent Events
 */
export async function streamAcademicChat(options: StreamChatOptions): Promise<string> {
  const { onChunk, signal, ...payload } = options;
  const authHeaders = await getAuthHeaders();

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(payload),
    signal,
  });


  if (!response.ok) {
    let errorMsg = `Server returned ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in the current environment.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let accumulatedText = "";
  let buffer = "";

  const onAbort = () => {
    try {
      reader.cancel();
    } catch {
      // ignore
    }
  };

  if (signal) {
    if (signal.aborted) {
      onAbort();
      throw new DOMException("The user aborted a request.", "AbortError");
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
          return accumulatedText;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            accumulatedText += parsed.text;
            onChunk(parsed.text, accumulatedText);
          }
        } catch (err: any) {
          throw err;
        }
      }
    }

    if (buffer.trim().startsWith("data:")) {
      const dataStr = buffer.trim().slice(5).trim();
      if (dataStr === "[DONE]") {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        return accumulatedText;
      }
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) {
          accumulatedText += parsed.text;
          onChunk(parsed.text, accumulatedText);
        }
      } catch (err: any) {
        throw err;
      }
    }

    return accumulatedText;
  } finally {
    if (signal) {
      signal.removeEventListener("abort", onAbort);
    }
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

export async function sendAcademicChat(options: SendMessageOptions): Promise<string> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to communicate with AI server." }));
    throw new Error(errorData.error || `Server returned ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

export interface GenerateQuizParams {
  subject?: string;
  topic: string;
  numQuestions?: number;
  difficulty?: QuizDifficulty | "Beginner" | "Intermediate" | "Advanced / GATE";
  branch?: EngineeringBranch;
  signal?: AbortSignal;
  bypassCache?: boolean;
}

// In-memory session caches for instant sub-millisecond retrieval of identical queries
const quizSessionCache = new Map<string, { data: QuizData; timestamp: number }>();
const summarySessionCache = new Map<string, { data: SummaryData; timestamp: number }>();
const inFlightQuizPromises = new Map<string, Promise<QuizData>>();
const inFlightSummaryPromises = new Map<string, Promise<SummaryData>>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function combineAbortSignals(
  signalA?: AbortSignal,
  signalB?: AbortSignal
): { signal: AbortSignal; cleanup: () => void } {
  if (!signalA && !signalB) {
    const ac = new AbortController();
    return { signal: ac.signal, cleanup: () => {} };
  }
  if (!signalA) return { signal: signalB!, cleanup: () => {} };
  if (!signalB) return { signal: signalA, cleanup: () => {} };

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signalA.aborted || signalB.aborted) {
    controller.abort();
    return { signal: controller.signal, cleanup: () => {} };
  }
  signalA.addEventListener("abort", onAbort, { once: true });
  signalB.addEventListener("abort", onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      signalA.removeEventListener("abort", onAbort);
      signalB.removeEventListener("abort", onAbort);
    },
  };
}

export async function generateExamQuiz(
  paramOrTopic: string | GenerateQuizParams,
  branchFallback?: EngineeringBranch,
  difficultyFallback?: QuizDifficulty | "Beginner" | "Intermediate" | "Advanced / GATE",
  customSignal?: AbortSignal
): Promise<QuizData> {
  let subject = "General Engineering";
  let topic = "";
  let numQuestions = 5;
  let difficulty: QuizDifficulty = "Medium";
  let signal: AbortSignal | undefined = customSignal;
  let bypassCache = false;

  if (typeof paramOrTopic === "object") {
    const diff =
      paramOrTopic.difficulty === "Easy" || paramOrTopic.difficulty === "Beginner"
        ? "Easy"
        : paramOrTopic.difficulty === "Hard" || paramOrTopic.difficulty === "Advanced / GATE"
        ? "Hard"
        : "Medium";

    subject = paramOrTopic.subject || paramOrTopic.branch || "General Engineering";
    topic = paramOrTopic.topic.trim();
    numQuestions = paramOrTopic.numQuestions || 5;
    difficulty = diff;
    signal = paramOrTopic.signal || customSignal;
    bypassCache = !!paramOrTopic.bypassCache;
  } else {
    const diff =
      difficultyFallback === "Easy" || difficultyFallback === "Beginner"
        ? "Easy"
        : difficultyFallback === "Hard" || difficultyFallback === "Advanced / GATE"
        ? "Hard"
        : "Medium";

    subject = branchFallback || "General Engineering";
    topic = (paramOrTopic || "").trim();
    numQuestions = 5;
    difficulty = diff;
  }

  const cacheKey = `${subject.toLowerCase()}::${topic.toLowerCase()}::${difficulty}::${numQuestions}`;

  // 1. Check Session Cache if not bypassing
  if (!bypassCache) {
    const cached = quizSessionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[QUIZ] Retrieved from session cache (0ms): "${topic}"`);
      return cached.data;
    }
  }

  // 2. In-Flight Request Deduplication to prevent double-click redundant calls
  if (inFlightQuizPromises.has(cacheKey)) {
    console.log(`[QUIZ] In-flight request in progress, joining promise for "${topic}"`);
    return inFlightQuizPromises.get(cacheKey)!;
  }

  const payload = {
    subject,
    topic,
    numQuestions,
    difficulty,
  };

  const executeFetch = async (): Promise<QuizData> => {
    const t0 = performance.now();
    // 18-second client safety timeout
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 18000);
    const { signal: effectiveSignal, cleanup: cleanupSignal } = combineAbortSignals(signal, timeoutController.signal);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/generate-exam-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
        signal: effectiveSignal,
      });

      clearTimeout(timeoutId);
      cleanupSignal();

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to generate exam quiz." }));
        throw new Error(err.error || `Quiz generation failed with status ${response.status}`);
      }

      const data: QuizData = await response.json();
      const duration = Math.round(performance.now() - t0);
      console.log(`[QUIZ] Generation succeeded in ${duration}ms for "${topic}"`);

      // Store in session cache
      quizSessionCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      cleanupSignal();
      if (err.name === "AbortError" || signal?.aborted) {
        throw new DOMException("Assessment generation was cancelled.", "AbortError");
      }
      throw err;
    } finally {
      inFlightQuizPromises.delete(cacheKey);
    }
  };

  const promise = executeFetch();
  inFlightQuizPromises.set(cacheKey, promise);
  return promise;
}

export async function generateSummarySheet(
  topic: string,
  chatContext: string = "",
  signal?: AbortSignal,
  bypassCache?: boolean
): Promise<SummaryData> {
  const cleanTopic = topic.trim();
  const cacheKey = `summary::${cleanTopic.toLowerCase()}`;

  // Check cache
  if (!bypassCache) {
    const cached = summarySessionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[SUMMARY] Retrieved from session cache (0ms): "${cleanTopic}"`);
      return cached.data;
    }
  }

  // Deduplicate in-flight requests
  if (inFlightSummaryPromises.has(cacheKey)) {
    return inFlightSummaryPromises.get(cacheKey)!;
  }

  const executeFetch = async (): Promise<SummaryData> => {
    const t0 = performance.now();
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 18000);
    const { signal: effectiveSignal, cleanup: cleanupSignal } = combineAbortSignals(signal, timeoutController.signal);

    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/generate-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          topic: cleanTopic,
          chatContext: chatContext.slice(-1500),
        }),
        signal: effectiveSignal,
      });

      clearTimeout(timeoutId);
      cleanupSignal();

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to generate study summary." }));
        throw new Error(err.error || "Summary generation failed");
      }

      const data: SummaryData = await response.json();
      const duration = Math.round(performance.now() - t0);
      console.log(`[SUMMARY] Generation succeeded in ${duration}ms for "${cleanTopic}"`);

      summarySessionCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      cleanupSignal();
      if (err.name === "AbortError" || signal?.aborted) {
        throw new DOMException("Study sheet generation was cancelled.", "AbortError");
      }
      throw err;
    } finally {
      inFlightSummaryPromises.delete(cacheKey);
    }
  };

  const promise = executeFetch();
  inFlightSummaryPromises.set(cacheKey, promise);
  return promise;
}

export async function checkServerHealth(): Promise<{ hasApiKey: boolean; status: string }> {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) return { hasApiKey: false, status: "error" };
    return res.json();
  } catch {
    return { hasApiKey: false, status: "offline" };
  }
}
