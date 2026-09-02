import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  generateAcademicChatResponse,
  generateAcademicChatResponseStream,
  generateExamQuizService,
  generateStudySummaryService,
  formatGeminiErrorMessage,
} from "./server/geminiService";
import { processUploadedDocument } from "./server/documentService";
import { requireAuthAndRateLimit } from "./server/abuseProtection";

dotenv.config();

const app = express();
const PORT = 3000;

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// JSON body parser with strict limit
app.use(express.json({ limit: "25mb" }));

// Input Validation Helpers
function sanitizeString(val: any, maxLength: number = 500): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLength);
}

function sanitizeMessages(messages: any): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-30) // Cap to last 30 messages for memory efficiency and latency
    .map((m) => {
      const role: "user" | "assistant" | "system" =
        m?.role === "user" || m?.role === "assistant" || m?.role === "system" ? m.role : "user";
      const content = typeof m?.content === "string" ? m.content.slice(0, 30000) : "";
      return { role, content };
    })
    .filter((m) => m.content.length > 0);
}

const ALLOWED_STUDY_MODES = ["standard", "derivation", "exam", "socratic", "code", "simplify"];
const ALLOWED_LANGUAGES = ["english", "tanglish", "tamil", "hinglish", "hindi"];

// Healthcheck & status
app.get("/api/health", (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  if (geminiConfigured) {
    return res.json({
      status: "ok",
      geminiConfigured: true,
      appName: "KarpomKarpipom AI",
      version: "1.0.0",
    });
  } else {
    return res.status(503).json({
      status: "error",
      geminiConfigured: false,
      appName: "KarpomKarpipom AI",
      version: "1.0.0",
    });
  }
});

// Centralized Chat Request Handler (Supports POST /api/chat and POST /api/chat/stream)
async function handleChatStreamRequest(req: express.Request, res: express.Response) {
  const reqStart = Date.now();
  const requestId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const abortController = new AbortController();

  // Handle client disconnect (only abort if response connection is terminated before completion)
  res.on("close", () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });


  // Server-side timeout (35 seconds) to prevent infinite hangs
  const serverTimeout = setTimeout(() => {
    if (!res.writableEnded && !abortController.signal.aborted) {
      console.error(`[CHAT] [${requestId}] Server timeout triggered after 35s`);
      abortController.abort();
      if (!res.headersSent) {
        res.status(504).json({ error: "Request timed out while waiting for AI response. Please try again." });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Request timed out while waiting for AI response. Please try again." })}\n\n`);
        res.end();
      }
    }
  }, 35000);

  try {
    // 1. Parse and Validate Request Payload
    let messageContent = "";
    let messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

    if (typeof req.body?.message === "string" && req.body.message.trim().length > 0) {
      messageContent = req.body.message.trim();
      const rawHistory = req.body?.conversationHistory;
      if (Array.isArray(rawHistory)) {
        messages = sanitizeMessages(rawHistory);
      }
      messages.push({ role: "user", content: messageContent });
    } else if (Array.isArray(req.body?.messages) && req.body.messages.length > 0) {
      messages = sanitizeMessages(req.body.messages);
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        messageContent = lastMsg.content;
      }
    }

    // Validation: message must exist and not be empty
    if (!messageContent || messages.length === 0) {
      clearTimeout(serverTimeout);
      return res.status(400).json({
        error: "Invalid request: 'message' or 'messages' is required and must contain a non-empty string.",
      });
    }

    // Validation: check reasonable max length
    if (messageContent.length > 50000) {
      clearTimeout(serverTimeout);
      return res.status(400).json({
        error: "Message exceeds maximum allowed length of 50,000 characters.",
      });
    }

    const rawMode = sanitizeString(req.body?.studyMode, 30);
    const studyMode = (ALLOWED_STUDY_MODES.includes(rawMode) ? rawMode : "standard") as any;

    const rawLang = sanitizeString(req.body?.language, 30).toLowerCase();
    const language = ALLOWED_LANGUAGES.includes(rawLang) ? rawLang : "english";

    const branch = sanitizeString(req.body?.branch, 100);
    const fileData = req.body?.fileData;

    const rawProfile = req.body?.studentProfile;
    const studentProfile = rawProfile && typeof rawProfile === "object" ? {
      displayName: sanitizeString(rawProfile.displayName, 80),
      college: sanitizeString(rawProfile.college, 120),
      degreeCourse: sanitizeString(rawProfile.degreeCourse, 80),
      yearOfStudy: sanitizeString(rawProfile.yearOfStudy, 40),
      preferredLanguage: sanitizeString(rawProfile.preferredLanguage, 30),
      learningStyle: sanitizeString(rawProfile.learningStyle, 40),
      targetExam: sanitizeString(rawProfile.targetExam, 80),
    } : undefined;

    console.log(
      `[CHAT] [${requestId}] request received (messages: ${messages.length}, mode: ${studyMode}, branch: ${branch || "General"}, chars: ${messageContent.length})`
    );

    // Setup Server-Sent Events headers for immediate streaming
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (res.flushHeaders) {
      res.flushHeaders();
    }

    await generateAcademicChatResponseStream(
      {
        requestId,
        messages,
        studyMode,
        branch,
        language,
        fileData,
        studentProfile,
      },
      (chunkText) => {
        if (!abortController.signal.aborted && !res.writableEnded) {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
          if (typeof (res as any).flush === "function") {
            (res as any).flush();
          }
        }
      },
      abortController.signal
    );

    clearTimeout(serverTimeout);

    if (!abortController.signal.aborted && !res.writableEnded) {
      res.write("data: [DONE]\n\n");
      res.end();
      const totalTime = Date.now() - reqStart;
      console.log(`[CHAT] [${requestId}] total duration: ${totalTime}ms`);
    }
  } catch (error: any) {
    clearTimeout(serverTimeout);
    if (!abortController.signal.aborted && !res.writableEnded) {
      console.error(`[CHAT] [${requestId}] Error:`, error?.message || error);
      const cleanMsg = formatGeminiErrorMessage(error);
      if (!res.headersSent) {
        res.status(500).json({ error: cleanMsg || "Failed to generate educational response." });
      } else {
        res.write(`data: ${JSON.stringify({ error: cleanMsg || "Failed to generate educational response." })}\n\n`);
        res.end();
      }
    }
  }
}

