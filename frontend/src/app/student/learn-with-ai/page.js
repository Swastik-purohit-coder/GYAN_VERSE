"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  Mic,
  MicOff,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  FileText,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  Share2,
  Compass,
} from "lucide-react";
import EnhancedAiMarkdown from "@/student/components/EnhancedAiMarkdown";
import { askStudyBuddy } from "@/lib/api";
import { fetchUserRole } from "@/lib/users";
import { buildUserContext } from "@/lib/chatbot/buildContext";
import { cn } from "@/student/components/ui/utils";

// Learning Modes
const MODES = [
  {
    id: "explain",
    name: "Concept Explainer",
    shortName: "Explainer",
    icon: Lightbulb,
    badge: "💡 Simple Analogies",
    description: "Breaks down concepts using simple real-world analogies and clear steps.",
  },
  {
    id: "socratic",
    name: "Socratic Tutor",
    shortName: "Socratic",
    icon: HelpCircle,
    badge: "🧠 Step-by-Step",
    description: "Guides you with thoughtful questions so you discover answers yourself.",
  },
  {
    id: "practice",
    name: "Practice & Quiz",
    shortName: "Practice",
    icon: CheckCircle2,
    badge: "📝 Test Skills",
    description: "Solves problems and gives you follow-up practice challenges.",
  },
  {
    id: "exam",
    name: "Exam Revision",
    shortName: "Exam Prep",
    icon: FileText,
    badge: "🎯 High-Yield Notes",
    description: "Key formulas, definitions, common mistakes, and summary checklists.",
  },
  {
    id: "answer",
    name: "Direct Answer",
    shortName: "Direct",
    icon: BookOpen,
    badge: "⚡ Fast & Clear",
    description: "A structured, concise response with bullet points and takeaways.",
  },
];

// Subject Filters
const SUBJECTS = [
  { id: "all", name: "All Subjects", icon: "🌐" },
  { id: "math", name: "Mathematics", icon: "📐" },
  { id: "science", name: "Science & Biology", icon: "🌱" },
  { id: "physics", name: "Physics & Chemistry", icon: "⚛️" },
  { id: "history", name: "Social Science & History", icon: "🏛️" },
  { id: "english", name: "English & Grammar", icon: "📖" },
  { id: "geography", name: "Geography & EVS", icon: "🌍" },
];

// Curated Starters
const CURATED_PROMPTS = [
  {
    subject: "science",
    mode: "explain",
    title: "How does Photosynthesis work?",
    prompt: "Explain Photosynthesis step-by-step using a fun kitchen cooking analogy.",
    icon: "🌱",
  },
  {
    subject: "math",
    mode: "practice",
    title: "Pythagorean Theorem Practice",
    prompt: "Explain how to calculate the hypotenuse in a right triangle and give me 2 practice problems with hints.",
    icon: "📐",
  },
  {
    subject: "physics",
    mode: "socratic",
    title: "Why does Gravity exist?",
    prompt: "Why do heavy objects fall at the same speed as light objects in a vacuum? Walk me through it step-by-step.",
    icon: "⚛️",
  },
  {
    subject: "history",
    mode: "explain",
    title: "Indus Valley Civilization",
    prompt: "Explain how town planning and drainage systems worked in Harappa and Mohenjo-daro for school students.",
    icon: "🏛️",
  },
  {
    subject: "science",
    mode: "exam",
    title: "Mitosis vs Meiosis Cheat Sheet",
    prompt: "Give me an exam-ready comparison table between Mitosis and Meiosis with common student traps to avoid.",
    icon: "🔬",
  },
  {
    subject: "math",
    mode: "explain",
    title: "Understanding Fractions & Percentages",
    prompt: "Explain how fractions convert to decimals and percentages using pizza slices as an example.",
    icon: "🍕",
  },
];

const STORAGE_KEY = "gyanverse_ai_sessions_v2";

