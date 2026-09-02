import { Conversation, UserProfile, UserSettings, EngineeringBranch, QuizResultSummary } from "../types";

const CONVERSATIONS_KEY = "karpom_conversations_v1";
const ACTIVE_CONV_ID_KEY = "karpom_active_conv_id";
const USER_PROFILE_KEY = "karpom_user_profile_v1";
const USER_SETTINGS_KEY = "karpom_user_settings_v1";
const QUIZ_HISTORY_KEY = "karpom_quiz_history_v1";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  defaultBranch: "Computer Science & AI",
  defaultStudyMode: "standard",
  defaultLanguage: "english",
  depthLevel: "Undergraduate",
  autoSpeak: false,
  voiceSpeed: 1,
  cloudSyncEnabled: false,
  firebaseReady: true,
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-init-1",
    title: "Fast Fourier Transform (FFT) & Cooley-Tukey Algorithm",
    branch: "Electronics & Communication",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isPinned: true,
    tags: ["DSP", "Algorithms", "Signals"],
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "Can you explain how the Fast Fourier Transform (FFT) reduces computational complexity from O(N^2) to O(N log N)? Please give a concrete derivation of the butterfly computation.",
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
        branch: "Electronics & Communication",
        studyMode: "derivation",
      },
      {
        id: "msg-2",
        role: "assistant",
        content: `### Fast Fourier Transform (FFT) & The Cooley-Tukey Divide-and-Conquer

The Discrete Fourier Transform (DFT) transforms a time-domain sequence $x[n]$ of length $N$ into its frequency-domain representation $X[k]$:

$$X[k] = \\sum_{n=0}^{N-1} x[n] \\cdot W_N^{kn}, \\quad \\text{where } W_N = e^{-j\\frac{2\\pi}{N}}$$

Here, $W_N$ is known as the **twiddle factor**.

---

### 1. Why is Naive DFT $O(N^2)$?
For each frequency bin $k \\in [0, N-1]$, we must compute a summation of $N$ terms. Each term requires 1 complex multiplication and 1 complex addition:
- **Total Complex Multiplications:** $N \\times N = N^2$
- For $N = 1024$, $N^2 \\approx 1,048,576$ operations!

---

### 2. The Cooley-Tukey Radix-2 Formulation
Assuming $N$ is a power of 2, we partition $x[n]$ into **even-indexed** and **odd-indexed** samples:

$$X[k] = \\sum_{r=0}^{N/2-1} x[2r] W_N^{2rk} + \\sum_{r=0}^{N/2-1} x[2r+1] W_N^{(2r+1)k}$$

Notice the twiddle factor property:
$$W_N^{2rk} = \\left(e^{-j\\frac{2\\pi}{N}}\\right)^{2rk} = e^{-j\\frac{2\\pi}{N/2} rk} = W_{N/2}^{rk}$$

Factor out $W_N^k$ from the odd summation:
$$X[k] = \\underbrace{\\sum_{r=0}^{N/2-1} x[2r] W_{N/2}^{rk}}_{E[k] \\text{ (DFT of Even Samples)}} + W_N^k \\cdot \\underbrace{\\sum_{r=0}^{N/2-1} x[2r+1] W_{N/2}^{rk}}_{O[k] \\text{ (DFT of Odd Samples)}}$$

$$X[k] = E[k] + W_N^k \\cdot O[k]$$

---

### 3. The Butterfly Symmetry (Halving the Work)
Using the periodicity of DFTs ($E[k + N/2] = E[k]$ and $O[k + N/2] = O[k]$) and the symmetry of the twiddle factor:
$$W_N^{k + N/2} = -W_N^k$$

We get two frequency bins from one set of calculations:
$$\\begin{aligned}
X[k] &= E[k] + W_N^k O[k] \\\\
X\\left[k + \\frac{N}{2}\\right] &= E[k] - W_N^k O[k]
\\end{aligned}$$

This symmetric cross-addition is the **Butterfly Operation**.

---

### 4. Complexity Reduction
- **Recursion relation:** $T(N) = 2T(N/2) + O(N)$
- By the Master Theorem: $T(N) = O(N \\log_2 N)$
- For $N = 1024$: $N \\log_2 N = 1024 \\times 10 = 10,240$ operations (over **100x faster** than naive DFT!).`,
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 + 10000,
        branch: "Electronics & Communication",
        studyMode: "derivation",
      },
    ],
  },
  {
    id: "conv-init-2",
    title: "Operating Systems: Deadlock Conditions & Banker's Algorithm",
    branch: "Computer Science & AI",
    createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
    isPinned: false,
    tags: ["OS", "Concurrency", "Exam Prep"],
    messages: [
      {
        id: "msg-3",
        role: "user",
        content: "What are Coffman's 4 conditions for Deadlock, and how does Dijkstra's Banker's Algorithm guarantee safety?",
        timestamp: Date.now() - 1000 * 60 * 60 * 6,
        branch: "Computer Science & AI",
        studyMode: "standard",
      },
      {
        id: "msg-4",
        role: "assistant",
        content: `### Deadlock & The Banker's Algorithm Guide

A **Deadlock** is a state where a set of processes are permanently blocked because each process is holding a resource and waiting for another resource acquired by some other process in the set.

---

### 1. Coffman's 4 Necessary Conditions
A deadlock **CANNOT occur** unless all four conditions hold simultaneously:

1. **Mutual Exclusion:** At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. **Hold and Wait:** A process must be holding at least one resource and requesting additional resources currently held by others.
3. **No Preemption:** Resources cannot be forcibly taken away; they can only be released voluntarily by the holding process upon task completion.
4. **Circular Wait:** A closed chain of processes exists: $P_0$ waits for $P_1$, $P_1$ waits for $P_2$, ..., and $P_n$ waits for $P_0$.

---

### 2. Banker's Algorithm (Dijkstra's Deadlock Avoidance)

The algorithm acts like a cautious bank manager who will **never allocate cash** unless there is a safe path to satisfy all loan commitments.

#### Core Data Structures ($n$ processes, $m$ resource types):
- **Available $[m]$:** Vector of available instances of each resource.
- **Max $[n][m]$:** Maximum demand of each process.
- **Allocation $[n][m]$:** Resources currently allocated to each process.
- **Need $[n][m]$:** Remaining resources required:
  $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$

#### Safety Algorithm Check:
1. Let $\\text{Work} = \\text{Available}$ and $\\text{Finish}[i] = \\text{false}$ for all $i$.
2. Find an index $i$ such that:
   $$\\text{Finish}[i] == \\text{false} \\quad \\text{and} \\quad \\text{Need}[i] \\le \\text{Work}$$
   If no such $i$ exists, go to Step 4.
3. $\\text{Work} = \\text{Work} + \\text{Allocation}[i]$; $\\text{Finish}[i] = \\text{true}$. Go back to Step 2.
4. If $\\text{Finish}[i] == \\text{true}$ for all $i$, the system is in a **Safe State**! (A safe sequence exists where every process can complete without deadlock).`,
        timestamp: Date.now() - 1000 * 60 * 60 * 6 + 8000,
        branch: "Computer Science & AI",
        studyMode: "standard",
      },
    ],
  },
];