// POST /api/chat - Primary streaming chat endpoint
app.post("/api/chat", requireAuthAndRateLimit("chat"), handleChatStreamRequest);

// POST /api/chat/stream - Streaming alias for compatibility
app.post("/api/chat/stream", requireAuthAndRateLimit("chat"), handleChatStreamRequest);


// Document processing & extraction endpoint (PDF, DOCX, TXT, MD)
app.post("/api/document/process", requireAuthAndRateLimit("document"), async (req, res) => {
  const reqStart = Date.now();
  const requestId = `doc-${Date.now()}`;
  try {
    const fileName = sanitizeString(req.body?.fileName, 150);
    const fileData = req.body?.fileData;
    const mimeType = sanitizeString(req.body?.mimeType, 80);

    console.log(`[Timing][${requestId}] [Request Received] /api/document/process: "${fileName}" (${mimeType})`);

    if (!fileName || !fileData || typeof fileData !== "string") {
      return res.status(400).json({
        error: "Document file name and valid file data are required.",
      });
    }

    const cleanBase64 = fileData.includes("base64,") ? fileData.split("base64,")[1] : fileData;
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    const processedDoc = await processUploadedDocument(fileBuffer, fileName, mimeType);
    console.log(
      `[Timing][${requestId}] [Doc Processed] "${fileName}" extracted ${processedDoc.charCount} chars in ${
        Date.now() - reqStart
      }ms`
    );

    res.json({
      success: true,
      document: processedDoc,
    });
  } catch (error: any) {
    console.error(`[Timing][${requestId}] [Doc Error]:`, error?.message || error);
    res.status(400).json({
      error: error.message || "Failed to process and extract document content.",
    });
  }
});

// Fallback non-streaming student question & conversational tutor endpoint
app.post("/api/chat", requireAuthAndRateLimit("chat"), async (req, res) => {
  const reqStart = Date.now();
  const requestId = `chat-${Date.now()}`;
  try {
    const rawMessages = req.body?.messages;
    const messages = sanitizeMessages(rawMessages);

    const rawMode = sanitizeString(req.body?.studyMode, 30);
    const studyMode = (ALLOWED_STUDY_MODES.includes(rawMode) ? rawMode : "standard") as any;

    const rawLang = sanitizeString(req.body?.language, 30).toLowerCase();
    const language = ALLOWED_LANGUAGES.includes(rawLang) ? rawLang : "english";

    const branch = sanitizeString(req.body?.branch, 100);
    const fileData = req.body?.fileData;

    const rawProfile = req.body?.studentProfile;
    const studentProfile = rawProfile && typeof rawProfile === "object" ? {
      displayName: sanitizeString(rawProfile.displayName, 80),
      college: sanitizeString(rawProfile.college, 120),
      degreeCourse: sanitizeString(rawProfile.degreeCourse, 80),
      yearOfStudy: sanitizeString(rawProfile.yearOfStudy, 40),
      preferredLanguage: sanitizeString(rawProfile.preferredLanguage, 30),
      learningStyle: sanitizeString(rawProfile.learningStyle, 40),
      targetExam: sanitizeString(rawProfile.targetExam, 80),
    } : undefined;

    console.log(`[Timing][${requestId}] [Request Received] /api/chat non-streaming`);

    const reply = await generateAcademicChatResponse({
      requestId,
      messages,
      studyMode,
      branch,
      language,
      fileData,
      studentProfile,
    });

    console.log(`[Timing][${requestId}] [Response Sent] Total round-trip in ${Date.now() - reqStart}ms`);
    res.json({ reply });
  } catch (error: any) {
    console.error(`[Timing][${requestId}] [Chat Error]:`, error?.message || error);
    const cleanMsg = formatGeminiErrorMessage(error);
    const statusCode = cleanMsg.includes("API key is not configured") ? 503 : 500;
    res.status(statusCode).json({
      error: cleanMsg || "Failed to generate educational response from KarpomKarpipom AI.",
    });
  }
});

