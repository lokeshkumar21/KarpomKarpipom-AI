export type EngineeringBranch =
  | "Computer Science & AI"
  | "Electronics & Communication"
  | "Electrical & Electronics"
  | "Mechanical & Robotics"
  | "Civil & Structural"
  | "Biotech & Chemical"
  | "Engineering Mathematics"
  | "Applied Physics & Chemistry"
  | "General Engineering";

export type StudyMode =
  | "standard"
  | "derivation"
  | "exam"
  | "socratic"
  | "code"
  | "simplify";

export type ExplanationLanguage = "english" | "tanglish" | "tamil" | "hinglish" | "hindi";

export type LearningStyle =
  | "intuitive"
  | "derivation"
  | "exam_focused"
  | "practical_code"
  | "socratic_viva"
  | "concise_summary";

export type YearOfStudy =
  | "1st Year (Freshman)"
  | "2nd Year (Sophomore)"
  | "3rd Year (Pre-final)"
  | "4th Year / Final Year"
  | "Postgraduate / Master's / PhD"
  | "Self-Learner / Professional";

export interface StudentProfileContext {
  displayName?: string;
  college?: string;
  degreeCourse?: string;
  yearOfStudy?: string;
  preferredLanguage?: ExplanationLanguage;
  learningStyle?: LearningStyle;
}

export interface MessageFile {
  data?: string; // Base64
  mimeType: string;
  name: string;
  size?: number;
  extractedText?: string;
  docType?: "pdf" | "docx" | "txt" | "markdown" | "image" | "other";
  wordCount?: number;
}

export interface ActiveDocument {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  docType: "pdf" | "docx" | "txt" | "markdown" | "other";
  extractedText?: string;
  base64Data?: string;
  uploadedAt: number;
  wordCount?: number;
  charCount?: number;
  previewSnippet?: string;
  status: "uploading" | "processing" | "ready" | "error";
  progress?: number;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  studyMode?: StudyMode;
  branch?: EngineeringBranch;
  language?: ExplanationLanguage;
  file?: MessageFile;
  isStarred?: boolean;
  feedback?: "up" | "down";
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  branch: EngineeringBranch;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  isPinned?: boolean;
  tags?: string[];
  summarySnippet?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  college?: string;
  degreeCourse?: string;
  branch: EngineeringBranch;
  yearOfStudy?: YearOfStudy | "1st Year" | "2nd Year" | "3rd Year" | "4th Year / Final" | "Postgraduate / Alumni" | string;
  preferredLanguage?: ExplanationLanguage;
  learningStyle?: LearningStyle;
  targetExam?: string;
  streakDays: number;
  questionsCount: number;
  quizzesTaken: number;
  quizHighScore: number;
  masteredTopics: string[];
  joinedDate: string;
  avatarSeed?: string;
}

export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export interface QuizQuestion {
  id?: number | string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuizDifficulty;
  // Compatibility fallback
  correctIndex?: number;
  formula?: string;
}

export interface QuizData {
  id?: string;
  subject: string;
  topic: string;
  difficulty: QuizDifficulty;
  numQuestions?: number;
  questions: QuizQuestion[];
  createdAt?: number;
}

export interface QuizAnswerRecord {
  questionIndex: number;
  question: string;
  options: string[];
  selectedOption: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  difficulty: QuizDifficulty;
}

export interface QuizResultSummary {
  id: string;
  subject: string;
  topic: string;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  records: QuizAnswerRecord[];
  performanceSummary: string;
  completedAt: number;
}

export interface KeyFormula {
  name: string;
  equation: string;
  meaning: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface SummaryData {
  title: string;
  oneMinuteSummary: string;
  keyFormulas: KeyFormula[];
  coreTakeaways: string[];
  commonExamMistakes: string[];
  flashcards: Flashcard[];
}

export interface UserSettings {
  defaultBranch: EngineeringBranch;
  defaultStudyMode: StudyMode;
  defaultLanguage: ExplanationLanguage;
  depthLevel: "Introductory" | "Undergraduate" | "Advanced (GATE/Research)";
  autoSpeak: boolean;
  voiceSpeed: number;
  cloudSyncEnabled: boolean;
  firebaseReady: boolean;
}

export type AppPage =
  | "landing"
  | "dashboard"
  | "chat"
  | "quiz"
  | "history"
  | "profile"
  | "settings"
  | "about"
  | "login"
  | "signup";
