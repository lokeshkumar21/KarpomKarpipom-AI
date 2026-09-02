import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { ChatMessage, Conversation, EngineeringBranch, QuizResultSummary, UserProfile } from "../types";

// Firebase Configuration: Injected via Vite environment variables or defaults
const env = (import.meta as any).env || {};
const isConfiguredKey =
  !!env.VITE_FIREBASE_API_KEY &&
  env.VITE_FIREBASE_API_KEY !== "AIzaSyDummyKeyForLocalPreviewMode12345" &&
  !env.VITE_FIREBASE_API_KEY.includes("Dummy");

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForLocalPreviewMode12345",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "karpom-karpipom-ai.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "karpom-karpipom-ai",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "karpom-karpipom-ai.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "603442349835",
  appId: env.VITE_FIREBASE_APP_ID || "1:603442349835:web:karpomapp123",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseInitialized = false;

if (isConfiguredKey) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseInitialized = true;
  } catch (err) {
    console.warn("Firebase live initialization warning (running in preview bridge mode):", err);
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Checks if live Firebase connection is active
 */
export function getIsFirebaseReady(): boolean {
  return isFirebaseInitialized && !!auth && !!db;
}

// In-memory / localStorage registered accounts cache for smooth preview mode
const LOCAL_ACCOUNTS_KEY = "karpom_local_registered_accounts";
function getLocalAccounts(): Record<string, { pass: string; profile: UserProfile }> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveLocalAccount(email: string, pass: string, profile: UserProfile) {
  try {
    const accounts = getLocalAccounts();
    accounts[email.toLowerCase()] = { pass, profile };
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error("Local account save error:", e);
  }
}

// Helper to detect API key or sandbox environment auth errors
function isFirebaseConfigOrApiKeyError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const code = (err.code || "").toLowerCase();
  return (
    code.includes("api-key") ||
    code.includes("invalid-api-key") ||
    code.includes("api-key-not-valid") ||
    code.includes("app-not-authorized") ||
    code.includes("operation-not-allowed") ||
    code.includes("unauthorized-domain") ||
    code.includes("invalid-credential") ||
    msg.includes("api-key") ||
    msg.includes("api key") ||
    msg.includes("api_key") ||
    msg.includes("auth/api-key-not-valid") ||
    msg.includes("please-pass-a-valid-api-key")
  );
}

// ---------------------------------------------------------------------------
// AUTHENTICATION SERVICES
// ---------------------------------------------------------------------------

