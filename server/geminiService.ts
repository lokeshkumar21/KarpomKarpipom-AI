import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from "dotenv";
import {
  buildCentralizedSystemInstruction,
  buildQuizPrompt,
  buildSummaryPrompt,
  QUIZ_GENERATOR_SYSTEM_INSTRUCTION,
  SUMMARY_GENERATOR_SYSTEM_INSTRUCTION,
} from "./systemInstruction";

dotenv.config();

/**
 * Fast educational model list for low-latency tutoring
 * Primary: gemini-3.1-flash-lite (fast sub-second TTFT)
 * Fallback: gemini-3.6-flash, gemini-3.7-flash
 */
const EDUCATIONAL_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

/**
 * Lazy Gemini Client Provider
 * Never exposes the API key to client bundles; reads securely from server environment.
 */
let aiClient: GoogleGenAI | null = null;


export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Helper to extract clean error message string if Gemini API error is wrapped in JSON
 * Sanitizes internal stack traces, API keys, GCP URLs, and project IDs
 */
export function formatGeminiErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred while communicating with the AI model.";
  let raw = error.message || String(error);

  // Try to parse JSON from error message (e.g. 'ApiError: {"error":{...}}')
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        raw = parsed.error.message;
      }
    }
  } catch {
    // ignore parse error
  }

  // Strip API keys, GCP project IDs, or internal endpoints if present
  let sanitized = raw
    .replace(/key=[A-Za-z0-9_\-]+/gi, "key=[REDACTED]")
    .replace(/AIzaSy[A-Za-z0-9_\-]{33}/g, "[REDACTED_API_KEY]")
    .replace(/projects\/[a-zA-Z0-9_\-]+/gi, "projects/[REDACTED]")
    .replace(/https?:\/\/[^\s]+/gi, "[REDACTED_URL]");

  if (sanitized.includes("RESOURCE_EXHAUSTED") || sanitized.includes("429")) {
    return "The AI tutoring system is currently experiencing high demand. Please wait a moment and try again.";
  }
  if (sanitized.includes("UNAVAILABLE") || sanitized.includes("503")) {
    return "The AI model service is temporarily unavailable. Please retry in a few seconds.";
  }
  if (sanitized.includes("API key")) {
    return "AI service configuration issue. Please ensure your Gemini API key is valid in the server environment.";
  }

  return sanitized;
}

/**
 * Executes a Gemini request with automatic retries and model fallbacks for 503/429 transient errors
 */
