import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import {
  ActiveDocument,
  AppPage,
  ChatMessage,
  Conversation,
  EngineeringBranch,
  ExplanationLanguage,
  MessageFile,
  QuizAnswerRecord,
  QuizData,
  QuizDifficulty,
  QuizQuestion,
  QuizResultSummary,
  StudyMode,
  SummaryData,
  UserProfile,
  UserSettings,
} from "../types";
import { storageService, DEFAULT_USER_SETTINGS } from "../services/storageService";
import { streamAcademicChat, sendAcademicChat, generateExamQuiz, generateSummarySheet, processDocumentApi } from "../services/geminiService";
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUserFromFirebase,
  subscribeToAuth,
  subscribeToUserConversations,
  createConversationInFirestore,
  updateConversationInFirestore,
  deleteConversationFromFirestore,
  saveMessageToFirestore,
  saveUserProfileToFirestore,
  getUserProfileFromFirestore,
  saveQuizResultToFirestore,
  subscribeToUserQuizResults,
  deleteQuizResultFromFirestore,
} from "../services/firebase";

export const GUEST_USER: UserProfile = {
  id: "guest_session_user",
  name: "Guest",
  displayName: "Guest",
  email: "",
  college: "Guest Access",
  branch: "Computer Science & AI",
  yearOfStudy: "3rd Year",
  targetExam: "Self Study",
  streakDays: 1,
  questionsCount: 0,
  quizzesTaken: 0,
  quizHighScore: 0,
  masteredTopics: [],
  joinedDate: "Session",
};

interface AppContextType {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAuthLoading: boolean;
  settings: UserSettings;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  selectedBranch: EngineeringBranch;
  setSelectedBranch: (branch: EngineeringBranch) => void;
  selectedStudyMode: StudyMode;
  setSelectedStudyMode: (mode: StudyMode) => void;
  selectedLanguage: ExplanationLanguage;
  setSelectedLanguage: (lang: ExplanationLanguage) => void;
  isGenerating: boolean;
  stopGeneration: () => void;
  activeQuizModal: QuizData | null;
  isGeneratingQuiz: boolean;
  quizHistory: QuizResultSummary[];
  activeQuizResult: QuizResultSummary | null;
  setActiveQuizResult: (res: QuizResultSummary | null) => void;
  activeSummaryModal: SummaryData | null;
  isGeneratingSummary: boolean;
  error: string | null;
  clearError: () => void;

  // Active Document State for Document-Based Q&A
  activeDocument: ActiveDocument | null;
  setActiveDocument: (doc: ActiveDocument | null) => void;
  isDocumentModalOpen: boolean;
  setIsDocumentModalOpen: (open: boolean) => void;
  uploadAndProcessDocument: (file: File) => Promise<ActiveDocument>;
  removeActiveDocument: () => void;
  askDocumentQuestion: (question: string) => void;
  