export default function LearnWithAiPage() {
  const { user } = useUser();
  const [userProfile, setUserProfile] = useState(null);

  // Active Session & Chat State
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState("explain");
  const [activeSubject, setActiveSubject] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const speechRef = useRef(null);
  const recognitionRef = useRef(null);

  // 1. Fetch User Profile for AI personalization
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    fetchUserRole(user.id)
      .then((roleDoc) => {
        if (active && roleDoc) setUserProfile(roleDoc);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  // 2. Load Saved Sessions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setMessages(parsed[0].messages || []);
          setActiveMode(parsed[0].mode || "explain");
          setActiveSubject(parsed[0].subject || "all");
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load saved chat sessions", e);
    }

    // Default first session
    const initialId = `session-${Date.now()}`;
    const initialSession = {
      id: initialId,
      title: "New AI Study Session",
      mode: "explain",
      subject: "all",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions([initialSession]);
    setCurrentSessionId(initialId);
    setMessages([]);
  }, []);

  // 3. Save sessions to localStorage on updates
  const saveSessions = (updatedSessions) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    } catch (e) {
      console.warn("Failed to save sessions to localStorage", e);
    }
  };

  // 4. Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 5. Speech Synthesis helper
  const handleToggleSpeak = (messageId, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown symbols for speech
    const cleanText = text
      .replace(/[#*_`~[\]()>]/g, " ")
      .replace(/\$\$[\s\S]*?\$\$/g, "formula")
      .replace(/```[\s\S]*?```/g, "code block")
      .slice(0, 1500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when navigating away
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 6. Voice Input (Speech Recognition)
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListening(false);
    }
  };

  // 7. Session Actions: Create New Chat
  const handleCreateNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: "New Study Chat",
      mode: activeMode,
      subject: activeSubject,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setCurrentSessionId(newId);
    setMessages([]);
    setError(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  // Select an existing session
  const handleSelectSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || []);
    setActiveMode(session.mode || "explain");
    setActiveSubject(session.subject || "all");
    setError(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  // Delete session
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      handleCreateNewChat();
      return;
    }
    saveSessions(remaining);
    if (currentSessionId === sessionId) {
      handleSelectSession(remaining[0]);
    }
  };

  // 8. Send Message
  const handleSendMessage = async (customPrompt = null, forcedMode = null) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const modeToUse = forcedMode || activeMode;
    const subjectToUse = activeSubject;

    const userMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: textToSend,
      timestamp: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    // Update session title on first message
    let sessionTitle = null;
    const curSession = sessions.find((s) => s.id === currentSessionId);
    if (curSession && curSession.messages.length === 0) {
      sessionTitle = textToSend.slice(0, 36) + (textToSend.length > 36 ? "..." : "");
    }

    try {
      const userContext = buildUserContext(user, userProfile, {
        route: "/student/learn-with-ai",
        selectedSubject: subjectToUse !== "all" ? subjectToUse : null,
      });

      const response = await askStudyBuddy({
        question: textToSend,
        mode: modeToUse,
        history: nextMessages.slice(-8),
        userContext,
      });

      const assistantMessage = {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: response?.answer || "I could not generate an answer right now. Please try again.",
        mode: modeToUse,
        timestamp: Date.now(),
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to sessions
      const updatedSessions = sessions.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            title: sessionTitle || s.title,
            mode: modeToUse,
            subject: subjectToUse,
            updatedAt: Date.now(),
            messages: finalMessages,
          };
        }
        return s;
      });
      saveSessions(updatedSessions);
    } catch (err) {
      console.error("AI chat error:", err);
      setError(err?.message || "Failed to reach Gyan-Bot AI. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle textarea enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  // Export Chat to Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const title = sessions.find((s) => s.id === currentSessionId)?.title || "AI-Study-Notes";
    const header = `# 🎓 Gyan-Bot AI Study Notes: ${title}\nDate: ${new Date().toLocaleDateString()}\nMode: ${activeMode} | Subject: ${activeSubject}\n\n---\n\n`;
    const body = messages
      .map(
        (m) =>
          `### ${m.role === "user" ? "🙋 Question" : "🤖 Gyan-Bot Answer"}\n\n${m.content}\n\n`
      )
      .join("---\n\n");

    const blob = new Blob([header + body], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const studentName =
    user?.firstName ||
    userProfile?.name ||
    userProfile?.full_name ||
    "Scholar";

  return (
    <div className="flex h-[calc(100vh-9.5rem)] min-h-[600px] w-full overflow-hidden bg-white rounded-3xl border border-[#E2E8F0] shadow-sm">
      {/* =========================================================
          LEFT SIDEBAR: SESSIONS & MODES (COLLAPSIBLE)
         ========================================================= */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:flex flex-col bg-white border-r border-[#E2E8F0] shrink-0 h-full overflow-hidden shadow-xs"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#7E74FF] text-white flex items-center justify-center shadow-xs">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-[#172033] leading-none">
                    Gyan-Bot AI
                  </h2>
                  <span className="text-[11px] text-[#64748B] font-medium">
                    Personalized Tutor
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#172033] hover:bg-slate-100 transition-colors"
                title="Collapse sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Chat Primary Button */}
            <div className="p-3">
              <button
                onClick={handleCreateNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#756EFF] hover:from-[#5148E5] hover:to-[#635BFF] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Study Chat</span>
              </button>
            </div>

            {/* Learning Modes Selector in Sidebar */}
            <div className="px-3 py-2 border-b border-[#F1F5F9]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] px-1 mb-2 block">
                Learning Mode
              </span>
              <div className="space-y-1">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all",
                        isSelected
                          ? "bg-[#F1EEFF] text-[#635BFF] font-semibold"
                          : "text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-[#635BFF]" : "text-[#94A3B8]")} />
                      <span className="truncate">{mode.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saved Chat History List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] px-1 mb-1 block">
                Recent Conversations
              </span>
              {sessions.map((sess) => {
                const isCurrent = sess.id === currentSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all",
                      isCurrent
                        ? "bg-[#F1EEFF] text-[#635BFF] font-semibold"
                        : "text-[#64748B] hover:bg-slate-50 hover:text-[#172033]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className={cn("w-3.5 h-3.5 shrink-0", isCurrent ? "text-[#635BFF]" : "text-[#94A3B8]")} />
                      <span className="truncate">{sess.title || "Untitled Session"}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer Info */}
            <div className="p-3 border-t border-[#E2E8F0] bg-[#FAF9FF]/50 text-[11px] text-[#64748B] flex items-center justify-between">
              <span className="font-medium">Adaptive Learning v2.5</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold">
                Online
              </span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* =========================================================
          MAIN CHAT WORKSPACE
         ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Header Bar */}
        <header className="px-4 py-3 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="hidden md:flex p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F1EEFF] text-[#635BFF] transition-colors"
                title="Open chat history sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center font-bold shadow-2xs">
                <Brain className="w-5 h-5 text-[#635BFF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-[#172033] tracking-tight">
                    Learn with AI
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#22C55E] text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    Gyan-Bot Active
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium hidden sm:block">
                  Mode: <strong className="text-[#635BFF]">{MODES.find((m) => m.id === activeMode)?.name}</strong>
                  {activeSubject !== "all" && (
                    <> • Subject: <strong className="text-[#635BFF] capitalize">{activeSubject}</strong></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewChat}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#635BFF] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            {messages.length > 0 && (
              <>
                <button
                  onClick={handleExportChat}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:border-[#635BFF] text-xs font-semibold text-[#172033] hover:text-[#635BFF] transition-all"
                  title="Download notes as markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Notes</span>
                </button>

                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-xl border border-[#E2E8F0] hover:bg-red-50 text-[#94A3B8] hover:text-red-600 transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            <Link
              href="/student"
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Link>
          </div>
        </header>

        {/* Quick Subject Tabs Filter */}
        <div className="px-4 py-2 border-b border-[#F1F5F9] bg-[#FAF9FF]/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[11px] font-bold text-[#94A3B8] mr-1 shrink-0 hidden sm:inline">
            Subject:
          </span>
          {SUBJECTS.map((sub) => {
            const isSelected = activeSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubject(sub.id)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-[#635BFF] text-white shadow-xs font-semibold"
                    : "bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0] hover:border-slate-300"
                )}
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFCFD]">
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-6">
              <div className="relative inline-block">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#F1EEFF] to-[#E0DAFF] text-[#635BFF] flex items-center justify-center mx-auto shadow-md">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-[#635BFF]" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#635BFF] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
                  Welcome to Learn with AI, {studentName}! 🚀
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
                  I am your 24/7 AI Study Buddy. Select your learning mode below or tap any curriculum question to begin learning with deep analogies, practice quizzes, and step-by-step guidance!
                </p>
              </div>

              {/* Mode Selector Cards for Mobile / Quick Select */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                {MODES.map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = activeMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5",
                        isSelected
                          ? "border-[#635BFF] bg-[#F1EEFF] text-[#635BFF] shadow-xs"
                          : "border-[#E2E8F0] bg-white hover:border-[#635BFF]/40 text-[#64748B] hover:text-[#172033]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold leading-tight">{mode.shortName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Curated Prompt Cards */}
              <div className="pt-4 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] mb-3 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#635BFF]" />
                  <span>Curated Learning Topics to Explore</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CURATED_PROMPTS.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveMode(card.mode);
                        handleSendMessage(card.prompt, card.mode);
                      }}
                      className="group p-3.5 rounded-2xl border border-[#E2E8F0] hover:border-[#635BFF] bg-white hover:bg-[#FAF9FF] transition-all text-left shadow-2xs hover:shadow-xs flex items-start gap-3 cursor-pointer"
                    >
                      <span className="text-xl shrink-0 p-1 rounded-xl bg-slate-50 group-hover:bg-[#F1EEFF] transition-colors">
                        {card.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-[#172033] group-hover:text-[#635BFF] transition-colors truncate">
                            {card.title}
                          </h4>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#635BFF] transition-colors shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                          {card.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isSpeaking = speakingId === msg.id;

            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Brain className="w-4 h-4 text-[#635BFF]" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs transition-all",
                    isUser
                      ? "bg-gradient-to-r from-[#635BFF] to-[#756EFF] text-white rounded-tr-none font-normal"
                      : "bg-white border border-[#E2E8F0] text-[#172033] rounded-tl-none"
                  )}
                >
                  {/* Sender & Mode Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-black/5 dark:border-white/10 text-[10px]">
                    <span className={cn("font-bold uppercase tracking-wider", isUser ? "text-white/80" : "text-[#635BFF]")}>
                      {isUser ? "You" : "Gyan-Bot"}
                    </span>
                    {!isUser && msg.mode && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F1EEFF] text-[#635BFF] font-semibold text-[9px] uppercase tracking-wide">
                        {msg.mode}
                      </span>
                    )}
                  </div>

                  {/* Message Body */}
                  {isUser ? (
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-normal">
                      {msg.content}
                    </p>
                  ) : (
                    <EnhancedAiMarkdown content={msg.content} />
                  )}

                  {/* Assistant Action Tools */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B]">
                      {/* Action buttons: Speak, Copy */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer",
                            isSpeaking
                              ? "bg-purple-100 text-[#635BFF] font-semibold animate-pulse"
                              : "hover:bg-slate-100 text-[#64748B] hover:text-[#172033]"
                          )}
                          title="Read aloud"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span>{isSpeaking ? "Stop Voice" : "Read Aloud"}</span>
                        </button>

                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600 font-semibold text-[10px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Quick Follow-up Chips */}
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          onClick={() => handleSendMessage("Can you give me a clear real-life example of this?")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F1EEFF] hover:bg-[#E0DAFF] text-[#635BFF] transition-colors"
                        >
                          + Example
                        </button>
                        <button
                          onClick={() => handleSendMessage("Now quiz me with a question on this!")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F1EEFF] hover:bg-[#E0DAFF] text-[#635BFF] transition-colors"
                        >
                          + Quiz Me
                        </button>
                        <button
                          onClick={() => handleSendMessage("Explain that more simply, like I'm 10 years old.")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F1EEFF] hover:bg-[#E0DAFF] text-[#635BFF] transition-colors"
                        >
                          + Simpler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#635BFF] to-[#7E74FF] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-2xs">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center shrink-0 shadow-2xs">
                <Brain className="w-4 h-4 text-[#635BFF]" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-white border border-[#E2E8F0] shadow-2xs flex items-center gap-2.5">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-[#64748B] font-medium">
                  Gyan-Bot is analyzing and formulating your personalized explanation...
                </span>
              </div>
            </motion.div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Area */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#E2E8F0] space-y-2">
          {/* Active Mode indicator pill */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Mode:
              </span>
              <div className="flex items-center gap-1">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer",
                      activeMode === m.id
                        ? "bg-[#635BFF] text-white shadow-2xs"
                        : "text-[#64748B] hover:bg-[#F1EEFF] hover:text-[#635BFF]"
                    )}
                  >
                    {m.shortName}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#94A3B8] hidden sm:inline">
              Shift + Enter for new line • Enter to send
            </span>
          </div>

          {/* Textarea + Voice + Send Toolbar */}
          <div className="relative rounded-2xl border border-[#E2E8F0] focus-within:border-[#635BFF] focus-within:ring-3 focus-within:ring-[#635BFF]/15 transition-all bg-[#FAF9FF]/40 p-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Gyan-Bot any question in ${activeSubject === "all" ? "Science, Math, or English" : activeSubject}...`}
              className="w-full bg-transparent px-2 py-1 text-xs sm:text-sm text-[#172033] focus:outline-none resize-none placeholder:text-[#94A3B8]"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              {/* Voice recognition toggle */}
              <button
                type="button"
                onClick={toggleListening}
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs",
                  isListening
                    ? "bg-red-100 text-red-600 animate-pulse font-semibold"
                    : "text-[#64748B] hover:text-[#635BFF] hover:bg-[#F1EEFF]"
                )}
                title={isListening ? "Listening... click to stop" : "Speak question"}
              >
                {isListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                <span className="text-[11px] hidden sm:inline">
                  {isListening ? "Listening..." : "Voice Input"}
                </span>
              </button>

              {/* Send Button */}
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => handleSendMessage()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#756EFF] hover:from-[#5148E5] hover:to-[#635BFF] disabled:opacity-40 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-center text-[#94A3B8] font-normal">
            Gyan-Bot is an AI learning companion designed for students. Verify critical formulas with your school syllabus.
          </p>
        </div>
      </div>
    </div>
  );
}