async function executeWithRetryAndFallback<T>(
  requestFn: (modelName: string) => Promise<T>,
  preferredModel: string = "gemini-3.1-flash-lite",
  requestId: string = "req"
): Promise<T> {
  const modelQueue = [
    preferredModel,
    ...EDUCATIONAL_MODELS.filter((m) => m !== preferredModel),
  ];

  let lastError: any = null;

  for (let i = 0; i < modelQueue.length; i++) {
    const model = modelQueue[i];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[CHAT] [${requestId}] Gemini request started (model: ${model}, attempt: ${attempt})`);
        const result = await requestFn(model);
        return result;
      } catch (err: any) {
        lastError = err;
        const errString = err?.message || String(err);
        const isTransient =
          errString.includes("503") ||
          errString.includes("429") ||
          errString.includes("UNAVAILABLE") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("high demand") ||
          errString.includes("fetch failed");

        console.warn(
          `[CHAT] [${requestId}] Model ${model} attempt ${attempt} warning: ${formatGeminiErrorMessage(
            err
          )}`
        );

        if (isTransient && attempt < 2) {
          // Short delay before retrying same model
          await new Promise((res) => setTimeout(res, 300 * attempt));
          continue;
        }

        break; // break retry loop to try next model in fallback list
      }
    }
  }

  throw new Error(formatGeminiErrorMessage(lastError));
}


export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
  file?: {
    data?: string; // base64 string
    mimeType?: string;
    name?: string;
    extractedText?: string;
    docType?: string;
  };
}

export interface GenerateChatOptions {
  requestId?: string;
  messages: ChatMessagePayload[];
  studyMode?: "standard" | "derivation" | "exam" | "socratic" | "code" | "simplify";
  branch?: string;
  language?: "english" | "tanglish" | "tamil" | "hinglish" | "hindi" | string;
  fileData?: {
    data?: string;
    mimeType?: string;
    name?: string;
    extractedText?: string;
    docType?: string;
  };
  studentProfile?: {
    displayName?: string;
    college?: string;
    degreeCourse?: string;
    yearOfStudy?: string;
    preferredLanguage?: string;
    learningStyle?: string;
    targetExam?: string;
  };
}

/**
 * Helper to construct formatted document part for Gemini API
 */
function buildDocumentParts(file: {
  data?: string;
  mimeType?: string;
  name?: string;
  extractedText?: string;
  docType?: string;
}): Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> {
  const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
  const fileName = file.name || "uploaded_document";
  const mimeType = file.mimeType || "application/octet-stream";

  if (file.extractedText && file.extractedText.trim()) {
    // Truncate overly massive extracted text to ~40,000 characters for optimal latency and token efficiency
    const cleanExtracted = file.extractedText.trim().slice(0, 45000);
    parts.push({
      text: `[UPLOADED DOCUMENT: "${fileName}"]
--- DOCUMENT CONTENT START ---
${cleanExtracted}
--- DOCUMENT CONTENT END ---

IMPORTANT INSTRUCTION FOR DOCUMENT QUESTION-ANSWERING:
1. Prioritize this uploaded document as the primary source for answering the student's question.
2. Ground all answers and citations directly in the document text above.
3. If the student asks for information, formulas, or solutions NOT present in this document, explicitly state that it is not available in the uploaded document. Do not fabricate information.`,
    });
  } else if (mimeType.includes("pdf") && file.data) {
    const base64Data = file.data.includes("base64,") ? file.data.split("base64,")[1] : file.data;
    parts.push({
      text: `[UPLOADED PDF DOCUMENT: "${fileName}"]
Please carefully read and analyze this attached PDF document (including all pages, diagrams, tables, formulas, and text). Prioritize this document to answer the student's questions. If any asked detail is not present in the document, explicitly mention that it is not found in the uploaded document.`,
    });
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: "application/pdf",
      },
    });
  } else if (file.data) {
    const base64Data = file.data.includes("base64,") ? file.data.split("base64,")[1] : file.data;
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType || "image/jpeg",
      },
    });
  }

  return parts;
}

/**
 * Formats chat messages and options into Gemini API contents structure
 * Prunes conversation history and optimizes document payload
 */
function prepareChatPayload(options: GenerateChatOptions) {
  const { messages, studyMode = "standard", branch, language = "english", fileData, studentProfile } = options;

  // Build centralized system instruction
  const systemInstruction = buildCentralizedSystemInstruction({
    branch,
    studyMode,
    language,
    studentProfile,
  });

  // Keep a sliding window of recent messages (up to last 14 turns) to avoid prompt bloat
  const recentMessages = Array.isArray(messages) ? messages.slice(-14) : [];
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }>;
  }> = [];

  let documentAttached = false;

  for (let i = 0; i < recentMessages.length; i++) {
    const msg = recentMessages[i];
    if (msg.role === "system") continue;

    const isLatestMessage = i === recentMessages.length - 1;
    const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

    // Only include heavy document attachments on the latest user message or relevant active turn
    if (isLatestMessage && msg.file && (msg.file.data || msg.file.extractedText)) {
      const docParts = buildDocumentParts(msg.file);
      parts.push(...docParts);
      documentAttached = true;
    } else if (!isLatestMessage && msg.file?.name) {
      // For older historical messages, include lightweight reference instead of full multi-megabyte base64
      parts.push({ text: `[Attachment reference: ${msg.file.name}]` });
    }

    if (msg.content && msg.content.trim()) {
      parts.push({ text: msg.content.trim() });
    }

    if (parts.length > 0) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      });
    }
  }

  // Attach separate fileData only if not already attached to the latest user message
  if (!documentAttached && fileData && (fileData.data || fileData.extractedText) && contents.length > 0) {
    const lastContent = contents[contents.length - 1];
    if (lastContent && lastContent.role === "user") {
      const docParts = buildDocumentParts(fileData);
      lastContent.parts.unshift(...docParts);
    }
  }

  // Fallback if contents is empty
  if (contents.length === 0) {
    contents.push({
      role: "user",
      parts: [{ text: "Hello KarpomKarpipom AI, introduce yourself and explain how you can help me learn." }],
    });
  }

  return { contents, systemInstruction };
}

/**
 * Generates an educational response using Gemini API with multi-turn conversation context
 */