  // Actions
  createNewConversation: (branch?: EngineeringBranch, initialTitle?: string) => Promise<Conversation>;
  selectConversation: (id: string) => void;
  sendMessage: (content: string, file?: MessageFile) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  clearCurrentConversation: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateProfile: (newProfile: Partial<UserProfile>) => Promise<void>;
  loginWithGoogleUser: (customProfile?: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  loginWithEmailUser: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupWithEmailUser: (email: string, pass: string, profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  loginAsGuestUser: () => void;
  logoutUser: () => Promise<void>;
  launchQuiz: (topic?: string, customDifficulty?: QuizDifficulty | "Beginner" | "Intermediate" | "Advanced / GATE") => Promise<void>;
  generateQuiz: (params: { subject: string; topic: string; numQuestions: number; difficulty: QuizDifficulty }) => Promise<QuizData>;
  abortQuizGeneration: () => void;
  submitQuiz: (quiz: QuizData, selectedAnswers: Record<number, string>, timeSpentSeconds: number) => QuizResultSummary;
  deleteQuizResult: (id: string) => void;
  launchSummary: (topic?: string) => Promise<void>;
  abortSummaryGeneration: () => void;
  closeQuizModal: () => void;
  closeSummaryModal: () => void;
  recordQuizScore: (scorePercentage: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<AppPage>("landing");
  const [user, setUser] = useState<UserProfile | null>(() => {
    const p = storageService.getUserProfile();
    if (p && p.id && p.id !== "guest_session_user") return p;
    if (typeof window !== "undefined" && sessionStorage.getItem("karpom_guest_active") === "true") {
      return GUEST_USER;
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const p = storageService.getUserProfile();
    return !!p && !!p.id && p.id !== "guest_session_user";
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    const p = storageService.getUserProfile();
    return p?.id === "guest_session_user" || (typeof window !== "undefined" && sessionStorage.getItem("karpom_guest_active") === "true");
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getUserSettings());
  const [conversations, setConversations] = useState<Conversation[]>(() => storageService.getConversations());
  const [activeConvId, setActiveConvId] = useState<string | null>(() => storageService.getActiveConversationId());
  
  const [selectedBranch, setSelectedBranch] = useState<EngineeringBranch>(settings.defaultBranch || "Computer Science & AI");
  const [selectedStudyMode, setSelectedStudyMode] = useState<StudyMode>(settings.defaultStudyMode || "standard");
  const [selectedLanguage, setSelectedLanguage] = useState<ExplanationLanguage>(settings.defaultLanguage || "english");

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeQuizModal, setActiveQuizModal] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState<boolean>(false);
  const [quizHistory, setQuizHistory] = useState<QuizResultSummary[]>(() => storageService.getQuizHistory());
  const [activeQuizResult, setActiveQuizResult] = useState<QuizResultSummary | null>(null);
  const [activeSummaryModal, setActiveSummaryModal] = useState<SummaryData | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active Document State
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState<boolean>(false);

  // Generation Cancellation Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const quizAbortControllerRef = useRef<AbortController | null>(null);
  const summaryAbortControllerRef = useRef<AbortController | null>(null);

  // Derive active conversation
  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0] || null;

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        // Clear any leftover guest flag
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("karpom_guest_active");
        }
        // Fetch or create profile in Firestore
        let profile = await getUserProfileFromFirestore(firebaseUser.uid);
        if (!profile) {
          profile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Scholar",
            displayName: firebaseUser.displayName || undefined,
            email: firebaseUser.email || "",
            college: "Engineering College",
            branch: "Computer Science & AI",
            yearOfStudy: "3rd Year",
            targetExam: "University Finals & Placements",
            streakDays: 1,
            questionsCount: 0,
            quizzesTaken: 0,
            quizHighScore: 0,
            masteredTopics: [],
            joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            avatarSeed: firebaseUser.photoURL || undefined,
          };
          await saveUserProfileToFirestore(firebaseUser.uid, profile);
        }
        setUser(profile);
        setIsAuthenticated(true);
        setIsGuest(false);
        storageService.saveUserProfile(profile);
      } else {
        // Unauthenticated in Firebase
        const cachedUser = storageService.getUserProfile();
        if (cachedUser && cachedUser.id && cachedUser.id !== "guest_session_user") {
          setUser(cachedUser);
          setIsAuthenticated(true);
          setIsGuest(false);
        } else if (typeof window !== "undefined" && sessionStorage.getItem("karpom_guest_active") === "true") {
          setUser(GUEST_USER);
          setIsAuthenticated(false);
          setIsGuest(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsGuest(false);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore conversations and quiz results for the authenticated user
  useEffect(() => {
    if (isAuthenticated && user?.id && !isGuest && user.id !== "guest_session_user") {
      const unsubConvs = subscribeToUserConversations(user.id, (firestoreConvs) => {
        if (firestoreConvs && firestoreConvs.length > 0) {
          setConversations(firestoreConvs);
          storageService.saveConversations(firestoreConvs);
          // If active conversation not in list, set to first
          if (!activeConvId || !firestoreConvs.some((c) => c.id === activeConvId)) {
            setActiveConvId(firestoreConvs[0].id);
            storageService.setActiveConversationId(firestoreConvs[0].id);
          }
        }
      });

      const unsubQuizzes = subscribeToUserQuizResults(user.id, (firestoreQuizzes) => {
        if (firestoreQuizzes && firestoreQuizzes.length > 0) {
          setQuizHistory(firestoreQuizzes);
          try {
            localStorage.setItem("karpom_quiz_history_v1", JSON.stringify(firestoreQuizzes));
          } catch {
            // ignore
          }
        }
      });

      return () => {
        unsubConvs();
        unsubQuizzes();
      };
    } else {
      // Local fallback for guest scholar
      setConversations(storageService.getConversations());
      setQuizHistory(storageService.getQuizHistory());
    }
  }, [isAuthenticated, isGuest, user?.id]);

  // Persist conversations locally as well
  useEffect(() => {
    storageService.saveConversations(conversations);
  }, [conversations]);

  // Persist settings
  useEffect(() => {
    storageService.saveUserSettings(settings);
  }, [settings]);

  const clearError = () => setError(null);

  // Create new conversation
  const createNewConversation = useCallback(
    async (branch?: EngineeringBranch, initialTitle?: string): Promise<Conversation> => {
      const newBranch = branch || selectedBranch || "Computer Science & AI";
      const newConvId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newConv: Conversation = {
        id: newConvId,
        title: initialTitle || "New Academic Inquiry",
        branch: newBranch,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        isPinned: false,
        tags: [newBranch.split(" ")[0]],
      };

      // Save to local state
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      storageService.setActiveConversationId(newConv.id);
      setSelectedBranch(newBranch);

      // Save to Firestore if authenticated
      if (user?.id) {
        await createConversationInFirestore(user.id, {
          id: newConv.id,
          title: newConv.title,
          branch: newConv.branch,
          createdAt: newConv.createdAt,
          updatedAt: newConv.updatedAt,
          isPinned: false,
        });
      }

      return newConv;
    },
    [selectedBranch, user?.id]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveConvId(id);
    storageService.setActiveConversationId(id);
    const target = conversations.find((c) => c.id === id);
    if (target) {
      setSelectedBranch(target.branch);
    }
  }, [conversations]);

  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
      );
      if (user?.id) {
        await updateConversationInFirestore(user.id, id, { title: newTitle, updatedAt: Date.now() });
      }
    },
    [user?.id]
  );

  const togglePinConversation = useCallback(
    async (id: string) => {
      const target = conversations.find((c) => c.id === id);
      const nextPinState = !target?.isPinned;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isPinned: nextPinState } : c))
      );
      if (user?.id) {
        await updateConversationInFirestore(user.id, id, { isPinned: nextPinState, updatedAt: Date.now() });
      }
    },
    [conversations, user?.id]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        if (activeConvId === id) {
          const nextActive = filtered[0]?.id || null;
          setActiveConvId(nextActive);
          if (nextActive) storageService.setActiveConversationId(nextActive);
        }
        return filtered;
      });
      if (user?.id) {
        await deleteConversationFromFirestore(user.id, id);
      }
    },
    [activeConvId, user?.id]
  );

  const clearCurrentConversation = useCallback(() => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
  }, [activeConversation]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore
      }
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    // Remove streaming flag from any ongoing messages immediately
    setConversations((prev) =>
      prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.isStreaming
            ? {
                ...m,
                content: m.content.trim()
                  ? `${m.content}\n\n*(Generation stopped by user)*`
                  : "*(Generation stopped)*",
                isStreaming: false,
              }
            : m
        ),
      }))
    );
  }, []);

  // Protected route enforcement
  const checkAuthOrRedirect = (): boolean => {
    if (!isAuthenticated) {
      setCurrentPage("login");
      return false;
    }
    return true;
  };

  const uploadAndProcessDocument = async (file: File): Promise<ActiveDocument> => {
    if (!file) {
      throw new Error("No document file was selected.");
    }

    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size === 0) {
      const emptyErr = `The file "${file.name}" is empty (0 bytes). Please upload an educational document with content.`;
      setError(emptyErr);
      throw new Error(emptyErr);
    }

    if (file.size > MAX_SIZE) {
      const sizeErr = `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB, exceeding the 20MB limit. Please upload a smaller document.`;
      setError(sizeErr);
      throw new Error(sizeErr);
    }

    const fileName = file.name;
    const ext = fileName.toLowerCase().split(".").pop() || "";
    const supportedExts = ["pdf", "docx", "doc", "txt", "md", "csv", "json", "py", "cpp", "c", "java"];
    if (
      !supportedExts.includes(ext) &&
      !file.type.includes("pdf") &&
      !file.type.includes("word") &&
      !file.type.startsWith("text/")
    ) {
      const formatErr = `Unsupported format for "${fileName}". Please upload a PDF (.pdf), Word document (.docx), or Text file (.txt, .md).`;
      setError(formatErr);
      throw new Error(formatErr);
    }

    const docId = `doc-${Date.now()}`;
    let docType: ActiveDocument["docType"] = "other";
    if (ext === "pdf" || file.type.includes("pdf")) docType = "pdf";
    else if (ext === "docx" || file.type.includes("word")) docType = "docx";
    else if (ext === "md") docType = "markdown";
    else docType = "txt";

    const initialDoc: ActiveDocument = {
      id: docId,
      name: fileName,
      size: file.size,
      mimeType: file.type || (docType === "pdf" ? "application/pdf" : "text/plain"),
      docType,
      uploadedAt: Date.now(),
      status: "uploading",
      progress: 35,
    };

    setActiveDocument(initialDoc);
    setError(null);

    try {
      // 1. Read file as Base64 Data URL with progress estimation
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (pe) => {
          if (pe.lengthComputable) {
            const pct = Math.min(65, Math.round((pe.loaded / pe.total) * 30) + 35);
            setActiveDocument((prev) => (prev ? { ...prev, progress: pct } : prev));
          }
        };
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read "${fileName}".`));
        reader.readAsDataURL(file);
      });

      // 2. Transition to processing
      setActiveDocument((prev) => (prev ? { ...prev, status: "processing", progress: 75 } : prev));

      // 3. Process and extract on backend
      const processed = await processDocumentApi(fileName, base64Data, initialDoc.mimeType);

      const readyDoc: ActiveDocument = {
        id: docId,
        name: processed.fileName,
        size: processed.fileSize,
        mimeType: processed.mimeType,
        docType: processed.docType,
        extractedText: processed.extractedText,
        base64Data: processed.base64Data || (base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data),
        wordCount: processed.wordCount,
        charCount: processed.charCount,
        previewSnippet: processed.previewSnippet,
        uploadedAt: Date.now(),
        status: "ready",
        progress: 100,
      };

      setActiveDocument(readyDoc);
      return readyDoc;
    } catch (err: any) {
      const errString = err.message || "Failed to process and understand document.";
      setActiveDocument((prev) =>
        prev
          ? {
              ...prev,
              status: "error",
              errorMessage: errString,
              progress: 0,
            }
          : null
      );
      setError(errString);
      throw err;
    }
  };

  const removeActiveDocument = () => {
    setActiveDocument(null);
  };

  const askDocumentQuestion = (question: string) => {
    if (!question.trim()) return;
    sendMessage(question.trim());
  };

  const sendMessage = async (content: string, file?: MessageFile) => {
    if (!content.trim() && !file) return;

    // If an existing response is generating, smoothly abort it so the user can ask their next question immediately
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore
      }
      abortControllerRef.current = null;
    }

    let targetConv = activeConversation;
    let targetConvId = activeConvId;

    if (!targetConv || !targetConvId) {
      targetConv = await createNewConversation(selectedBranch, content.slice(0, 36) + "...");
      targetConvId = targetConv.id;
    }

    // Clean up any earlier messages that were in streaming state
    const cleanPreviousMessages = (targetConv.messages || []).map((m) =>
      m.isStreaming
        ? {
            ...m,
            content: m.content.trim()
              ? `${m.content}\n\n*(Generation interrupted by next question)*`
              : "*(Generation stopped)*",
            isStreaming: false,
          }
        : m
    );

    // Prioritize attached file, or active document if ready
    const effectiveFile: MessageFile | undefined =
      file ||
      (activeDocument && activeDocument.status === "ready"
        ? {
            name: activeDocument.name,
            mimeType: activeDocument.mimeType,
            data: activeDocument.base64Data,
            extractedText: activeDocument.extractedText,
            docType: activeDocument.docType,
            size: activeDocument.size,
            wordCount: activeDocument.wordCount,
          }
        : undefined);

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
      branch: selectedBranch,
      studyMode: selectedStudyMode,
      language: selectedLanguage,
      file: effectiveFile,
    };

    const isFirstUserMessage = cleanPreviousMessages.length === 0;
    const derivedTitle = isFirstUserMessage
      ? content.length > 40
        ? content.slice(0, 38).trim() + "..."
        : content.trim() || (effectiveFile ? `Document QA: ${effectiveFile.name}` : "Concept Inquiry")
      : targetConv.title;

    const assistantMsgId = `msg-ai-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      branch: selectedBranch,
      studyMode: selectedStudyMode,
      language: selectedLanguage,
      isStreaming: true,
    };

    const updatedMessagesWithPlaceholder = [...cleanPreviousMessages, userMessage, initialAssistantMessage];

    // 1. Save user message and initial streaming placeholder locally
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              title: derivedTitle,
              branch: selectedBranch,
              messages: updatedMessagesWithPlaceholder,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    // Save user message to Firestore
    if (user?.id) {
      saveMessageToFirestore(user.id, targetConvId, userMessage).catch((e) =>
        console.warn("Firestore save user message notice:", e)
      );
      if (isFirstUserMessage) {
        updateConversationInFirestore(user.id, targetConvId, {
          title: derivedTitle,
          branch: selectedBranch,
          updatedAt: Date.now(),
        }).catch((e) => console.warn("Firestore update title notice:", e));
      }
    }

    // Update user learning stats
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        questionsCount: (prev.questionsCount || 0) + 1,
      };
      if (user?.id) {
        saveUserProfileToFirestore(user.id, updated);
      }
      return updated;
    });

    setIsGenerating(true);
    setError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let streamAccumulatedText = "";

    try {
      // 2. Stream AI response progressively
      const completedText = await streamAcademicChat({
        messages: [...targetConv.messages, userMessage],
        studyMode: selectedStudyMode,
        branch: selectedBranch,
        language: selectedLanguage,
        fileData: effectiveFile,
        studentProfile: user
          ? {
              displayName: user.displayName || user.name,
              college: user.college,
              degreeCourse: user.degreeCourse,
              yearOfStudy: user.yearOfStudy,
              preferredLanguage: user.preferredLanguage || selectedLanguage,
              learningStyle: user.learningStyle,
            }
          : undefined,
        signal: abortController.signal,
        onChunk: (_chunk, accumulated) => {
          streamAccumulatedText = accumulated;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: accumulated, isStreaming: true }
                        : m
                    ),
                    updatedAt: Date.now(),
                  }
                : c
            )
          );
        },
      });

      const finalContent = completedText || streamAccumulatedText;
      const finalAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: finalContent,
        timestamp: Date.now(),
        branch: selectedBranch,
        studyMode: selectedStudyMode,
        language: selectedLanguage,
        isStreaming: false,
      };

      // 3. Finalize the message locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? finalAssistantMessage : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );

      // Reset generating state immediately on stream completion
      setIsGenerating(false);
      abortControllerRef.current = null;

      // 4. Save final completed response to Firestore asynchronously
      if (user?.id && finalContent.trim()) {
        saveMessageToFirestore(user.id, targetConvId, finalAssistantMessage).catch((e) =>
          console.warn("Firestore save final message notice:", e)
        );
      }
    } catch (err: any) {
      setIsGenerating(false);
      abortControllerRef.current = null;

      const isAborted = abortController.signal.aborted || err.name === "AbortError";
      if (isAborted) {
        // User stopped generation: save partial output
        const stoppedContent = streamAccumulatedText.trim()
          ? streamAccumulatedText + "\n\n*(Generation stopped by user)*"
          : "*(Generation stopped)*";

        const stoppedMessage: ChatMessage = {
          id: assistantMsgId,
          role: "assistant",
          content: stoppedContent,
          timestamp: Date.now(),
          branch: selectedBranch,
          studyMode: selectedStudyMode,
          isStreaming: false,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId ? stoppedMessage : m
                  ),
                  updatedAt: Date.now(),
                }
              : c
          )
        );

        if (user?.id && streamAccumulatedText.trim()) {
          saveMessageToFirestore(user.id, targetConvId, stoppedMessage).catch((e) =>
            console.warn("Firestore save stopped message notice:", e)
          );
        }
        return;
      }

      console.error("Streaming AI Error:", err);
      let rawError = err.message || "Failed to reach KarpomKarpipom AI engine. Please check your connection.";
      try {
        const jsonMatch = rawError.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            rawError = parsed.error.message;
          }
        }
      } catch {
        // ignore
      }

      setError(rawError);

      const isHighDemand =
        rawError.includes("high demand") ||
        rawError.includes("503") ||
        rawError.includes("UNAVAILABLE");
      const noticeContent = isHighDemand
        ? `**⚠️ Temporary Demand Spike Notice**\n\nThe AI educational servers are currently experiencing high request volume. We automatically retried across our model cluster, but the surge is ongoing.\n\n*Spikes are usually temporary and resolve in a few moments.* Please click the retry button or send your question again in a few seconds.`
        : `**⚠️ Academic Assistant Notice**\n\nI was unable to complete your query: *${rawError}*.\n\nPlease verify that your connection is active and the server environment is healthy.`;

      const fallbackErrorMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: streamAccumulatedText.trim()
          ? `${streamAccumulatedText}\n\n---\n${noticeContent}`
          : noticeContent,
        timestamp: Date.now(),
        branch: selectedBranch,
        studyMode: selectedStudyMode,
        isStreaming: false,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? fallbackErrorMessage : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );

      if (user?.id) {
        saveMessageToFirestore(user.id, targetConvId, fallbackErrorMessage).catch((e) =>
          console.warn("Firestore save error message notice:", e)
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const abortQuizGeneration = () => {
    if (quizAbortControllerRef.current) {
      quizAbortControllerRef.current.abort();
      quizAbortControllerRef.current = null;
    }
    setIsGeneratingQuiz(false);
  };

  const abortSummaryGeneration = () => {
    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
      summaryAbortControllerRef.current = null;
    }
    setIsGeneratingSummary(false);
  };

  const launchQuiz = async (
    topicOverride?: string,
    customDifficulty?: QuizDifficulty | "Beginner" | "Intermediate" | "Advanced / GATE"
  ) => {
    const topic = topicOverride || activeConversation?.title || "Engineering Fundamentals";
    if (quizAbortControllerRef.current) {
      quizAbortControllerRef.current.abort();
    }
    const ac = new AbortController();
    quizAbortControllerRef.current = ac;

    setIsGeneratingQuiz(true);
    setError(null);
    try {
      const diff: QuizDifficulty =
        customDifficulty === "Easy" || customDifficulty === "Beginner"
          ? "Easy"
          : customDifficulty === "Hard" || customDifficulty === "Advanced / GATE"
          ? "Hard"
          : "Medium";

      const quiz = await generateExamQuiz(
        {
          subject: selectedBranch,
          topic,
          numQuestions: 5,
          difficulty: diff,
          signal: ac.signal,
        }
      );
      if (!ac.signal.aborted) {
        setActiveQuizModal(quiz);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !ac.signal.aborted) {
        console.error("Quiz Error:", err);
        setError(err.message || "Failed to generate practice quiz.");
      }
    } finally {
      if (quizAbortControllerRef.current === ac) {
        quizAbortControllerRef.current = null;
      }
      setIsGeneratingQuiz(false);
    }
  };

  const generateQuiz = async (params: {
    subject: string;
    topic: string;
    numQuestions: number;
    difficulty: QuizDifficulty;
  }): Promise<QuizData> => {
    if (quizAbortControllerRef.current) {
      quizAbortControllerRef.current.abort();
    }
    const ac = new AbortController();
    quizAbortControllerRef.current = ac;

    setIsGeneratingQuiz(true);
    setError(null);
    try {
      const quiz = await generateExamQuiz({
        subject: params.subject,
        topic: params.topic,
        numQuestions: params.numQuestions,
        difficulty: params.difficulty,
        signal: ac.signal,
      });
      return quiz;
    } catch (err: any) {
      if (err.name === "AbortError" || ac.signal.aborted) {
        throw new DOMException("Assessment generation was cancelled.", "AbortError");
      }
      console.error("Generate Quiz Error:", err);
      const msg = err.message || "Failed to generate structured practice assessment.";
      setError(msg);
      throw new Error(msg);
    } finally {
      if (quizAbortControllerRef.current === ac) {
        quizAbortControllerRef.current = null;
      }
      setIsGeneratingQuiz(false);
    }
  };

  const submitQuiz = (
    quiz: QuizData,
    selectedAnswers: Record<number, string>,
    timeSpentSeconds: number
  ): QuizResultSummary => {
    let correctCount = 0;
    const records: QuizAnswerRecord[] = quiz.questions.map((q, idx) => {
      const selected = selectedAnswers[idx] || "";
      // Match correctness comparing selected with correctAnswer or correctIndex option
      const cleanSelected = selected.trim().toLowerCase();
      const cleanCorrect = (q.correctAnswer || (q.options && q.correctIndex !== undefined ? q.options[q.correctIndex] : "") || "").trim().toLowerCase();
      
      const isCorrect = cleanSelected === cleanCorrect;
      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedOption: selected,
        correctAnswer: q.correctAnswer || (q.options && q.correctIndex !== undefined ? q.options[q.correctIndex] : "Correct Option"),
        isCorrect,
        explanation: q.explanation,
        difficulty: q.difficulty || quiz.difficulty,
      };
    });

    const scorePercentage = Math.round((correctCount / Math.max(1, quiz.questions.length)) * 100);

    // Generate human-friendly performance summary
    let performanceSummary = "";
    if (scorePercentage >= 90) {
      performanceSummary = `Outstanding mastery! You achieved a score of ${scorePercentage}% on ${quiz.topic}. You demonstrated comprehensive conceptual clarity across ${quiz.difficulty} difficulty questions.`;
    } else if (scorePercentage >= 70) {
      performanceSummary = `Strong conceptual foundation with a score of ${scorePercentage}% on ${quiz.topic}. Review the detailed explanations for missed questions to solidify edge cases and derivation nuances.`;
    } else if (scorePercentage >= 50) {
      performanceSummary = `Promising start! You achieved ${scorePercentage}% on ${quiz.topic}. Revisit fundamental definitions and step-by-step problem formulations before reattempting.`;
    } else {
      performanceSummary = `Score: ${scorePercentage}%. Need more revision on ${quiz.topic}. Use KarpomKarpipom AI Tutor chat to review core theorems and first principles before retaking the assessment.`;
    }

    const summary: QuizResultSummary = {
      id: `quiz-res-${Date.now()}`,
      subject: quiz.subject || selectedBranch,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.questions.length,
      correctCount,
      scorePercentage,
      timeSpentSeconds,
      records,
      performanceSummary,
      completedAt: Date.now(),
    };

    // Update history
    setQuizHistory((prev) => {
      const updated = [summary, ...prev.filter((r) => r.id !== summary.id)].slice(0, 50);
      storageService.saveQuizResult(summary);
      return updated;
    });

    // Save to Firestore if authenticated
    if (user?.id) {
      saveQuizResultToFirestore(user.id, summary);
    }

    // Update user stats
    recordQuizScore(scorePercentage);
    setActiveQuizResult(summary);

    return summary;
  };

  const deleteQuizResult = (id: string) => {
    setQuizHistory((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem("karpom_quiz_history_v1", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    if (user?.id) {
      deleteQuizResultFromFirestore(user.id, id);
    }
    if (activeQuizResult?.id === id) {
      setActiveQuizResult(null);
    }
  };

  const launchSummary = async (topicOverride?: string) => {
    const topic = topicOverride || activeConversation?.title || "Academic Study Sheet";
    const context =
      activeConversation?.messages
        .slice(-6)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n") || "";

    if (summaryAbortControllerRef.current) {
      summaryAbortControllerRef.current.abort();
    }
    const ac = new AbortController();
    summaryAbortControllerRef.current = ac;

    setIsGeneratingSummary(true);
    setError(null);
    try {
      const summary = await generateSummarySheet(topic, context, ac.signal);
      if (!ac.signal.aborted) {
        setActiveSummaryModal(summary);
      }
    } catch (err: any) {
      if (err.name !== "AbortError" && !ac.signal.aborted) {
        console.error("Summary Error:", err);
        setError(err.message || "Failed to generate revision summary.");
      }
    } finally {
      if (summaryAbortControllerRef.current === ac) {
        summaryAbortControllerRef.current = null;
      }
      setIsGeneratingSummary(false);
    }
  };

  const closeQuizModal = () => setActiveQuizModal(null);
  const closeSummaryModal = () => setActiveSummaryModal(null);

  const recordQuizScore = (scorePercentage: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newHigh = Math.max(prev.quizHighScore, Math.round(scorePercentage));
      const updated = {
        ...prev,
        quizzesTaken: prev.quizzesTaken + 1,
        quizHighScore: newHigh,
      };
      if (user?.id) {
        saveUserProfileToFirestore(user.id, updated);
      }
      return updated;
    });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const updateProfile = async (newProfile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...newProfile } : null;
      if (updated && user?.id) {
        saveUserProfileToFirestore(user.id, updated);
      }
      return updated;
    });
  };

  // Auth Action Handlers
  const loginWithGoogleUser = async (
    customProfile?: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await signInWithGoogle();
      if (res.user) {
        let profile = await getUserProfileFromFirestore(res.user.uid);
        if (!profile) {
          profile = {
            id: res.user.uid,
            name: customProfile?.name || res.user.displayName || res.user.email?.split("@")[0] || "Scholar",
            email: customProfile?.email || res.user.email || "scholar.google@karpom.edu",
            college: customProfile?.college || "College of Engineering, Guindy",
            branch: customProfile?.branch || "Computer Science & AI",
            yearOfStudy: customProfile?.yearOfStudy || "3rd Year",
            targetExam: customProfile?.targetExam || "University Finals & Placements",
            streakDays: 1,
            questionsCount: 0,
            quizzesTaken: 0,
            quizHighScore: 0,
            masteredTopics: [],
            joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            avatarSeed: res.user.photoURL || undefined,
          };
          await saveUserProfileToFirestore(res.user.uid, profile);
        } else if (customProfile) {
          profile = { ...profile, ...customProfile };
          await saveUserProfileToFirestore(res.user.uid, profile);
        }
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("karpom_guest_active");
        }
        setUser(profile);
        setIsAuthenticated(true);
        setIsGuest(false);
        storageService.saveUserProfile(profile);
        setCurrentPage("landing");
        return { success: true };
      }
      return { success: false, error: res.error || "Google sign-in was unable to complete." };
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      return { success: false, error: err.message || "An unexpected error occurred during Google sign-in." };
    }
  };

  const loginWithEmailUser = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const res = await loginWithEmail(email, pass);
    if (res.user) {
      let profile = await getUserProfileFromFirestore(res.user.uid);
      if (!profile) {
        profile = {
          id: res.user.uid,
          name: res.user.displayName || email.split("@")[0],
          email: res.user.email || email,
          college: "Engineering College",
          branch: "Computer Science & AI",
          yearOfStudy: "3rd Year",
          targetExam: "University Finals & Placements",
          streakDays: 1,
          questionsCount: 0,
          quizzesTaken: 0,
          quizHighScore: 0,
          masteredTopics: [],
          joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        };
        await saveUserProfileToFirestore(res.user.uid, profile);
      }
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("karpom_guest_active");
      }
      setUser(profile);
      setIsAuthenticated(true);
      setIsGuest(false);
      storageService.saveUserProfile(profile);
      setCurrentPage("landing");
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const signupWithEmailUser = async (
    email: string,
    pass: string,
    profileData: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const res = await registerWithEmail(email, pass, profileData);
    if (res.user) {
      const profile: UserProfile = {
        id: res.user.uid,
        name: profileData.name || res.user.displayName || email.split("@")[0],
        email: res.user.email || email,
        college: profileData.college || "Engineering College",
        branch: profileData.branch || "Computer Science & AI",
        yearOfStudy: profileData.yearOfStudy || "3rd Year",
        targetExam: profileData.targetExam || "University Finals & Placements",
        streakDays: 1,
        questionsCount: 0,
        quizzesTaken: 0,
        quizHighScore: 0,
        masteredTopics: [],
        joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
      await saveUserProfileToFirestore(res.user.uid, profile);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("karpom_guest_active");
      }
      setUser(profile);
      setIsAuthenticated(true);
      setIsGuest(false);
      storageService.saveUserProfile(profile);
      setCurrentPage("landing");
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const loginAsGuestUser = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("karpom_guest_active", "true");
    }
    storageService.clearUserProfile();
    setUser(GUEST_USER);
    setIsAuthenticated(false);
    setIsGuest(true);
    setCurrentPage("chat");
  };

  const logoutUser = async () => {
    await logoutUserFromFirebase();
    storageService.clearUserProfile();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("karpom_guest_active");
      localStorage.removeItem("karpom_user_profile_v1");
      localStorage.removeItem("karpom_user_profile");
    }
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(false);
    setCurrentPage("landing");
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        user,
        isAuthenticated,
        isGuest,
        isAuthLoading,
        settings,
        conversations,
        activeConversation,
        selectedBranch,
        setSelectedBranch,
        selectedStudyMode,
        setSelectedStudyMode,
        selectedLanguage,
        setSelectedLanguage,
        isGenerating,
        stopGeneration,
        activeQuizModal,
        isGeneratingQuiz,
        quizHistory,
        activeQuizResult,
        setActiveQuizResult,
        generateQuiz,
        submitQuiz,
        deleteQuizResult,
        activeSummaryModal,
        isGeneratingSummary,
        error,
        clearError,
        createNewConversation,
        selectConversation,
        sendMessage,
        deleteConversation,
        renameConversation,
        togglePinConversation,
        clearCurrentConversation,
        updateSettings,
        updateProfile,
        loginWithGoogleUser,
        loginWithEmailUser,
        signupWithEmailUser,
        loginAsGuestUser,
        logoutUser,
        launchQuiz,
        abortQuizGeneration,
        launchSummary,
        abortSummaryGeneration,
        closeQuizModal,
        closeSummaryModal,
        recordQuizScore,
        activeDocument,
        setActiveDocument,
        isDocumentModalOpen,
        setIsDocumentModalOpen,
        uploadAndProcessDocument,
        removeActiveDocument,
        askDocumentQuestion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
