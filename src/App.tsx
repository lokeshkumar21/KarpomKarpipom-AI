import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { ChatPage } from "./pages/ChatPage";
import { ConversationHistoryPage } from "./pages/ConversationHistoryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutPage } from "./pages/AboutPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { QuizPage } from "./pages/QuizPage";
import { DashboardPage } from "./pages/DashboardPage";
import { Loader2 } from "lucide-react";

const MainLayout: React.FC = () => {
  const { currentPage, isAuthenticated, isAuthLoading, isGuest } = useApp();

  const renderPage = () => {
    // Protected pages: check authentication
    const protectedPages = ["dashboard", "history", "profile", "settings"];
    if (protectedPages.includes(currentPage)) {
      if (isAuthLoading) {
        return (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Verifying scholar session...</p>
            </div>
          </div>
        );
      }
      if (!isAuthenticated) {
        return <LoginPage />;
      }
    }

    // If already authenticated and trying to visit login/signup, redirect to Home (landing)
    if (isAuthenticated && !isGuest && (currentPage === "login" || currentPage === "signup")) {
      return <LandingPage />;
    }

    switch (currentPage) {
      case "landing":
        return <LandingPage />;
      case "dashboard":
        return <DashboardPage />;
      case "chat":
        return <ChatPage />;
      case "quiz":
        return <QuizPage />;
      case "history":
        return <ConversationHistoryPage />;
      case "profile":
        return <ProfilePage />;
      case "settings":
        return <SettingsPage />;
      case "about":
        return <AboutPage />;
      case "login":
        return <LoginPage />;
      case "signup":
        return <SignupPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      <Navbar />
      <div className="flex-1 flex flex-col">
        {renderPage()}
      </div>
      {currentPage !== "chat" && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