export const storageService = {
  getConversations(): Conversation[] {
    try {
      const stored = localStorage.getItem(CONVERSATIONS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with sample high-yield academic conversations
      this.saveConversations(INITIAL_CONVERSATIONS);
      return INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  },

  getActiveConversationId(): string | null {
    return localStorage.getItem(ACTIVE_CONV_ID_KEY) || (INITIAL_CONVERSATIONS[0]?.id ?? null);
  },

  setActiveConversationId(id: string): void {
    localStorage.setItem(ACTIVE_CONV_ID_KEY, id);
  },

  getUserProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(USER_PROFILE_KEY);
      if (stored) return JSON.parse(stored);
      return null;
    } catch {
      return null;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  },

  clearUserProfile(): void {
    localStorage.removeItem(USER_PROFILE_KEY);
  },

  getUserSettings(): UserSettings {
    try {
      const stored = localStorage.getItem(USER_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
      this.saveUserSettings(DEFAULT_USER_SETTINGS);
      return DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  },

  saveUserSettings(settings: UserSettings): void {
    localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(settings));
  },

  getQuizHistory(): QuizResultSummary[] {
    try {
      const stored = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  },

  saveQuizResult(result: QuizResultSummary): void {
    try {
      const current = this.getQuizHistory();
      const updated = [result, ...current.filter((q) => q.id !== result.id)].slice(0, 50);
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist quiz result:", e);
    }
  },

  clearAllData(): void {
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(ACTIVE_CONV_ID_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(USER_SETTINGS_KEY);
    localStorage.removeItem(QUIZ_HISTORY_KEY);
  },
};