export async function generateAcademicChatResponse(options: GenerateChatOptions): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in your server environment."
    );
  }

  const requestId = options.requestId || `chat-${Date.now()}`;
  const startTime = Date.now();
  const { contents, systemInstruction } = prepareChatPayload(options);

  return await executeWithRetryAndFallback(async (modelName) => {
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (modelName === "gemini-3.7-flash") {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    const replyText = response.text?.trim();
    if (!replyText) {
      throw new Error("Received an empty response from Gemini educational model.");
    }
    const elapsed = Date.now() - startTime;
    console.log(`[CHAT] [${requestId}] Gemini response completed in ${elapsed}ms (${replyText.length} chars)`);
    return replyText;
  }, "gemini-3.7-flash", requestId);
}

/**
 * Streams an educational response chunk by chunk using Gemini API
 */
export async function generateAcademicChatResponseStream(
  options: GenerateChatOptions,
  onChunk: (text: string) => void | Promise<void>,
  signal?: AbortSignal
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please ensure GEMINI_API_KEY is available in your server environment."
    );
  }

  const requestId = options.requestId || `stream-${Date.now()}`;
  const startTime = Date.now();
  const { contents, systemInstruction } = prepareChatPayload(options);

  return await executeWithRetryAndFallback(async (modelName) => {
    if (signal?.aborted) return "";
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (modelName === "gemini-3.7-flash") {
      config.thinkingConfig = { thinkingBudget: 0 };
    }

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config,
    });

    let accumulatedText = "";
    let chunkCount = 0;
    let firstTokenTime: number | null = null;

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        console.log(`[CHAT] [${requestId}] Stream aborted by client`);
        break;
      }
      const chunkText = chunk.text || "";
      if (chunkText) {
        if (firstTokenTime === null) {
          firstTokenTime = Date.now();
          const ttft = firstTokenTime - startTime;
          console.log(`[CHAT] [${requestId}] first Gemini chunk received (TTFT: ${ttft}ms)`);
        }
        chunkCount++;
        accumulatedText += chunkText;
        await onChunk(chunkText);
      }
    }

    if (!accumulatedText && !signal?.aborted) {
      throw new Error("Received an empty response stream from Gemini educational model.");
    }

    const totalElapsed = Date.now() - startTime;
    console.log(
      `[CHAT] [${requestId}] Gemini stream completed (${totalElapsed}ms, ${chunkCount} chunks, ${accumulatedText.length} chars)`
    );

    return accumulatedText;
  }, "gemini-3.7-flash", requestId);
}


/**
 * Validates and normalizes structured quiz data returned by Gemini
 */
function validateAndNormalizeQuizData(raw: any, fallbackParams: { subject: string; topic: string; difficulty: string }) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response: Root response must be a valid JSON object.");
  }

  const subject = String(raw.subject || fallbackParams.subject || "General Engineering").trim();
  const topic = String(raw.topic || fallbackParams.topic || "Academic Assessment").trim();
  const difficulty = ["Easy", "Hard"].includes(raw.difficulty) ? raw.difficulty : "Medium";

  if (!Array.isArray(raw.questions) || raw.questions.length === 0) {
    throw new Error("Invalid response: Questions array is missing or empty.");
  }

  const validatedQuestions = raw.questions.map((q: any, idx: number) => {
    const qNum = idx + 1;
    if (!q || typeof q !== "object") {
      throw new Error(`Question #${qNum} is not a valid object.`);
    }

    const questionText = String(q.question || "").trim();
    if (!questionText) {
      throw new Error(`Question #${qNum} has empty question text.`);
    }

    // Ensure options array has at least 2 distinct choices (typically 4)
    let options: string[] = [];
    if (Array.isArray(q.options)) {
      options = q.options.map((opt: any) => String(opt || "").trim()).filter(Boolean);
    }
    if (options.length < 2) {
      throw new Error(`Question #${qNum} does not contain sufficient options.`);
    }

    let correctAnswer = String(q.correctAnswer || "").trim();

    // Check if correctAnswer directly matches an option
    let matchedOption = options.find((opt) => opt.toLowerCase() === correctAnswer.toLowerCase());

    // If not directly matched, check if correctAnswer is an index or letter like "A", "B", "C", "D"
    if (!matchedOption) {
      const letterMatch = correctAnswer.match(/^[A-D]$/i) || correctAnswer.match(/^Option ([A-D])/i);
      if (letterMatch) {
        const letterIdx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
        if (options[letterIdx]) {
          matchedOption = options[letterIdx];
          correctAnswer = options[letterIdx];
        }
      }
    }

    // If still unmatched, default to the first option so student isn't blocked by casing or prefix mismatches
    if (!matchedOption) {
      correctAnswer = options[0];
    } else {
      correctAnswer = matchedOption;
    }

    const explanation = String(
      q.explanation ||
        `Correct answer is "${correctAnswer}". Review the core definitions, formulas, and governing theorems for this topic.`
    ).trim();

    const qDifficulty = ["Easy", "Medium", "Hard"].includes(q.difficulty)
      ? q.difficulty
      : difficulty;

    return {
      question: questionText,
      options,
      correctAnswer,
      explanation,
      difficulty: qDifficulty,
    };
  });

  return {
    subject,
    topic,
    difficulty,
    questions: validatedQuestions,
  };
}

