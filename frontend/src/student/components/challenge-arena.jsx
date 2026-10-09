"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy,
  Zap,
  Flame,
  Clock,
  Award,
  Sparkles,
  Swords,
  ChevronRight,
  Shield,
  Star,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  BookOpen,
  Filter,
  BarChart2,
  Users,
  Compass,
  Cpu,
  Atom,
  HelpCircle,
  HardDriveDownload,
} from "lucide-react";
import OfflineQuizModal from "./OfflineQuizModal";
import { OFFLINE_DEMO_QUIZZES } from "@/lib/offline/offlineQuizData";
import { getOfflineQuizAttempts } from "@/lib/offlineDb";

const CHALLENGE_CATEGORIES = [
  { id: "all", label: "All Challenges", icon: "🌟" },
  { id: "math", label: "Mathematics", icon: "🧮" },
  { id: "science", label: "Science & Physics", icon: "🔬" },
  { id: "cs", label: "Coding & Logic", icon: "💻" },
  { id: "speed", label: "Speed Blitz", icon: "⚡" },
  { id: "boss", label: "Boss Battles", icon: "👑" },
];

const LEADERBOARD_PREVIEW = [
  { rank: 1, name: "Maya Patel", class: "Class 8", score: "2,840 XP", badge: "🥇", avatar: "👩‍🎓" },
  { rank: 2, name: "Emily Chen", class: "Class 8", score: "2,650 XP", badge: "🥈", avatar: "👩‍🔬" },
  { rank: 3, name: "Alex Morgan (You)", class: "Class 8", score: "2,420 XP", badge: "🥉", isUser: true, avatar: "🦸‍♂️" },
  { rank: 4, name: "Sarah Mitchell", class: "Class 8", score: "2,280 XP", badge: "4th", avatar: "🧑‍💻" },
  { rank: 5, name: "Alex Thompson", class: "Class 8", score: "2,150 XP", badge: "5th", avatar: "👨‍🏫" },
];