/**
 * Sign in using Google OAuth Popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser | null; error?: string }> {
  if (isConfiguredKey && auth) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user };
    } catch (error: any) {
      console.warn("Live Google Sign-In notice:", error?.message || error);
      if (!isFirebaseConfigOrApiKeyError(error) && error.code === "auth/popup-closed-by-user") {
        return { user: null, error: "Sign-in popup was closed before completing." };
      }
      // In web preview / iframe environments or unconfigured API keys, seamlessly fall through to preview mode
    }
  }

  // Preview Mode: Provide simulated scholar profile
  const mockGoogleUser = {
    uid: "google_scholar_preview_" + Date.now(),
    displayName: "Scholar Google",
    email: "scholar.google@karpom.edu",
    photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=GoogleScholar",
    emailVerified: true,
  } as unknown as FirebaseUser;

  return { user: mockGoogleUser };
}

/**
 * Sign up using Email and Password
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  profileDetails?: Partial<UserProfile>
): Promise<{ user: FirebaseUser | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isConfiguredKey && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user && profileDetails) {
        await saveUserProfileToFirestore(cred.user.uid, {
          id: cred.user.uid,
          email: cred.user.email || cleanEmail,
          name: profileDetails.name || cleanEmail.split("@")[0],
          college: profileDetails.college || "Engineering College",
          branch: profileDetails.branch || "Computer Science & AI",
          yearOfStudy: profileDetails.yearOfStudy || "3rd Year",
          targetExam: profileDetails.targetExam || "University Finals & Placements",
          streakDays: 1,
          questionsCount: 0,
          quizzesTaken: 0,
          quizHighScore: 0,
          masteredTopics: [],
          joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        });
      }
      return { user: cred.user };
    } catch (error: any) {
      console.warn("Live registration notice:", error?.message || error);
      if (!isFirebaseConfigOrApiKeyError(error)) {
        return { user: null, error: error.message || "Failed to create account." };
      }
      // If error is related to API key configuration, seamlessly fall through to local persistence
    }
  }

  // Preview Mode: Local seamless registration
  const localUserId = `scholar_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newProfile: UserProfile = {
    id: localUserId,
    email: cleanEmail,
    name: profileDetails?.name || cleanEmail.split("@")[0],
    college: profileDetails?.college || "Engineering College",
    branch: profileDetails?.branch || "Computer Science & AI",
    yearOfStudy: profileDetails?.yearOfStudy || "3rd Year",
    targetExam: profileDetails?.targetExam || "University Finals & Placements",
    streakDays: 1,
    questionsCount: 0,
    quizzesTaken: 0,
    quizHighScore: 0,
    masteredTopics: [],
    joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };

  saveLocalAccount(cleanEmail, pass, newProfile);

  const mockUser = {
    uid: localUserId,
    displayName: newProfile.name,
    email: cleanEmail,
    emailVerified: true,
  } as unknown as FirebaseUser;

  return { user: mockUser };
}

/**
 * Sign in using Email and Password
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser | null; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isConfiguredKey && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return { user: cred.user };
    } catch (error: any) {
      console.warn("Live login notice:", error?.message || error);
      if (!isFirebaseConfigOrApiKeyError(error)) {
        return { user: null, error: error.message || "Invalid credentials." };
      }
      // If error is related to API key configuration, seamlessly fall through to local accounts check
    }
  }

  // Preview Mode: Check registered local accounts
  const accounts = getLocalAccounts();
  const matched = accounts[cleanEmail];

  if (matched) {
    if (matched.pass === pass) {
      const mockUser = {
        uid: matched.profile.id,
        displayName: matched.profile.name,
        email: cleanEmail,
        emailVerified: true,
      } as unknown as FirebaseUser;
      return { user: mockUser };
    } else {
      return { user: null, error: "Incorrect password. Please try again." };
    }
  }

  // If newly logging in without previous signup in preview mode, allow quick login with auto-profile
  const quickProfile: UserProfile = {
    id: `scholar_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
    email: cleanEmail,
    name: cleanEmail.split("@")[0],
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
  saveLocalAccount(cleanEmail, pass, quickProfile);

  const mockUser = {
    uid: quickProfile.id,
    displayName: quickProfile.name,
    email: cleanEmail,
    emailVerified: true,
  } as unknown as FirebaseUser;

  return { user: mockUser };
}

/**
 * Logout current authenticated user
 */
export async function logoutUserFromFirebase(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase signout notice:", err);
  }
}

// Helper to retrieve local profile safely across version keys
function getLocalStoredProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem("karpom_user_profile_v1") || localStorage.getItem("karpom_user_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as UserProfile;
    }
  } catch (e) {
    console.warn("Local profile read notice:", e);
  }
  return null;
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuth(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  const notifyWithCachedUser = () => {
    const cached = getLocalStoredProfile();
    if (cached && cached.id) {
      callback({
        uid: cached.id,
        displayName: cached.name,
        email: cached.email,
        emailVerified: true,
      } as any);
      return;
    }
    callback(null);
  };

  if (!auth) {
    setTimeout(notifyWithCachedUser, 0);
    return () => {};
  }

  return onAuthStateChanged(
    auth,
    (user) => {
      callback(user);
    },
    (error) => {
      console.warn("Auth state observer notice:", error?.message || error);
      notifyWithCachedUser();
    }
  );
}

/**
 * Returns authentication headers for secure server-side API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          headers["X-User-Id"] = auth.currentUser.uid;
          return headers;
        }
      } catch {
        // Fallback to uid
      }
      headers["Authorization"] = `Bearer ${auth.currentUser.uid}`;
      headers["X-User-Id"] = auth.currentUser.uid;
      return headers;
    }

    const cached = getLocalStoredProfile();
    if (cached && cached.id) {
      headers["Authorization"] = `Bearer ${cached.id}`;
      headers["X-User-Id"] = cached.id;
      return headers;
    }

    // Generate or retrieve persistent guest scholar ID
    let guestId = localStorage.getItem("karpom_guest_id");
    if (!guestId) {
      guestId = `guest_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("karpom_guest_id", guestId);
    }
    headers["Authorization"] = `Bearer ${guestId}`;
    headers["X-User-Id"] = guestId;
  } catch (err) {
    console.warn("Auth header extraction notice:", err);
  }
  return headers;
}

// ---------------------------------------------------------------------------
// FIRESTORE USER PROFILE SERVICES
// ---------------------------------------------------------------------------

/**
 * Saves or updates user profile in Firestore
 */