// Generate Practice Exam / Quiz
app.post("/api/generate-exam-quiz", requireAuthAndRateLimit("quiz"), async (req, res) => {
  const reqStart = Date.now();
  const requestId = `quiz-${Date.now()}`;
  let isFinished = false;

  const timeoutTimer = setTimeout(() => {
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.warn(`[Timing][${requestId}] /api/generate-exam-quiz timed out after 20s`);
      res.status(504).json({ error: "Assessment generation timed out. Please try again with a slightly narrower topic." });
    }
  }, 20000);

  try {
    const rawSubject = sanitizeString(req.body?.subject, 80);
    const rawBranch = sanitizeString(req.body?.branch, 80);
    const topic = sanitizeString(req.body?.topic, 200);
    const numQuestions = Math.min(Math.max(Number(req.body?.numQuestions) || 5, 1), 15);
    const rawDifficulty = sanitizeString(req.body?.difficulty, 20);
    const difficulty = ["Easy", "Medium", "Hard"].includes(rawDifficulty) ? rawDifficulty : "Medium";

    const effectiveSubject = rawSubject || rawBranch || "General Engineering";
    console.log(
      `[Timing][${requestId}] [Request Received] /api/generate-exam-quiz | Subject: "${effectiveSubject}" | Topic: "${topic}" | Qs: ${numQuestions} | Diff: ${difficulty}`
    );

    if (!topic) {
      clearTimeout(timeoutTimer);
      isFinished = true;
      return res.status(400).json({ error: "A valid academic topic is required to generate a quiz." });
    }

    const quizData = await generateExamQuizService({
      requestId,
      subject: effectiveSubject,
      topic,
      numQuestions,
      difficulty,
    });

    clearTimeout(timeoutTimer);
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.log(`[Timing][${requestId}] [Response Sent] Quiz generated in ${Date.now() - reqStart}ms`);
      res.json(quizData);
    }
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.error(`[Timing][${requestId}] [Quiz Error]:`, error?.message || error);
      const cleanMsg = formatGeminiErrorMessage(error);
      const statusCode = cleanMsg.includes("API key is not configured") ? 503 : 500;
      res.status(statusCode).json({ error: cleanMsg || "Failed to generate practice quiz." });
    }
  }
});

// Generate Concept Summary & Flashcards
app.post("/api/generate-summary", requireAuthAndRateLimit("summary"), async (req, res) => {
  const reqStart = Date.now();
  const requestId = `summary-${Date.now()}`;
  let isFinished = false;

  const timeoutTimer = setTimeout(() => {
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.warn(`[Timing][${requestId}] /api/generate-summary timed out after 20s`);
      res.status(504).json({ error: "Study sheet generation timed out. Please try again." });
    }
  }, 20000);

  try {
    const topic = sanitizeString(req.body?.topic, 200);
    const chatContext = sanitizeString(req.body?.chatContext, 3000);

    console.log(`[Timing][${requestId}] [Request Received] /api/generate-summary: "${topic}"`);
    if (!topic) {
      clearTimeout(timeoutTimer);
      isFinished = true;
      return res.status(400).json({ error: "A valid academic topic or session context is required." });
    }

    const summaryData = await generateStudySummaryService({
      requestId,
      topic,
      chatContext,
    });

    clearTimeout(timeoutTimer);
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.log(`[Timing][${requestId}] [Response Sent] Summary generated in ${Date.now() - reqStart}ms`);
      res.json(summaryData);
    }
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    if (!isFinished && !res.headersSent) {
      isFinished = true;
      console.error(`[Timing][${requestId}] [Summary Error]:`, error?.message || error);
      const cleanMsg = formatGeminiErrorMessage(error);
      const statusCode = cleanMsg.includes("API key is not configured") ? 503 : 500;
      res.status(statusCode).json({ error: cleanMsg || "Failed to generate study sheet." });
    }
  }
});

// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KarpomKarpipom AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
