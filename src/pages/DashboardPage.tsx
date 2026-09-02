import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  GraduationCap,
  MessageSquare,
  Award,
  Flame,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Layers,
  ChevronRight,
  Plus,
  RefreshCw,
  FolderX,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EngineeringBranch } from "../types";

export const DashboardPage: React.FC = () => {
  const {
    user,
    conversations,
    quizHistory,
    setCurrentPage,
    selectConversation,
    createNewConversation,
    launchQuiz,
  } = useApp();

  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");

  // ---------------------------------------------------------------------------
  // 1. COMPUTED METRICS DIRECTLY FROM FIRESTORE / REAL APP DATA
  // ---------------------------------------------------------------------------

  // Real question count from user messages in conversations
  const questionsInConversations = useMemo(() => {
    return conversations.reduce((acc, conv) => {
      return acc + (conv.messages ? conv.messages.filter((m) => m.role === "user").length : 0);
    }, 0);
  }, [conversations]);

  const totalQuestionsAsked = Math.max(questionsInConversations, user?.questionsCount || 0);
  const totalConversations = conversations.length;
  const quizzesCompleted = Math.max(quizHistory.length, user?.quizzesTaken || 0);

  // Real Average Quiz Score & Question Accuracy
  const quizAccuracyMetrics = useMemo(() => {
    if (quizHistory.length === 0) {
      return {
        avgScore: user?.quizHighScore && user.quizzesTaken > 0 ? user.quizHighScore : 0,
        totalQuestionsAnswered: 0,
        totalCorrectQuestions: 0,
        accuracyRate: 0,
        hasData: quizHistory.length > 0 || (user?.quizzesTaken || 0) > 0,
      };
    }

    const totalScoreSum = quizHistory.reduce((sum, q) => sum + (q.scorePercentage || 0), 0);
    const avgScore = Math.round(totalScoreSum / quizHistory.length);

    const totalQuestionsAnswered = quizHistory.reduce((sum, q) => sum + (q.totalQuestions || 0), 0);
    const totalCorrectQuestions = quizHistory.reduce((sum, q) => sum + (q.correctCount || 0), 0);
    const accuracyRate = totalQuestionsAnswered > 0
      ? Math.round((totalCorrectQuestions / totalQuestionsAnswered) * 100)
      : avgScore;

    return {
      avgScore,
      totalQuestionsAnswered,
      totalCorrectQuestions,
      accuracyRate,
      hasData: true,
    };
  }, [quizHistory, user]);

  // ---------------------------------------------------------------------------
  // 2. RECENTLY STUDIED TOPICS (Derived from Conversations + Quizzes + Profile)
  // ---------------------------------------------------------------------------
  const recentlyStudiedTopics = useMemo(() => {
    const topicMap = new Map<
      string,
      {
        topic: string;
        branch: string;
        lastStudied: number;
        source: "conversation" | "quiz" | "curriculum";
        detail?: string;
        conversationId?: string;
      }
    >();

    // Add topics from conversations
    conversations.forEach((conv) => {
      if (conv.title && conv.title !== "New Academic Inquiry") {
        const key = conv.title.trim().toLowerCase();
        if (!topicMap.has(key) || (conv.updatedAt || conv.createdAt) > (topicMap.get(key)?.lastStudied || 0)) {
          topicMap.set(key, {
            topic: conv.title,
            branch: conv.branch,
            lastStudied: conv.updatedAt || conv.createdAt || Date.now(),
            source: "conversation",
            detail: `${conv.messages?.length || 0} messages discussed`,
            conversationId: conv.id,
          });
        }
      }
    });

    // Add topics from quiz history
    quizHistory.forEach((q) => {
      if (q.topic) {
        const key = q.topic.trim().toLowerCase();
        const existing = topicMap.get(key);
        if (!existing || q.completedAt > existing.lastStudied) {
          topicMap.set(key, {
            topic: q.topic,
            branch: q.subject || user?.branch || "Engineering",
            lastStudied: q.completedAt || Date.now(),
            source: "quiz",
            detail: `Quiz completed (${q.scorePercentage}% score · ${q.difficulty})`,
          });
        }
      }
    });

    // Add mastered topics if user has them and no match yet
    if (user?.masteredTopics) {
      user.masteredTopics.forEach((t) => {
        const key = t.trim().toLowerCase();
        if (!topicMap.has(key)) {
          topicMap.set(key, {
            topic: t,
            branch: user.branch || "General Engineering",
            lastStudied: Date.now() - 1000 * 60 * 60 * 24 * 3,
            source: "curriculum",
            detail: "Mastered in study profile",
          });
        }
      });
    }

    return Array.from(topicMap.values())
      .sort((a, b) => b.lastStudied - a.lastStudied)
      .slice(0, 6);
  }, [conversations, quizHistory, user]);

  // ---------------------------------------------------------------------------
  // 3. RECENT CONVERSATIONS (Sorted Chronologically)
  // ---------------------------------------------------------------------------
  const recentConversations = useMemo(() => {
    return [...conversations]
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
      .slice(0, 5);
  }, [conversations]);

  // ---------------------------------------------------------------------------
  // 4. LEARNING ACTIVITY OVER TIME (Aggregated by Day)
  // ---------------------------------------------------------------------------
  const { activityTimeline, totalPeriodActivity, hasActivityData } = useMemo(() => {
    const daysCount = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    const now = new Date();
    const days: {
      dateKey: string;
      displayDate: string;
      dayName: string;
      questions: number;
      quizzes: number;
      total: number;
    }[] = [];

    // Pre-populate days
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const displayDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

      days.push({
        dateKey,
        displayDate,
        dayName,
        questions: 0,
        quizzes: 0,
        total: 0,
      });
    }

    let totalPeriodQuestions = 0;
    let totalPeriodQuizzes = 0;

    // Aggregate user questions from messages
    conversations.forEach((conv) => {
      if (conv.messages) {
        conv.messages.forEach((msg) => {
          if (msg.role === "user" && msg.timestamp) {
            const msgDateKey = new Date(msg.timestamp).toISOString().split("T")[0];
            const targetDay = days.find((d) => d.dateKey === msgDateKey);
            if (targetDay) {
              targetDay.questions += 1;
              targetDay.total += 1;
              totalPeriodQuestions += 1;
            }
          }
        });
      }
    });

    // Aggregate quizzes
    quizHistory.forEach((q) => {
      if (q.completedAt) {
        const qDateKey = new Date(q.completedAt).toISOString().split("T")[0];
        const targetDay = days.find((d) => d.dateKey === qDateKey);
        if (targetDay) {
          targetDay.quizzes += 1;
          targetDay.total += 1;
          totalPeriodQuizzes += 1;
        }
      }
    });

    const totalActivity = totalPeriodQuestions + totalPeriodQuizzes;

    return {
      activityTimeline: days,
      totalPeriodActivity: totalActivity,
      hasActivityData: totalActivity > 0,
    };
  }, [conversations, quizHistory, timeRange]);

  // ---------------------------------------------------------------------------
  // 5. SUBJECT / BRANCH BREAKDOWN
  // ---------------------------------------------------------------------------
  const branchBreakdown = useMemo(() => {
    const countByBranch: Record<string, number> = {};

    conversations.forEach((c) => {
      const b = c.branch || "Computer Science & AI";
      countByBranch[b] = (countByBranch[b] || 0) + 1;
    });

    quizHistory.forEach((q) => {
      const b = q.subject || "Computer Science & AI";
      countByBranch[b] = (countByBranch[b] || 0) + 1;
    });

    const entries = Object.entries(countByBranch).map(([name, value]) => ({
      name,
      value,
    }));

    return entries.sort((a, b) => b.value - a.value);
  }, [conversations, quizHistory]);

  const BRANCH_COLORS = [
    "#059669", // emerald-600
    "#0d9488", // teal-600
    "#2563eb", // blue-600
    "#d97706", // amber-600
    "#7c3aed", // violet-600
    "#db2777", // pink-600
    "#475569", // slate-600
  ];

  // Helper for formatting timestamps
  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* =====================================================================
            DASHBOARD HEADER & STUDENT PROFILE SUMMARY
        ===================================================================== */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <GraduationCap className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  {user?.name || "Student Scholar"}'s Dashboard
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{user?.branch || "Engineering & Technology"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{user?.college || "Academic Engineering Institute"}</span>
                <span>•</span>
                <span>{user?.yearOfStudy || "Engineering Scholar"}</span>
                <span>•</span>
                <span className="text-emerald-800 font-semibold">{user?.targetExam || "GATE & University Finals"}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="dashboard-new-query-btn"
              onClick={() => {
                createNewConversation();
                setCurrentPage("chat");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ask New Question</span>
            </button>

            <button
              id="dashboard-launch-quiz-btn"
              onClick={() => setCurrentPage("quiz")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Quiz Studio</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            PRIMARY METRICS BENTO GRID (REAL FIRESTORE DATA)
        ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Questions Asked */}
          <div
            id="metric-questions-asked"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Questions Asked
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                {totalQuestionsAsked}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                {totalQuestionsAsked > 0 ? (
                  <>
                    <span className="font-semibold text-emerald-800">{totalQuestionsAsked} queries</span>
                    <span>logged across all sessions</span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">No questions asked yet</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 2: Total Conversations */}
          <div
            id="metric-total-conversations"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Total Conversations
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                {totalConversations}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                {totalConversations > 0 ? (
                  <>
                    <span className="font-semibold text-teal-800">{totalConversations} study threads</span>
                    <span>stored in cloud sync</span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">No conversations initiated</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 3: Quizzes Completed */}
          <div
            id="metric-quizzes-completed"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quizzes Completed
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                {quizzesCompleted}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                {quizzesCompleted > 0 ? (
                  <>
                    <span className="font-semibold text-amber-800">{quizzesCompleted} assessments</span>
                    <span>evaluated & scored</span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">No tests taken yet</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 4: Quiz Accuracy / Average Score */}
          <div
            id="metric-quiz-accuracy"
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quiz Accuracy
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                {quizAccuracyMetrics.hasData ? `${quizAccuracyMetrics.avgScore}%` : "—"}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                {quizAccuracyMetrics.hasData ? (
                  <>
                    <span className="font-semibold text-indigo-800">
                      {quizAccuracyMetrics.totalCorrectQuestions}/{quizAccuracyMetrics.totalQuestionsAnswered} correct
                    </span>
                    <span>overall answer rate</span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">Take a quiz to compute accuracy</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================================
            LEARNING ACTIVITY OVER TIME (VISUALIZATION SECTION)
        ===================================================================== */}
        <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-heading">
                  Learning Activity Over Time
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily timeline of academic questions asked and practice quizzes completed
              </p>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto border border-slate-200">
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  timeRange === "7d"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeRange("14d")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  timeRange === "14d"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last 14 Days
              </button>
              <button
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  timeRange === "30d"
                    ? "bg-white text-emerald-800 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Activity Chart Container */}
          <div className="h-72 w-full pt-4">
            {hasActivityData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityTimeline}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#34d399", marginBottom: "4px" }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="questions"
                    name="Questions Asked"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="quizzes"
                    name="Quizzes Taken"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              /* Honest Empty State for Learning Activity */
              <div className="h-full flex flex-col items-center justify-center p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  No learning activity in the last {timeRange === "7d" ? "7 days" : timeRange === "14d" ? "14 days" : "30 days"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Start an academic inquiry in the AI Tutor or take a quiz to log your daily engineering study progress.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => {
                      createNewConversation();
                      setCurrentPage("chat");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Start Studying
                  </button>
                  <button
                    onClick={() => setCurrentPage("quiz")}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Take Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            TWO-COLUMN SECTION: RECENT CONVERSATIONS & RECENTLY STUDIED TOPICS
        ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Column 1: Recent Conversations */}
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-heading">
                  Recent Conversations
                </h2>
              </div>
              {conversations.length > 0 && (
                <button
                  onClick={() => setCurrentPage("history")}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentConversations.length > 0 ? (
              <div className="space-y-3">
                {recentConversations.map((conv) => {
                  const messageCount = conv.messages ? conv.messages.length : 0;
                  const latestMessage = conv.messages && conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1]
                    : null;
                  const preview = latestMessage?.content
                    ? latestMessage.content.replace(/[#*`$\\]/g, "").slice(0, 110) + "..."
                    : "No messages yet";

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        selectConversation(conv.id);
                        setCurrentPage("chat");
                      }}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50/30 hover:border-emerald-300 transition-colors cursor-pointer group flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="overflow-hidden">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate font-heading">
                            {conv.title}
                          </h3>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                            {conv.branch}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 shrink-0 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatTimeAgo(conv.updatedAt || conv.createdAt)}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {preview}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium border-t border-slate-100">
                        <span>{messageCount} {messageCount === 1 ? "message" : "messages"}</span>
                        <span className="text-emerald-800 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>Open in Tutor</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Honest Empty State for Conversations */
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
                  <FolderX className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 font-heading">No Conversations Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  You haven't initiated any discussions with KarpomKarpipom AI yet.
                </p>
                <button
                  onClick={() => {
                    createNewConversation();
                    setCurrentPage("chat");
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start First Discussion</span>
                </button>
              </div>
            )}
          </div>

          {/* Column 2: Recently Studied Topics */}
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-heading">
                  Recently Studied Topics
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {recentlyStudiedTopics.length} topics tracked
              </span>
            </div>

            {recentlyStudiedTopics.length > 0 ? (
              <div className="space-y-3">
                {recentlyStudiedTopics.map((item, idx) => (
                  <div
                    key={`${item.topic}-${idx}`}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="overflow-hidden space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate font-heading">
                          {item.topic}
                        </span>
                        {item.source === "quiz" && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-semibold shrink-0">
                            Quiz Taken
                          </span>
                        )}
                        {item.source === "conversation" && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold shrink-0">
                            Discussion
                          </span>
                        )}
                        {item.source === "curriculum" && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-semibold shrink-0">
                            Mastered
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{item.branch}</span>
                        {item.detail && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">{item.detail}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (item.conversationId) {
                            selectConversation(item.conversationId);
                            setCurrentPage("chat");
                          } else {
                            createNewConversation(undefined, item.topic);
                            setCurrentPage("chat");
                          }
                        }}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-semibold transition-colors"
                        title="Review concept in Tutor"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => {
                          setCurrentPage("quiz");
                          setTimeout(() => {
                            launchQuiz(item.topic, "Medium");
                          }, 100);
                        }}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-amber-50 text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-semibold transition-colors"
                        title="Practice assessment on this topic"
                      >
                        Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Honest Empty State for Studied Topics */
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-lg bg-slate-50 border border-dashed border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 font-heading">No Topics Studied Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  As you ask questions and complete quizzes, your studied engineering topics will appear here.
                </p>
                <button
                  onClick={() => setCurrentPage("quiz")}
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Generate Practice Quiz</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            SUBJECT DISTRIBUTION & STUDY DISCIPLINE BREAKDOWN
        ===================================================================== */}
        {branchBreakdown.length > 0 && (
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight font-heading">
                  Academic Disciplines & Branch Focus
                </h2>
                <p className="text-xs text-slate-500">
                  Distribution of questions and assessments across engineering domains
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {branchBreakdown.map((item, index) => {
                const totalActivityCount = branchBreakdown.reduce((sum, b) => sum + b.value, 0);
                const percent = Math.round((item.value / Math.max(1, totalActivityCount)) * 100);
                const color = BRANCH_COLORS[index % BRANCH_COLORS.length];

                return (
                  <div
                    key={item.name}
                    className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 line-clamp-1 font-heading">
                        {item.name}
                      </span>
                      <span
                        className="text-xs font-extrabold px-2 py-0.5 rounded"
                        style={{ color: color, backgroundColor: `${color}15` }}
                      >
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded h-2 overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${percent}%`, backgroundColor: color }}
                      />
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.value} {item.value === 1 ? "activity" : "activities"} logged
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