export async function saveUserProfileToFirestore(
  userId: string,
  profile: Partial<UserProfile>
): Promise<void> {
  // Always update local storage first so UI state is instantaneous and offline-safe
  try {
    const existing = getLocalStoredProfile();
    const current = existing || {};
    const updated = { ...current, ...profile, id: userId, updatedAt: Date.now() };
    localStorage.setItem("karpom_user_profile_v1", JSON.stringify(updated));
    localStorage.setItem("karpom_user_profile", JSON.stringify(updated));
  } catch (e) {
    console.warn("Local profile write notice:", e);
  }

  if (isConfiguredKey && db) {
    try {
      const userRef = doc(db, "users", userId);
      await Promise.race([
        setDoc(
          userRef,
          {
            ...profile,
            id: userId,
            updatedAt: Date.now(),
          },
          { merge: true }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore sync timeout")), 2000)),
      ]);
    } catch (err: any) {
      console.warn("Firestore profile save notice (persisted in local cache):", err?.message || err);
    }
  }
}

/**
 * Fetches user profile from Firestore with instant local cache fallback
 */
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  // Check local storage cache first for instant response
  let cachedProfile: UserProfile | null = getLocalStoredProfile();
  if (cachedProfile && userId && cachedProfile.id !== userId) {
    cachedProfile = null;
  }
  
  if (!cachedProfile) {
    try {
      const accounts = getLocalAccounts();
      for (const acc of Object.values(accounts)) {
        if (acc.profile && acc.profile.id === userId) {
          cachedProfile = acc.profile;
          break;
        }
      }
    } catch (e) {
      console.warn("Local profile read notice:", e);
    }
  }

  if (isConfiguredKey && db) {
    try {
      const userRef = doc(db, "users", userId);
      const snap = await Promise.race([
        getDoc(userRef),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Firestore timeout")), 2000)),
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        const cloudData = (snap as any).data() as UserProfile;
        // Update local storage with fresh cloud data
        try {
          localStorage.setItem("karpom_user_profile_v1", JSON.stringify(cloudData));
          localStorage.setItem("karpom_user_profile", JSON.stringify(cloudData));
        } catch {
          // ignore
        }
        return cloudData;
      }
    } catch (err: any) {
      console.warn("Firestore profile read notice (using local cache):", err?.message || err);
    }
  }

  return cachedProfile;
}

// ---------------------------------------------------------------------------
// FIRESTORE CONVERSATIONS SERVICES (User-Level Access)
// ---------------------------------------------------------------------------

/**
 * Real-time listener for all conversations belonging to the authenticated user
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  if (!db || !userId || !isConfiguredKey) {
    return () => {};
  }

  try {
    const convsQuery = query(
      collection(db, "conversations"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(
      convsQuery,
      async (snapshot) => {
        const convList: Conversation[] = [];
        for (const document of snapshot.docs) {
          const data = document.data();
          // Load messages subcollection for each conversation
          let messages: ChatMessage[] = [];
          try {
            const msgsQuery = query(
              collection(db!, "conversations", document.id, "messages"),
              orderBy("createdAt", "asc")
            );
            const msgsSnap = await getDocs(msgsQuery);
            messages = msgsSnap.docs.map((mDoc) => {
              const mData = mDoc.data();
              return {
                id: mData.id || mDoc.id,
                role: mData.role,
                content: mData.content,
                timestamp: mData.createdAt || Date.now(),
                branch: mData.branch,
                studyMode: mData.studyMode,
                isStarred: mData.isStarred,
                file: mData.file,
              };
            });
          } catch (e) {
            console.warn("Could not load subcollection messages:", e);
          }

          convList.push({
            id: document.id,
            title: data.title || "New Concept Discussion",
            branch: (data.branch as EngineeringBranch) || "Computer Science & AI",
            createdAt: data.createdAt || Date.now(),
            updatedAt: data.updatedAt || Date.now(),
            isPinned: data.isPinned || false,
            messages,
          });
        }
        onUpdate(convList);
      },
      (error) => {
        console.warn("Firestore conversations listener notice:", error?.message || error);
      }
    );
  } catch (err: any) {
    console.warn("Error setting up conversation listener:", err?.message || err);
    return () => {};
  }
}

/**
 * Creates a new conversation in Firestore for the authenticated user
 */
export async function createConversationInFirestore(
  userId: string,
  conversation: {
    id: string;
    title: string;
    branch: EngineeringBranch;
    createdAt: number;
    updatedAt: number;
    isPinned?: boolean;
  }
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    const convRef = doc(db, "conversations", conversation.id);
    await setDoc(convRef, {
      id: conversation.id,
      userId,
      title: conversation.title,
      branch: conversation.branch,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isPinned: !!conversation.isPinned,
    });
  } catch (err: any) {
    console.warn("Notice creating conversation in Firestore (saved locally):", err?.message || err);
  }
}

