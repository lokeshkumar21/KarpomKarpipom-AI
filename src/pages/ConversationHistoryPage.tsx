import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  History,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Filter,
  Plus,
} from "lucide-react";
import { EngineeringBranch } from "../types";

export const ConversationHistoryPage: React.FC = () => {
  const {
    conversations,
    selectConversation,
    deleteConversation,
    togglePinConversation,
    setCurrentPage,
    createNewConversation,
    launchQuiz,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("all");

  const engineeringBranches: EngineeringBranch[] = [
    "Computer Science & AI",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical & Robotics",
    "Civil & Structural",
    "Biotech & Chemical",
    "Engineering Mathematics",
    "Applied Physics & Chemistry",
    "General Engineering",
  ];

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.messages.some((m) => m.content.toLowerCase().includes(search.toLowerCase()));
    const matchesBranch = selectedBranchFilter === "all" || c.branch === selectedBranchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleOpenConversation = (id: string) => {
    selectConversation(id);
    setCurrentPage("chat");
  };

  const handleExportAll = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karpom-karpipom-history-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Academic Inquiries & Revision History
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Browse previous concept discussions, derivations, and saved notes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 shadow-xs transition-colors"
              title="Download entire study history"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export History (JSON)</span>
            </button>
            <button
              onClick={() => {
                createNewConversation();
                setCurrentPage("chat");
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Concept Chat</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Total Conversations</span>
            <p className="text-2xl font-black text-slate-900">{conversations.length}</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Total Messages Exchanged</span>
            <p className="text-2xl font-black text-emerald-600">
              {conversations.reduce((acc, c) => acc + c.messages.length, 0)}
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Pinned High-Yield Topics</span>
            <p className="text-2xl font-black text-amber-600">
              {conversations.filter((c) => c.isPinned).length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Disciplines Explored</span>
            <p className="text-2xl font-black text-teal-600">
              {new Set(conversations.map((c) => c.branch)).size}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts, questions, or formulas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Engineering Disciplines</option>
              {engineeringBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversations Grid */}
        {filteredConversations.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching conversations found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search keywords or start a new inquiry in AI Tutor.
            </p>
            <button
              onClick={() => {
                createNewConversation();
                setCurrentPage("chat");
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
            >
              Start New Doubt
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConversations.map((conv) => {
              const lastMessage = conv.messages[conv.messages.length - 1];
              const dateStr = new Date(conv.updatedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={conv.id}
                  onClick={() => handleOpenConversation(conv.id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer group space-y-4"
                >
                  <div className="space-y-2">
                    {/* Top Row: Branch & Pin */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 truncate">
                        {conv.branch}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinConversation(conv.id);
                        }}
                        className={`p-1 rounded hover:bg-slate-100 ${
                          conv.isPinned ? "text-amber-500" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title={conv.isPinned ? "Unpin" : "Pin topic"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-900 transition-colors line-clamp-2">
                      {conv.title}
                    </h3>

                    {/* Snippet */}
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {lastMessage
                        ? lastMessage.content.replace(/[#*`$]/g, "").slice(0, 140)
                        : "No messages yet in this session."}
                    </p>
                  </div>

                  {/* Bottom Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{conv.messages.length} msgs</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
