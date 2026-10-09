"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  BookOpen,
  Trophy,
  Zap,
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  Lock,
  Play,
  Clock,
  Award,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Atom,
  Calculator,
  Globe,
  Flame,
  Check,
  HelpCircle,
  HardDriveDownload,
} from "lucide-react";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import OfflineQuizModal from "@/student/components/OfflineQuizModal";
import { OFFLINE_DEMO_QUIZZES } from "@/lib/offline/offlineQuizData";

// Curated class-oriented curriculum adventures (mapped to actual syllabus chapters)
const CLASS_CURRICULUM_ADVENTURES = {
  "Class 10": [
    {
      id: "c10_optics",
      title: "Optics & Light Expedition",
      subject: "Science",
      subjectCode: "sci",
      icon: "🔬",
      grade: "Class 10",
      description: "Master spherical mirrors, mirror formula, Snell's law of refraction, and dioptric lens power.",
      demoQuizId: "demo_optics_lens",
      stagesCount: 4,
      completedStages: 2,
      xpReward: 320,
      bannerGradient: "from-blue-600/10 via-indigo-600/10 to-cyan-600/10",
      stages: [
        { id: 1, title: "1. Spherical Mirrors & Ray Diagrams", type: "lesson", duration: "18 mins", status: "completed" },
        { id: 2, title: "2. Snell's Law & Refractive Index Quiz", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_optics_lens" },
        { id: 3, title: "3. Lens Formula & Power Calculation Workshop", type: "lesson", duration: "22 mins", status: "locked" },
        { id: 4, title: "4. Board Milestone: Light & Optics Boss Quiz", type: "quiz", duration: "15 mins", status: "locked", quizId: "demo_optics_lens" },
      ],
    },
    {
      id: "c10_real_numbers",
      title: "Real Numbers & Polynomials Realm",
      subject: "Mathematics",
      subjectCode: "math",
      icon: "🧮",
      grade: "Class 10",
      description: "Explore Euclid's division lemma, prime factorisations, irrationality proofs, and quadratic roots.",
      demoQuizId: "demo_speed_math",
      stagesCount: 4,
      completedStages: 1,
      xpReward: 300,
      bannerGradient: "from-indigo-600/10 via-purple-600/10 to-pink-600/10",
      stages: [
        { id: 1, title: "1. Fundamental Theorem of Arithmetic", type: "lesson", duration: "15 mins", status: "completed" },
        { id: 2, title: "2. Prime Factorisation & HCF/LCM Sprint", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_speed_math" },
        { id: 3, title: "3. Zeroes of Quadratic Polynomials", type: "lesson", duration: "20 mins", status: "locked" },
        { id: 4, title: "4. Class 10 Polynomials Boss Duel", type: "quiz", duration: "12 mins", status: "locked", quizId: "demo_speed_math" },
      ],
    },
    {
      id: "c10_chemical_reactions",
      title: "Chemical Transformations Odyssey",
      subject: "Science",
      subjectCode: "sci",
      icon: "⚗️",
      grade: "Class 10",
      description: "Balance redox equations, classify exothermic/endothermic changes, and investigate corrosion.",
      demoQuizId: "demo_newton_physics",
      stagesCount: 3,
      completedStages: 0,
      xpReward: 280,
      bannerGradient: "from-amber-600/10 via-orange-600/10 to-yellow-600/10",
      stages: [
        { id: 1, title: "1. Writing & Balancing Chemical Equations", type: "lesson", duration: "16 mins", status: "unlocked" },
        { id: 2, title: "2. Types of Chemical Reactions Quiz", type: "quiz", duration: "10 mins", status: "locked", quizId: "demo_newton_physics" },
        { id: 3, title: "3. Redox & Rancidity Boss Assessment", type: "quiz", duration: "12 mins", status: "locked", quizId: "demo_newton_physics" },
      ],
    },
  ],

  "Class 9": [
    {
      id: "c9_motion_force",
      title: "Laws of Motion & Dynamics Quest",
      subject: "Science",
      subjectCode: "sci",
      icon: "🚀",
      grade: "Class 9",
      description: "Kinematics in 1D, velocity-time slopes, Newton's three laws of motion, and rocket propulsion.",
      demoQuizId: "demo_newton_physics",
      stagesCount: 4,
      completedStages: 3,
      xpReward: 350,
      bannerGradient: "from-teal-600/10 via-emerald-600/10 to-cyan-600/10",
      stages: [
        { id: 1, title: "1. Position, Velocity & Acceleration", type: "lesson", duration: "20 mins", status: "completed" },
        { id: 2, title: "2. Newton's Laws & Force Formula Quiz", type: "quiz", duration: "10 mins", status: "completed", quizId: "demo_newton_physics" },
        { id: 3, title: "3. Conservation of Momentum Workshop", type: "lesson", duration: "25 mins", status: "completed" },
        { id: 4, title: "4. Classical Mechanics Boss Battle", type: "quiz", duration: "15 mins", status: "unlocked", quizId: "demo_newton_physics" },
      ],
    },
    {
      id: "c9_number_systems",
      title: "Number Systems & Coordinate Odyssey",
      subject: "Mathematics",
      subjectCode: "math",
      icon: "📐",
      grade: "Class 9",
      description: "Representation of irrationals on real line, decimal expansions, Cartesian axes, and coordinate geometry.",
      demoQuizId: "demo_speed_math",
      stagesCount: 3,
      completedStages: 1,
      xpReward: 290,
      bannerGradient: "from-indigo-600/10 via-blue-600/10 to-purple-600/10",
      stages: [
        { id: 1, title: "1. Real Numbers & Rationalising Denominators", type: "lesson", duration: "18 mins", status: "completed" },
        { id: 2, title: "2. Cartesian Plane & Quadrant Quiz", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_speed_math" },
        { id: 3, title: "3. Number Systems Master Assessment", type: "quiz", duration: "15 mins", status: "locked", quizId: "demo_speed_math" },
      ],
    },
    {
      id: "c9_living_cells",
      title: "Cell: Fundamental Unit of Life",
      subject: "Science",
      subjectCode: "sci",
      icon: "🧬",
      grade: "Class 9",
      description: "Plasma membrane osmosis, nuclear chromatin, cytoplasmic organelles, and plant vs animal turgor.",
      demoQuizId: "demo_living_systems",
      stagesCount: 3,
      completedStages: 1,
      xpReward: 270,
      bannerGradient: "from-emerald-600/10 via-green-600/10 to-teal-600/10",
      stages: [
        { id: 1, title: "1. Discovery of Cells & Cell Theory", type: "lesson", duration: "15 mins", status: "completed" },
        { id: 2, title: "2. Organelles & ATP Synthesis Quiz", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_living_systems" },
        { id: 3, title: "3. Living Systems Boss Assessment", type: "quiz", duration: "12 mins", status: "locked", quizId: "demo_living_systems" },
      ],
    },
  ],

  "Class 8": [
    {
      id: "c8_algebra_equations",
      title: "Algebraic Foundations & Rational Numbers",
      subject: "Mathematics",
      subjectCode: "math",
      icon: "🧮",
      grade: "Class 8",
      description: "Linear equations in one variable, rational number closure, exponents, and algebraic identities.",
      demoQuizId: "demo_speed_math",
      stagesCount: 4,
      completedStages: 2,
      xpReward: 310,
      bannerGradient: "from-blue-600/10 via-indigo-600/10 to-purple-600/10",
      stages: [
        { id: 1, title: "1. Real & Rational Number Line", type: "lesson", duration: "18 mins", status: "completed" },
        { id: 2, title: "2. Linear Equations Sprint Quiz", type: "quiz", duration: "10 mins", status: "completed", quizId: "demo_speed_math" },
        { id: 3, title: "3. Quadratic Formula Derivation", type: "lesson", duration: "25 mins", status: "unlocked" },
        { id: 4, title: "4. Class 8 Algebra Boss Assessment", type: "quiz", duration: "15 mins", status: "locked", quizId: "demo_speed_math" },
      ],
    },
    {
      id: "c8_force_pressure",
      title: "Force, Pressure & Acoustic Waves",
      subject: "Science",
      subjectCode: "sci",
      icon: "⚡",
      grade: "Class 8",
      description: "Contact vs non-contact forces, atmospheric pressure, static friction, and sound vibrations.",
      demoQuizId: "demo_newton_physics",
      stagesCount: 3,
      completedStages: 1,
      xpReward: 290,
      bannerGradient: "from-amber-600/10 via-orange-600/10 to-yellow-600/10",
      stages: [
        { id: 1, title: "1. Push & Pull: Force Types & Vectors", type: "lesson", duration: "20 mins", status: "completed" },
        { id: 2, title: "2. Fluid Pressure & Friction Quiz", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_newton_physics" },
        { id: 3, title: "3. Acoustic Physics Boss Assessment", type: "quiz", duration: "12 mins", status: "locked", quizId: "demo_newton_physics" },
      ],
    },
    {
      id: "c8_code_logic",
      title: "Computational Thinking & Code Algorithms",
      subject: "Computer Science",
      subjectCode: "cs",
      icon: "💻",
      grade: "Class 8",
      description: "Binary mathematics, decision flowcharts, conditionals, iterations, and algorithm efficiency.",
      demoQuizId: "demo_coding_algorithms",
      stagesCount: 3,
      completedStages: 1,
      xpReward: 300,
      bannerGradient: "from-purple-600/10 via-pink-600/10 to-indigo-600/10",
      stages: [
        { id: 1, title: "1. Algorithmic Logic & Flowcharts", type: "lesson", duration: "15 mins", status: "completed" },
        { id: 2, title: "2. Variables, Conditionals & Loops Quiz", type: "quiz", duration: "10 mins", status: "unlocked", quizId: "demo_coding_algorithms" },
        { id: 3, title: "3. Algorithm Duel: The Boss Battle", type: "quiz", duration: "12 mins", status: "locked", quizId: "demo_coding_algorithms" },
      ],
    },
  ],
};

const CLASS_OPTIONS = ["Class 10", "Class 9", "Class 8"];

export default function AdventuresPage() {
  const [selectedClass, setSelectedClass] = useState("Class 8");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedAdventure, setSelectedAdventure] = useState(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState("demo_speed_math");

  // Read stored student class if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("studentClass");
      if (stored && CLASS_OPTIONS.includes(stored)) {
        setSelectedClass(stored);
      }
    }
  }, []);

  const classAdventures = CLASS_CURRICULUM_ADVENTURES[selectedClass] || CLASS_CURRICULUM_ADVENTURES["Class 8"];
  const filteredAdventures = classAdventures.filter((adv) => {
    if (selectedSubject === "all") return true;
    return adv.subjectCode === selectedSubject;
  });

  const handleLaunchStageQuiz = (quizId) => {
    setActiveQuizId(quizId || "demo_speed_math");
    setIsQuizModalOpen(true);
  };

  return (
    <StudentAuthGuard>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* VIEW 1: ADVENTURES SELECTION */}
        {!selectedAdventure ? (
          <div className="space-y-6">
            {/* Top Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172033] via-[#1E1B4B] to-[#0F172A] text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/40">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-[#635BFF]/30 to-emerald-500/20 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Curriculum Learning Adventures</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  <span className="text-emerald-400 text-[11px] font-bold">Class-Oriented</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Academic Curriculum Adventures
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Embark on structured syllabus journeys chapter by chapter. Each adventure bundles textbook lessons, interactive concept quizzes, lab workshops, and chapter milestones.
                </p>
              </div>

              {/* Class & Subject Selector Controls inside banner */}
              <div className="relative z-10 pt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                  {CLASS_OPTIONS.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedClass === cls
                          ? "bg-[#635BFF] text-white shadow-md shadow-indigo-500/30"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                  {[
                    { id: "all", label: "All Subjects" },
                    { id: "math", label: "Mathematics" },
                    { id: "sci", label: "Science" },
                    { id: "cs", label: "Computer Science" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        selectedSubject === sub.id
                          ? "bg-white/20 text-white font-bold"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Offline Ready Notice */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <HardDriveDownload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>Full Offline Compatibility:</strong> You can practice adventure quizzes and review curriculum stages even when completely disconnected.
                </span>
              </div>
              <button
                onClick={() => handleLaunchStageQuiz("demo_speed_math")}
                className="px-3 py-1 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0 cursor-pointer"
              >
                Launch Demo Quiz
              </button>
            </div>

            {/* Adventures Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAdventures.map((adv) => {
                const progressPct = Math.round((adv.completedStages / adv.stagesCount) * 100);

                return (
                  <div
                    key={adv.id}
                    onClick={() => setSelectedAdventure(adv)}
                    className="p-5 sm:p-6 rounded-3xl border bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 transition-all hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer group relative overflow-hidden text-left"
                  >
                    <div className={`absolute top-0 right-0 w-36 h-36 rounded-full bg-gradient-to-br ${adv.bannerGradient} blur-2xl pointer-events-none`} />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-3xl p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                          {adv.icon}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#635BFF] dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {adv.grade} • {adv.subject}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#635BFF] dark:group-hover:text-indigo-400 transition-colors">
                          {adv.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {adv.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span>Progress: {adv.completedStages}/{adv.stagesCount} Stages</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs relative z-10">
                      <span className="font-bold text-amber-500 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> +{adv.xpReward} XP
                      </span>
                      <span className="font-bold text-[#635BFF] dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Enter Quest</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: ACTIVE QUEST PATH & STAGES MAP                       */
          /* ============================================================ */
          <div className="space-y-6">
            {/* Top Back Action Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedAdventure(null)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to {selectedClass} Adventures</span>
              </button>

              <button
                onClick={() => handleLaunchStageQuiz(selectedAdventure.demoQuizId)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Adventure Demo Quiz</span>
              </button>
            </div>

            {/* Adventure Header Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="text-4xl p-4 rounded-3xl bg-slate-100 dark:bg-slate-800">
                  {selectedAdventure.icon}
                </span>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#635BFF] dark:text-indigo-400 uppercase tracking-wider">
                    {selectedAdventure.grade} • {selectedAdventure.subject} Curriculum Quest
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedAdventure.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                    {selectedAdventure.description}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center min-w-[140px]">
                <span className="text-[11px] text-slate-500 block">Total Reward</span>
                <span className="text-lg font-bold text-[#635BFF] dark:text-indigo-400">
                  +{selectedAdventure.xpReward} XP
                </span>
              </div>
            </div>

            {/* Gyan-Bot AI Curriculum Guide Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 flex items-start gap-3.5 text-slate-800 dark:text-slate-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#635BFF] to-pink-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Gyan-Bot's Syllabus Recommendation
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  "Based on your recent practice in {selectedAdventure.subject}, Stage 2 will help test your fundamental formulas. Solve it in offline mode to secure 100 bonus arena points!"
                </p>
              </div>
            </div>

            {/* Sequential Quest Stages List */}
            <div className="space-y-3 text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#635BFF]" />
                <span>Chapter Milestones & Learning Path</span>
              </h3>

              <div className="space-y-3">
                {selectedAdventure.stages.map((stage, idx) => {
                  const isCompleted = stage.status === "completed";
                  const isUnlocked = stage.status === "unlocked";
                  const isLocked = stage.status === "locked";

                  return (
                    <div
                      key={stage.id}
                      className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                        isCompleted
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                          : isUnlocked
                          ? "bg-white dark:bg-slate-900 border-[#635BFF]/50 shadow-md ring-2 ring-[#635BFF]/10"
                          : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isUnlocked
                            ? "bg-[#635BFF] text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {stage.title}
                            </h4>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {stage.type === "quiz" ? "Assessment" : "Lesson"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Duration: {stage.duration}
                          </span>
                        </div>
                      </div>

                      {/* Stage Action Button */}
                      <div>
                        {isCompleted && (
                          <button
                            onClick={() => handleLaunchStageQuiz(stage.quizId || selectedAdventure.demoQuizId)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 hover:bg-emerald-200 transition-colors cursor-pointer"
                          >
                            Retake Stage
                          </button>
                        )}
                        {isUnlocked && (
                          <button
                            onClick={() => {
                              if (stage.type === "quiz") {
                                handleLaunchStageQuiz(stage.quizId || selectedAdventure.demoQuizId);
                              } else {
                                window.location.href = "/student/courses";
                              }
                            }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#635BFF] hover:bg-[#5148E5] shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Start Stage</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isLocked && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Complete Stage {idx} to Unlock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Reusable Offline Quiz Modal */}
        <OfflineQuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          initialQuizId={activeQuizId}
        />
      </div>
    </StudentAuthGuard>
  );
}