/**
 * Generates an exam-ready multiple-choice quiz using Gemini structured JSON schema
 */
export async function generateExamQuizService(params: {
  subject?: string;
  topic: string;
  numQuestions?: number;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  branch?: string;
  requestId?: string;
}): Promise<any> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key is not configured.");
  }

  const subject = params.subject || params.branch || "General Engineering";
  const topic = params.topic.trim();
  const numQuestions = Math.max(1, Math.min(25, Number(params.numQuestions) || 5));
  const difficulty = ["Easy", "Hard"].includes(params.difficulty as string)
    ? (params.difficulty as "Easy" | "Hard")
    : "Medium";
  const requestId = params.requestId || `quiz-${Date.now()}`;

  const prompt = buildQuizPrompt({
    subject,
    topic,
    numQuestions,
    difficulty,
  });
  const startTime = Date.now();

  return await executeWithRetryAndFallback(async (modelName) => {
    const isGemini3 = modelName.startsWith("gemini-3");

    // Strict Structured Output Schema
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: {
            type: Type.STRING,
            description: "Academic subject or engineering discipline",
          },
          topic: {
            type: Type.STRING,
            description: "Specific academic topic or concept tested",
          },
          difficulty: {
            type: Type.STRING,
            enum: ["Easy", "Medium", "Hard"],
            description: "Difficulty tier of the assessment",
          },
          questions: {
            type: Type.ARRAY,
            description: "List of multiple choice quiz questions",
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description: "The clear academic question text with exact terminology",
                },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description: "Array of exactly 4 distinct plausible options (A, B, C, D)",
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: "The EXACT text matching one of the options",
                },
                explanation: {
                  type: Type.STRING,
                  description: "Concise 1-2 sentence academic explanation of why this answer is correct",
                },
                difficulty: {
                  type: Type.STRING,
                  enum: ["Easy", "Medium", "Hard"],
                  description: "Difficulty tier of this question",
                },
              },
              required: ["question", "options", "correctAnswer", "explanation", "difficulty"],
            },
          },
        },
        required: ["subject", "topic", "difficulty", "questions"],
      },
      systemInstruction: QUIZ_GENERATOR_SYSTEM_INSTRUCTION,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 },
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    const jsonText = response.text?.trim() || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      console.error(`[Timing][${requestId}] [Quiz JSON Parse Failed]:`, jsonText.slice(0, 200));
      throw new Error("Failed to parse generated quiz structure into valid JSON.");
    }

    const validated = validateAndNormalizeQuizData(parsed, { subject, topic, difficulty });
    console.log(
      `[Timing][${requestId}] [Quiz Generated] ${validated.questions.length} questions validated in ${
        Date.now() - startTime
      }ms`
    );
    return validated;
  }, "gemini-3.7-flash", requestId);
}

/**
 * Generates high-yield study sheet and flashcards using centralized summary builder
 */
export async function generateStudySummaryService(params: {
  topic: string;
  chatContext?: string;
  requestId?: string;
}): Promise<any> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key is not configured.");
  }

  const { topic, chatContext = "", requestId = `summary-${Date.now()}` } = params;
  const prompt = buildSummaryPrompt(topic, chatContext);
  const startTime = Date.now();

  return await executeWithRetryAndFallback(async (modelName) => {
    const config: any = {
      responseMimeType: "application/json",
      systemInstruction: SUMMARY_GENERATOR_SYSTEM_INSTRUCTION,
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 0 },
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config,
    });

    const jsonText = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(jsonText);
      console.log(`[Timing][${requestId}] [Summary Generated] Elapsed: ${Date.now() - startTime}ms`);
      return parsed;
    } catch (err) {
      throw new Error("Failed to parse generated study summary into valid JSON.");
    }
  }, "gemini-3.7-flash", requestId);
}

