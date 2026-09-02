import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  GraduationCap,
  Sparkles,
  Layers,
  ChevronDown,
  User,
  Settings,
  BookOpen,
  Filter,
  LogOut,
  UploadCloud,
  FileText,
  BarChart3,
} from "lucide-react";
import { EngineeringBranch, StudyMode } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    selectedBranch,
    setSelectedBranch,
    selectedStudyMode,
    setSelectedStudyMode,
    user,
    isAuthenticated,
    isGuest,
    setCurrentPage,
    logoutUser,
    setIsDocumentModalOpen,
    activeDocument,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");

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

  const studyModes: { id: StudyMode; label: string; icon: string }[] = [
    { id: "standard", label: "Concept Tutor", icon: "💡" },
    { id: "derivation", label: "Step-by-Step Derivation", icon: "📐" },
    { id: "exam", label: "Exam & Viva Prep", icon: "🎯" },
    { id: "socratic", label: "Socratic Inquirer", icon: "🧠" },
    { id: "code", label: "Code & Algorithms", icon: "💻" },
    { id: "simplify", label: "Intuitive Analogy", icon: "🌍" },
  ];

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBranch = branchFilter === "all" || conv.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.isPinned);

  const handleStartEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      renameConversation(id, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  const handleNewChat = () => {
    createNewConversation(selectedBranch);
    if (onClose) onClose();
  };

  const handleSelectConv = (id: string) => {
    selectConversation(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => setCurrentPage("landing")}
            className="flex items-center gap-2.5 cursor-pointer group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setCurrentPage("landing");
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-500 transition-colors">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-white font-heading flex items-center gap-1">
                KarpomKarpipom <span className="text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block">
                கற்போம் கற்பிப்போம்
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat, Dashboard, Quiz Studio & Document QA Action Buttons */}
        <div className="p-3 space-y-1.5 border-b border-slate-800">
          <button
            id="sidebar-new-chat-btn"
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-150" />
            <span>New Academic Query</span>
          </button>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              id="sidebar-dashboard-btn"
              onClick={() => {
                setCurrentPage("dashboard");
                if (onClose) onClose();
              }}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 rounded-lg text-[11px] font-medium transition-colors"
              title="Student Dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stats</span>
            </button>

            <button
              id="sidebar-quiz-btn"
              onClick={() => {
                setCurrentPage("quiz");
                if (onClose) onClose();
              }}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-800/80 hover:bg-slate-800 text-amber-300 border border-slate-700/80 hover:border-amber-500/40 rounded-lg text-[11px] font-medium transition-colors"
              title="Quiz Studio"
            >
              <span>🎯 Quiz</span>
            </button>

            <button
              id="sidebar-doc-qa-btn"
              onClick={() => {
                setIsDocumentModalOpen(true);
                if (onClose) onClose();
              }}
              className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-800/80 hover:bg-slate-800 text-teal-300 border border-slate-700/80 hover:border-teal-500/40 rounded-lg text-[11px] font-medium transition-colors"
              title="Document Q&A"
            >
              <UploadCloud className="w-3.5 h-3.5 text-teal-400" />
              <span>Doc QA</span>
            </button>
          </div>
        </div>

        {/* Study Mode Selector */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Study Mode</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">
              {studyModes.find((m) => m.id === selectedStudyMode)?.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            {studyModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedStudyMode(mode.id)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] font-medium transition-colors text-left truncate ${
                  selectedStudyMode === mode.id
                    ? "bg-emerald-700 text-white font-semibold shadow-2xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                title={mode.label}
              >
                <span>{mode.icon}</span>
                <span className="truncate">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Branch Selector */}
        <div className="px-3 pb-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 block">
            Academic Discipline
          </label>
          <div className="relative">
            <select
              id="sidebar-branch-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as EngineeringBranch)}
              className="w-full appearance-none bg-slate-950/70 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-emerald-500 transition-colors"
            >
              {engineeringBranches.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-slate-200">
                  {b}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search past inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 custom-scrollbar">
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-amber-400/90 px-2 mb-1">
                <Pin className="w-3 h-3 rotate-45" />
                <span>Pinned Concepts</span>
              </div>
              <div className="space-y-0.5">
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversation?.id === conv.id}
                    isEditing={editingConvId === conv.id}
                    editingTitle={editingTitle}
                    setEditingTitle={setEditingTitle}
                    onSelect={() => handleSelectConv(conv.id)}
                    onStartEdit={(e) => handleStartEditing(conv.id, conv.title, e)}
                    onSaveRename={(e) => handleSaveRename(conv.id, e)}
                    onCancelRename={handleCancelRename}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      togglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Conversations */}
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400 px-2 mb-1">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <span>Recent Inquiries</span>
              </span>
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full">
                {unpinnedConversations.length}
              </span>
            </div>

            {unpinnedConversations.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                <MessageSquare className="w-5 h-5 mx-auto mb-1.5 opacity-30" />
                <p>No conversations found</p>
                <button
                  onClick={handleNewChat}
                  className="mt-2 text-emerald-400 hover:underline text-[11px]"
                >
                  Start a new query
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {unpinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={activeConversation?.id === conv.id}
                    isEditing={editingConvId === conv.id}
                    editingTitle={editingTitle}
                    setEditingTitle={setEditingTitle}
                    onSelect={() => handleSelectConv(conv.id)}
                    onStartEdit={(e) => handleStartEditing(conv.id, conv.title, e)}
                    onSaveRename={(e) => handleSaveRename(conv.id, e)}
                    onCancelRename={handleCancelRename}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      togglePinConversation(conv.id);
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          {isAuthenticated && !isGuest && user ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div
                onClick={() => {
                  setCurrentPage("profile");
                  if (onClose) onClose();
                }}
                className="flex items-center gap-2 overflow-hidden cursor-pointer group flex-1"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setCurrentPage("profile");
                    if (onClose) onClose();
                  }
                }}
              >
                <div className="w-7 h-7 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                    {user.displayName || user.name || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.email || user.branch?.split(" ")[0] || "Account"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => {
                    setCurrentPage("settings");
                    if (onClose) onClose();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  title="Preferences & Settings"
                  aria-label="Preferences & Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  id="sidebar-logout-btn"
                  onClick={logoutUser}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                  title="Sign Out / Switch Account"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isGuest ? (
            <div className="space-y-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-200">Guest Mode</span>
                </div>
                <span className="text-[10px] text-slate-400">Local Only</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={() => {
                    setCurrentPage("signup");
                    if (onClose) onClose();
                  }}
                  className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold transition-colors text-center"
                >
                  Create Account
                </button>
                <button
                  onClick={logoutUser}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors text-center"
                >
                  Exit Guest
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  setCurrentPage("login");
                  if (onClose) onClose();
                }}
                className="px-2 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold text-center transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setCurrentPage("signup");
                  if (onClose) onClose();
                }}
                className="px-2 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold text-center transition-colors"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conv: any;
  isActive: boolean;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (t: string) => void;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onSaveRename: (e: React.MouseEvent) => void;
  onCancelRename: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conv,
  isActive,
  isEditing,
  editingTitle,
  setEditingTitle,
  onSelect,
  onStartEdit,
  onSaveRename,
  onCancelRename,
  onTogglePin,
  onDelete,
}) => {
  if (isEditing) {
    return (
      <div className="p-1.5 bg-slate-800 rounded-lg flex items-center gap-1">
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSaveRename(e as any);
            } else if (e.key === "Escape") {
              onCancelRename(e as any);
            }
          }}
          autoFocus
          className="flex-1 bg-slate-900 text-xs text-white px-2 py-1 rounded border border-emerald-500 focus:outline-none"
        />
        <button
          onClick={onSaveRename}
          className="p-1 text-emerald-400 hover:text-emerald-300"
          title="Save title"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancelRename}
          className="p-1 text-slate-400 hover:text-slate-200"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150 ${
        isActive
          ? "bg-emerald-950/60 text-emerald-300 font-medium border border-emerald-800/40 shadow-xs"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 ${
            isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-400"
          }`}
        />
        <span className="truncate">{conv.title}</span>
      </div>

      {/* Action Buttons (visible on hover or active) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
        <button
          onClick={onTogglePin}
          className={`p-1 rounded hover:bg-slate-700 ${
            conv.isPinned ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
          }`}
          title={conv.isPinned ? "Unpin" : "Pin to top"}
        >
          <Pin className="w-3 h-3" />
        </button>
        <button
          onClick={onStartEdit}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded"
          title="Rename"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