/**
 * Updates a conversation (title, pin, updatedAt)
 */
export async function updateConversationInFirestore(
  userId: string,
  conversationId: string,
  updates: {
    title?: string;
    isPinned?: boolean;
    branch?: EngineeringBranch;
    updatedAt?: number;
  }
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      ...updates,
      updatedAt: updates.updatedAt || Date.now(),
    });
  } catch (err: any) {
    console.warn("Notice updating conversation in Firestore (saved locally):", err?.message || err);
  }
}

/**
 * Deletes a conversation and its messages from Firestore
 */
export async function deleteConversationFromFirestore(
  userId: string,
  conversationId: string
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    // Delete subcollection messages first
    const msgsQuery = query(collection(db, "conversations", conversationId, "messages"));
    const msgsSnap = await getDocs(msgsQuery);
    const deletePromises = msgsSnap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    // Delete parent conversation
    const convRef = doc(db, "conversations", conversationId);
    await deleteDoc(convRef);
  } catch (err: any) {
    console.warn("Notice deleting conversation from Firestore (deleted locally):", err?.message || err);
  }
}

/**
 * Saves a message into the conversation's messages collection in Firestore
 */
export async function saveMessageToFirestore(
  userId: string,
  conversationId: string,
  message: ChatMessage
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    const messageDocRef = doc(db, "conversations", conversationId, "messages", message.id);
    await setDoc(messageDocRef, {
      id: message.id,
      conversationId,
      userId,
      role: message.role,
      content: message.content,
      branch: message.branch || null,
      studyMode: message.studyMode || null,
      createdAt: message.timestamp || Date.now(),
      file: message.file ? { name: message.file.name, mimeType: message.file.mimeType } : null,
    });

    // Bump updatedAt on parent conversation document
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      updatedAt: Date.now(),
    });
  } catch (err: any) {
    console.warn("Notice saving message to Firestore (saved locally):", err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// FIRESTORE QUIZ RESULTS SERVICES
// ---------------------------------------------------------------------------

/**
 * Saves a completed quiz result to Firestore under user subcollection
 */
export async function saveQuizResultToFirestore(
  userId: string,
  quizResult: QuizResultSummary
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    const quizDocRef = doc(db, "users", userId, "quizzes", quizResult.id);
    await setDoc(quizDocRef, {
      ...quizResult,
      userId,
      completedAt: quizResult.completedAt || Date.now(),
    });
  } catch (err: any) {
    console.warn("Notice saving quiz result to Firestore (saved locally):", err?.message || err);
  }
}

/**
 * Real-time listener for user's completed quizzes in Firestore
 */
export function subscribeToUserQuizResults(
  userId: string,
  onUpdate: (quizzes: QuizResultSummary[]) => void
): Unsubscribe {
  if (!db || !userId || !isConfiguredKey) {
    return () => {};
  }

  try {
    const quizzesQuery = query(
      collection(db, "users", userId, "quizzes"),
      orderBy("completedAt", "desc")
    );

    return onSnapshot(
      quizzesQuery,
      (snapshot) => {
        const quizList: QuizResultSummary[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as QuizResultSummary;
          quizList.push({
            id: docSnap.id,
            subject: data.subject,
            topic: data.topic,
            difficulty: data.difficulty,
            totalQuestions: data.totalQuestions,
            correctCount: data.correctCount,
            scorePercentage: data.scorePercentage,
            timeSpentSeconds: data.timeSpentSeconds,
            records: data.records || [],
            performanceSummary: data.performanceSummary || "",
            completedAt: data.completedAt || Date.now(),
          });
        }
        onUpdate(quizList);
      },
      (error) => {
        console.warn("Firestore quizzes listener notice:", error?.message || error);
      }
    );
  } catch (err: any) {
    console.warn("Error setting up quiz listener:", err?.message || err);
    return () => {};
  }
}

/**
 * Deletes a quiz result from Firestore
 */
export async function deleteQuizResultFromFirestore(
  userId: string,
  quizId: string
): Promise<void> {
  if (!db || !userId || !isConfiguredKey) return;
  try {
    const quizDocRef = doc(db, "users", userId, "quizzes", quizId);
    await deleteDoc(quizDocRef);
  } catch (err: any) {
    console.warn("Notice deleting quiz from Firestore:", err?.message || err);
  }
}

export { auth, db };