export default function ChallengeArena() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeModalQuizId, setActiveModalQuizId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedAttempts, setCompletedAttempts] = useState([]);
  const [totalXp, setTotalXp] = useState(2420);
  const [streakDays, setStreakDays] = useState(7);

  // Load local quiz attempts from IndexedDB on mount
  useEffect(() => {
    getOfflineQuizAttempts().then((attempts) => {
      setCompletedAttempts(attempts || []);
    });
  }, []);

  const handleLaunchQuiz = (quizId) => {
    setActiveModalQuizId(quizId);
    setIsModalOpen(true);
  };

  const handleQuizCompleted = ({ xpEarned, quizId }) => {
    setTotalXp((prev) => prev + (xpEarned || 100));
    getOfflineQuizAttempts().then((attempts) => {
      setCompletedAttempts(attempts || []);
    });
  };

  // Build challenges list mapped to our rich offline quizzes
  const challenges = [
    {
      id: "ch_speed_math",
      quizId: "demo_speed_math",
      title: "Daily Math Duel: Speed Algebra Sprint",
      category: "math",
      isSpeed: true,
      subject: "Mathematics",
      difficulty: "Medium",
      timeLimit: "3 Mins",
      questionsCount: 5,
      xpReward: 150,
      coinReward: 50,
      emoji: "🧮",
      tag: "Daily Quest",
      description: "Quick calculation sprint covering linear equations, arithmetic powers, and geometric perimeters.",
      isDaily: true,
      gradient: "from-blue-600/10 via-indigo-600/10 to-purple-600/10",
      accent: "text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    {
      id: "ch_newton_force",
      quizId: "demo_newton_physics",
      title: "Newton's Force & Motion Arena",
      category: "science",
      isSpeed: false,
      subject: "Science (Physics)",
      difficulty: "Hard",
      timeLimit: "3.5 Mins",
      questionsCount: 5,
      xpReward: 200,
      coinReward: 75,
      emoji: "🚀",
      tag: "Olympiad Level",
      description: "Master dynamics, F=ma calculations, inertia vectors, and rocket propulsion mechanics.",
      isDaily: false,
      gradient: "from-emerald-600/10 via-teal-600/10 to-cyan-600/10",
      accent: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    {
      id: "ch_code_algo",
      quizId: "demo_coding_algorithms",
      title: "Algorithmic Code Duel & Logic Quest",
      category: "cs",
      isSpeed: true,
      subject: "Computer Science",
      difficulty: "Medium",
      timeLimit: "3 Mins",
      questionsCount: 5,
      xpReward: 175,
      coinReward: 60,
      emoji: "💻",
      tag: "Skill Track",
      description: "Test binary conversion, flowchart decision branches, FIFO queues, and algorithm complexity.",
      isDaily: false,
      gradient: "from-purple-600/10 via-pink-600/10 to-indigo-600/10",
      accent: "text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    {
      id: "ch_optics_lens",
      quizId: "demo_optics_lens",
      title: "Class 10 Optics & Reflection Challenge",
      category: "science",
      isSpeed: false,
      subject: "Science (Optics)",
      difficulty: "Hard",
      timeLimit: "3.5 Mins",
      questionsCount: 5,
      xpReward: 180,
      coinReward: 60,
      emoji: "👓",
      tag: "Class 10 Board Prep",
      description: "Ray optics, spherical mirror focal length, Snell's law of refraction, and dioptre power.",
      isDaily: false,
      gradient: "from-amber-600/10 via-orange-600/10 to-yellow-600/10",
      accent: "text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    {
      id: "ch_cell_biology",
      quizId: "demo_living_systems",
      title: "Living Systems & Cellular Architecture",
      category: "science",
      isSpeed: false,
      subject: "Science (Biology)",
      difficulty: "Medium",
      timeLimit: "3 Mins",
      questionsCount: 5,
      xpReward: 160,
      coinReward: 50,
      emoji: "🧬",
      tag: "Biology League",
      description: "Mitochondrial ATP synthesis, plant vs animal cells, and chlorophyll absorption spectra.",
      isDaily: false,
      gradient: "from-rose-600/10 via-pink-600/10 to-red-600/10",
      accent: "text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
    {
      id: "ch_boss_olympiad",
      quizId: "demo_speed_math",
      title: "Grand STEM Olympiad: Boss Battle",
      category: "boss",
      isSpeed: false,
      subject: "Integrated STEM",
      difficulty: "Boss Level",
      timeLimit: "5 Mins",
      questionsCount: 5,
      xpReward: 300,
      coinReward: 120,
      emoji: "👑",
      tag: "Boss Challenge",
      description: "The ultimate weekly showdown! High-stakes multi-discipline problem solving for diamond trophies.",
      isDaily: false,
      gradient: "from-yellow-600/15 via-amber-600/15 to-orange-600/15",
      accent: "text-amber-500 border-amber-500/50",
    },
  ];

  const filteredChallenges = challenges.filter((c) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "speed") return c.isSpeed;
    if (selectedCategory === "boss") return c.category === "boss";
    return c.category === selectedCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. ARENA TOP BANNER / STATS BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172033] via-[#1E1B4B] to-[#0F172A] text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/40">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#635BFF]/30 to-pink-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
              <Swords className="w-3.5 h-3.5" />
              <span>Competitive Learning Arena</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
              <span className="text-emerald-400 text-[11px] font-bold">Offline Ready</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Challenge Arena & Daily Duels
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Test your speed, compete in STEM Olympiads, and climb the school ranks. All quizzes can be played completely offline with zero latency!
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{streakDays} Days</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Streak</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="flex items-center justify-center gap-1 text-indigo-400 text-xs font-bold">
                <Award className="w-4 h-4" />
                <span>{totalXp}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Arena XP</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedAttempts.length}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Solved</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FEATURED DAILY QUEST BANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 text-slate-900 dark:text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg shadow-amber-500/5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <Flame className="w-6 h-6 fill-white" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Today's Daily Challenge
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                2x XP Active
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Speed Math Duel: Arithmetic & Algebra Sprint
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
              Solve 5 quickfire algebraic and arithmetic questions in under 3 minutes. Test your mental math reflexes!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleLaunchQuiz("demo_speed_math")}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Daily Duel (Offline)</span>
          </button>
        </div>
      </div>

      {/* 3. CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CHALLENGE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                isActive
                  ? "bg-[#635BFF] text-white border-[#635BFF] shadow-md shadow-indigo-500/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN CONTENT GRID (Challenges + Leaderboard Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Challenge Cards (2 Columns on Desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#635BFF]" />
              <span>Available Arena Quests ({filteredChallenges.length})</span>
            </h2>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <HardDriveDownload className="w-3.5 h-3.5 text-emerald-500" />
              <span>IndexedDB Cached</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredChallenges.map((ch) => {
              const attemptsForThis = completedAttempts.filter((a) => a.quizId === ch.quizId);
              const bestScore = attemptsForThis.length > 0 ? Math.max(...attemptsForThis.map((a) => a.score)) : null;

              return (
                <div
                  key={ch.id}
                  className={`p-5 rounded-3xl border bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden`}
                >
                  {/* Subtle Card Accent Gradient */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${ch.gradient} blur-2xl pointer-events-none`} />

                  <div className="space-y-3 relative z-10">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                          {ch.emoji}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {ch.subject}
                          </span>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {ch.title}
                          </h3>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ch.accent}`}>
                        {ch.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ch.description}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        <Clock className="w-3 h-3" /> {ch.timeLimit}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                        <BookOpen className="w-3 h-3" /> {ch.questionsCount} Questions
                      </span>
                      {bestScore !== null && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                          Best: {bestScore}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                      <Award className="w-4 h-4" />
                      <span>+{ch.xpReward} XP</span>
                    </div>

                    <button
                      onClick={() => handleLaunchQuiz(ch.quizId)}
                      className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-md shadow-indigo-500/20 group-hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{bestScore !== null ? "Retake Challenge" : "Start Challenge"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Leaderboard & Arena Quests Info */}
        <div className="space-y-6">
          {/* Top Leaderboard Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Class 8 Arena Leaderboard
                </h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                Weekly Rank
              </span>
            </div>

            <div className="space-y-2">
              {LEADERBOARD_PREVIEW.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-2xl flex items-center justify-between text-xs transition-colors ${
                    item.isUser
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-400">
                      {item.badge}
                    </span>
                    <span className="text-base">{item.avatar}</span>
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-[#635BFF] dark:text-indigo-400">
                    {item.score}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Rankings refresh weekly every Sunday midnight. Solve offline challenges to climb!
              </p>
            </div>
          </div>

          {/* Quick Offline Practice Box */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-slate-800 dark:text-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Offline Demo Quiz Runner
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              No Internet? No Problem.
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You can test your skills with our interactive demo quizzes in Mathematics, Physics, Biology, and Computer Logic anytime without any data connection.
            </p>
            <button
              onClick={() => handleLaunchQuiz(OFFLINE_DEMO_QUIZZES[0].id)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Play Demo Quiz Now
            </button>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE OFFLINE QUIZ MODAL */}
      <OfflineQuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialQuizId={activeModalQuizId}
        onQuizCompleted={handleQuizCompleted}
      />
    </div>
  );
}
