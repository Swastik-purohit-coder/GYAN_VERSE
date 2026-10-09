"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Video,
  Headphones,
  BookOpen,
  Award,
  Sparkles,
  Filter,
  X,
  Play,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  HelpCircle,
  Layers,
  GraduationCap,
  Compass,
  Flame,
  RotateCcw,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { EXAMS_DATABASE } from "@/data/examsData";
import { useStudentModules } from "@/hooks/useApi";
import { OFFLINE_SEED_MODULES, OFFLINE_SEED_QUIZZES } from "@/lib/offlineSeedData";
import { DEFAULT_OFFLINE_SUBJECTS } from "@/lib/offline/offlineRepository";
import VideoPlayer from "./VideoPlayer";
import LessonAudioPlayer from "@/components/media/LessonAudioPlayer";

const POPULAR_SEARCH_TOPICS = [
  { term: "Photosynthesis & Plant Nutrition", category: "Science", class: "Class 7" },
  { term: "Linear Equations in One Variable", category: "Mathematics", class: "Class 8" },
  { term: "Pathani Samanta Mathematics (PMST)", category: "Exam", class: "Class 6" },
  { term: "Newton's 3 Laws of Motion", category: "Science", class: "Class 9" },
  { term: "NMMS State Scholarship", category: "Exam", class: "Class 8" },
  { term: "Quadratic Equations", category: "Mathematics", class: "Class 10" },
  { term: "Periodic Table & Chemical Reactions", category: "Science", class: "Class 10" },
  { term: "Cell Structure & Microorganisms", category: "Science", class: "Class 8" },
  { term: "French Revolution & Democracy", category: "Social Science", class: "Class 9" },
  { term: "Ohm's Law & Electric Current", category: "Science", class: "Class 10" },
];

const SCHOOL_CLASSES = [
  "All Classes",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SCHOOL_SUBJECTS = [
  "All Subjects",
  "Mathematics",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Digital Literacy & Computer",
  "Environmental Studies (EVS)",
];

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef(null);

  const initialQuery = searchParams?.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'lessons' | 'exams' | 'modules' | 'quizzes' | 'ai'
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [mediaFilter, setMediaFilter] = useState("all"); // 'all' | 'video' | 'audio'
  const [recentSearches, setRecentSearches] = useState([]);

  // Active in-page media players
  const [activeVideoLesson, setActiveVideoLesson] = useState(null);
  const [activeVideoModule, setActiveVideoModule] = useState(null);
  const [activeAudioLesson, setActiveAudioLesson] = useState(null);

  // Fetch learning modules and lessons
  const { modules: apiModules, loading: modulesLoading } = useStudentModules();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gyan_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, 8));
      }
    } catch {}
  }, []);

  // Sync URL query param to state if URL changes externally
  useEffect(() => {
    const qParam = searchParams?.get("q") || "";
    if (qParam !== query) {
      setQuery(qParam);
    }
  }, [searchParams]);

  const saveRecentSearch = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem("gyan_recent_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem("gyan_recent_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("gyan_recent_searches");
    } catch {}
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    saveRecentSearch(clean);
    if (typeof window !== "undefined") {
      const newUrl = clean ? `/student/search?q=${encodeURIComponent(clean)}` : "/student/search";
      window.history.replaceState(null, "", newUrl);
    }
  };

  const applyQuery = (text) => {
    setQuery(text);
    saveRecentSearch(text);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/student/search?q=${encodeURIComponent(text)}`);
    }
  };

  // Compile full searchable dataset
  const effectiveModules = useMemo(() => {
    if (Array.isArray(apiModules) && apiModules.length > 0) {
      return apiModules;
    }
    return OFFLINE_SEED_MODULES.modules || [];
  }, [apiModules]);

  // Flatten lessons from modules
  const allLessons = useMemo(() => {
    const list = [];
    effectiveModules.forEach((mod) => {
      if (Array.isArray(mod.lessons)) {
        mod.lessons.forEach((les) => {
          const rawVideo = les.video_url || les.video_path || les.videoUrl;
          const rawAudio = les.audio_url || les.audio_path || les.audioUrl;
          list.push({
            ...les,
            moduleId: mod.id,
            moduleTitle: mod.title,
            moduleSubject: mod.subject || mod.subject_id || "General",
            moduleClass: mod.class || "Class 8",
            hasVideo: Boolean(rawVideo),
            hasAudio: Boolean(rawAudio),
            videoUrl: rawVideo,
            audioUrl: rawAudio,
          });
        });
      }
    });
    return list;
  }, [effectiveModules]);

  // Quizzes dataset
  const allQuizzes = useMemo(() => {
    const list = [];
    effectiveModules.forEach((mod) => {
      if (mod.quiz) {
        list.push({
          ...mod.quiz,
          moduleId: mod.id,
          moduleTitle: mod.title,
          subject: mod.subject || "General",
          class: mod.class || "Class 8",
        });
      }
    });
    if (Array.isArray(OFFLINE_SEED_QUIZZES)) {
      OFFLINE_SEED_QUIZZES.forEach((q) => {
        if (!list.some((existing) => existing.id === q.id)) {
          list.push(q);
        }
      });
    }
    return list;
  }, [effectiveModules]);

  // Exams dataset
  const allExams = useMemo(() => {
    return EXAMS_DATABASE || [];
  }, []);

  // Filtered Results Calculation
  const searchResults = useMemo(() => {
    const qLower = query.trim().toLowerCase();
    const isBlank = qLower.length === 0;

    // Helper: matches class
    const matchClass = (itemClass) => {
      if (selectedClass === "All Classes") return true;
      if (!itemClass) return true;
      return String(itemClass).toLowerCase().includes(selectedClass.toLowerCase());
    };

    // Helper: matches subject
    const matchSubject = (itemSub) => {
      if (selectedSubject === "All Subjects") return true;
      if (!itemSub) return true;
      return String(itemSub).toLowerCase().includes(selectedSubject.toLowerCase());
    };

    // 1. Lessons Filter
    const matchedLessons = allLessons.filter((les) => {
      if (!matchClass(les.moduleClass)) return false;
      if (!matchSubject(les.moduleSubject)) return false;

      // Media filter: video / audio / all
      if (mediaFilter === "video" && !les.hasVideo) return false;
      if (mediaFilter === "audio" && !les.hasAudio) return false;

      if (isBlank) return true;
      const hay = `${les.title} ${les.description || ""} ${les.moduleTitle || ""} ${les.moduleSubject || ""}`.toLowerCase();
      return hay.includes(qLower);
    });

    // 2. Exams Filter
    const matchedExams = allExams.filter((exam) => {
      // Class check: check eligibleClasses or classBracket
      if (selectedClass !== "All Classes") {
        const numMatch = selectedClass.match(/\d+/);
        const targetNum = numMatch ? parseInt(numMatch[0], 10) : null;
        if (targetNum && Array.isArray(exam.eligibleClasses) && !exam.eligibleClasses.includes(targetNum)) {
          return false;
        }
      }

      if (isBlank) return true;
      const hay = `${exam.title} ${exam.shortName} ${exam.overview || ""} ${exam.conductingBody || ""} ${exam.category || ""} ${exam.eligibility?.summary || ""}`.toLowerCase();
      return hay.includes(qLower);
    });

    // 3. Modules Filter
    const matchedModules = effectiveModules.filter((mod) => {
      if (!matchClass(mod.class)) return false;
      if (!matchSubject(mod.subject || mod.subject_id)) return false;

      if (isBlank) return true;
      const hay = `${mod.title} ${mod.description || ""} ${mod.subject || ""}`.toLowerCase();
      return hay.includes(qLower);
    });

    // 4. Quizzes Filter
    const matchedQuizzes = allQuizzes.filter((quiz) => {
      if (!matchClass(quiz.class)) return false;
      if (!matchSubject(quiz.subject)) return false;

      if (isBlank) return true;
      const hay = `${quiz.title} ${quiz.description || ""} ${quiz.subject || ""}`.toLowerCase();
      return hay.includes(qLower);
    });

    const totalCount = matchedLessons.length + matchedExams.length + matchedModules.length + matchedQuizzes.length;

    return {
      lessons: matchedLessons,
      exams: matchedExams,
      modules: matchedModules,
      quizzes: matchedQuizzes,
      totalCount,
    };
  }, [query, selectedClass, selectedSubject, mediaFilter, allLessons, allExams, effectiveModules, allQuizzes]);

  const hasActiveFilters = selectedClass !== "All Classes" || selectedSubject !== "All Subjects" || mediaFilter !== "all";

  const resetFilters = () => {
    setSelectedClass("All Classes");
    setSelectedSubject("All Subjects");
    setMediaFilter("all");
  };

  const openLessonVideo = (lesson) => {
    const parentModule = effectiveModules.find((m) => m.id === lesson.moduleId) || { title: lesson.moduleTitle };
    setActiveVideoLesson(lesson);
    setActiveVideoModule(parentModule);
  };

  const openLessonAudio = (lesson) => {
    setActiveAudioLesson(lesson);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-[#172033]">
      {/* Top Search Hero Section */}
      <div className="bg-white border-b border-[#E2E8F0] shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
          {/* Header Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#635BFF]/10 text-[#635BFF]">
                <Compass className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
                Knowledge & Curriculum Search
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Search video lessons, audio lectures, scholarship exams, and AI study topics across Classes 6–12
            </p>
          </div>

          {/* Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-[#635BFF]" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (typeof window !== "undefined") {
                    const newUrl = e.target.value.trim() ? `/student/search?q=${encodeURIComponent(e.target.value.trim())}` : "/student/search";
                    window.history.replaceState(null, "", newUrl);
                  }
                }}
                placeholder="Search topics (e.g. Photosynthesis, Linear Equations, PMST Scholarship, Force)..."
                className="w-full pl-12 pr-28 h-13 rounded-2xl bg-[#F8FAFC] border-2 border-[#E2E8F0] focus:border-[#635BFF] focus:bg-white focus:ring-4 focus:ring-[#635BFF]/10 text-sm sm:text-base font-medium text-[#172033] shadow-inner transition-all placeholder:text-slate-400"
              />
              <div className="absolute right-3 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      if (typeof window !== "undefined") window.history.replaceState(null, "", "/student/search");
                      searchInputRef.current?.focus();
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Clear query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#635BFF] hover:bg-[#5148E5] text-white px-4 h-9 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Filters Row: Class Filter, Subject Filter, Media Source */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
              </span>

              {/* Class Dropdown */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
              >
                {SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>

              {/* Subject Dropdown */}
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#635BFF] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
              >
                {SCHOOL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>

              {/* Media Filter Pills */}
              <div className="flex items-center gap-1 bg-[#F1EEFF] p-0.5 rounded-xl border border-[#635BFF]/20">
                <button
                  type="button"
                  onClick={() => setMediaFilter("all")}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mediaFilter === "all" ? "bg-white text-[#635BFF] shadow-2xs" : "text-[#64748B] hover:text-[#172033]"
                  }`}
                >
                  All Media
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter("video")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mediaFilter === "video" ? "bg-white text-indigo-600 shadow-2xs" : "text-[#64748B] hover:text-[#172033]"
                  }`}
                >
                  <Video className="w-3 h-3" /> Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaFilter("audio")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    mediaFilter === "audio" ? "bg-white text-violet-600 shadow-2xs" : "text-[#64748B] hover:text-[#172033]"
                  }`}
                >
                  <Headphones className="w-3 h-3" /> Audio
                </button>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2 gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Zero State / Empty Query Discovery View */}
        {!query.trim() && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#635BFF]" /> Recent Searches
                  </h3>
                  <button
                    onClick={clearAllRecentSearches}
                    className="text-xs text-slate-400 hover:text-rose-500 transition-colors font-medium"
                  >
                    Clear History
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyQuery(term)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-[#635BFF] hover:bg-[#F1EEFF] text-xs font-medium text-slate-700 hover:text-[#635BFF] transition-all"
                    >
                      <span>{term}</span>
                      <span
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded-full hover:bg-rose-100 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tutor Assistant Spotlight */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#635BFF] to-[#8F85FF] text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5" /> GyanBot 24/7 AI School Tutor
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Have a specific doubt or question?</h3>
                <p className="text-xs sm:text-sm text-indigo-100">
                  Ask our curriculum AI tutor for step-by-step homework help, concept explanations, or quiz practice tailored for Classes 6–12.
                </p>
              </div>
              <Button
                onClick={() => router.push("/student/learn-with-ai")}
                className="bg-white text-[#635BFF] hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm shrink-0 gap-1.5"
              >
                <span>Open AI Study Buddy</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Popular School Topics for Classes 6–12 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Trending Topics for Classes 6–12</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {POPULAR_SEARCH_TOPICS.map((topic, i) => (
                  <div
                    key={i}
                    onClick={() => applyQuery(topic.term)}
                    className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#635BFF] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                          {topic.class}
                        </Badge>
                        <span className="text-[11px] font-semibold text-[#635BFF]">{topic.category}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 group-hover:text-[#635BFF] transition-colors">
                        {topic.term}
                      </h4>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#635BFF] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Portals Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#635BFF]" />
                <span>Browse Student Feature Hubs</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/student/exams"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#635BFF] hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      Exams & Scholarships
                    </h4>
                    <p className="text-xs text-slate-500">
                      20+ verified state and national scholarships with monetary stipends and roadmaps.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#635BFF] flex items-center gap-1 mt-4">
                    Explore Exams <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  href="/student/learn-with-ai"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#635BFF] hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#635BFF] flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      Learn with AI Tutor
                    </h4>
                    <p className="text-xs text-slate-500">
                      5 modes: Homework Helper, Concept Explainer, Exam Prep, Story Mode, and Quiz Me.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#635BFF] flex items-center gap-1 mt-4">
                    Launch AI Tutor <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  href="/student"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#635BFF] hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                      <Video className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      Video & Audio Modules
                    </h4>
                    <p className="text-xs text-slate-500">
                      Dual-track audio lectures and video lessons with offline download capability.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#635BFF] flex items-center gap-1 mt-4">
                    View Modules <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                <Link
                  href="/student/quiz"
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#635BFF] hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#635BFF] transition-colors">
                      Practice Tests & Quizzes
                    </h4>
                    <p className="text-xs text-slate-500">
                      Chapter tests, instant answer analysis, and offline-compatible assessments.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#635BFF] flex items-center gap-1 mt-4">
                    Start Practice <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Active Search Results Section */}
        {query.trim().length > 0 && (
          <div className="space-y-6">
            {/* Category Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "all"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>All Results</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "all" ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {searchResults.totalCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("lessons")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "lessons"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Lessons & Audio</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "lessons" ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {searchResults.lessons.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("exams")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "exams"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Scholarship Exams</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "exams" ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {searchResults.exams.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("modules")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "modules"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Modules</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "modules" ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {searchResults.modules.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("quizzes")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "quizzes"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Quizzes</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === "quizzes" ? "bg-white/20" : "bg-slate-100 text-slate-600"}`}>
                  {searchResults.quizzes.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === "ai"
                    ? "bg-[#635BFF] text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Tutor Explanations</span>
              </button>
            </div>

            {/* AI Assistant Instant Topic Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-[#635BFF] text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Ask GyanBot AI about &quot;{query}&quot;
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Instant step-by-step breakdown with diagrams, examples, and practice questions for school students.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=concept`)}
                  className="bg-[#635BFF] hover:bg-[#5148E5] text-white text-xs font-semibold rounded-xl gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Explain Concept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=homework`)}
                  className="bg-white border-indigo-200 text-[#635BFF] hover:bg-indigo-50 text-xs font-semibold rounded-xl"
                >
                  Homework Help
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=quiz`)}
                  className="bg-white border-indigo-200 text-[#635BFF] hover:bg-indigo-50 text-xs font-semibold rounded-xl"
                >
                  Quiz Me
                </Button>
              </div>
            </div>

            {/* Empty Match State */}
            {searchResults.totalCount === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#635BFF] mx-auto flex items-center justify-center">
                  <Search className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-slate-800">
                    No curriculum items directly matched &quot;{query}&quot;
                  </h3>
                  <p className="text-xs text-slate-500">
                    Don&apos;t worry! You can ask our AI tutor to teach you this exact concept, or try broadening your filters.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <Button
                    onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}`)}
                    className="bg-[#635BFF] hover:bg-[#5148E5] text-white text-xs font-semibold px-4 rounded-xl gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Ask AI Tutor &quot;{query}&quot;
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="text-xs text-slate-600 rounded-xl"
                  >
                    Clear Filter Constraints
                  </Button>
                </div>
              </div>
            )}

            {/* SECTION 1: Lessons & Audio Lectures */}
            {(activeTab === "all" || activeTab === "lessons") && searchResults.lessons.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#635BFF]" />
                    <span>Lessons & Audio Tracks ({searchResults.lessons.length})</span>
                  </h3>
                  {activeTab === "all" && searchResults.lessons.length > 4 && (
                    <button
                      onClick={() => setActiveTab("lessons")}
                      className="text-xs font-semibold text-[#635BFF] hover:underline"
                    >
                      View all ({searchResults.lessons.length}) ➔
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeTab === "all" ? searchResults.lessons.slice(0, 4) : searchResults.lessons).map((les) => (
                    <Card key={les.id} className="bg-white border-[#E2E8F0] hover:border-[#635BFF] transition-all shadow-2xs rounded-xl overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className="text-[10px] bg-slate-100 text-slate-700 border-slate-200">
                                {les.moduleClass}
                              </Badge>
                              <span className="text-[11px] font-semibold text-[#635BFF] truncate">
                                {les.moduleSubject}
                              </span>
                              <span className="text-[10px] text-slate-400">• {les.moduleTitle}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {les.title}
                            </h4>
                          </div>

                          {/* Media Type Badges */}
                          <div className="flex items-center gap-1 shrink-0">
                            {les.hasVideo && (
                              <span className="p-1 rounded bg-indigo-50 text-indigo-600" title="Video Lesson">
                                <Video className="w-3.5 h-3.5" />
                              </span>
                            )}
                            {les.hasAudio && (
                              <span className="p-1 rounded bg-violet-50 text-violet-600" title="Audio Lecture">
                                <Headphones className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {les.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {les.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{les.duration ? `${Math.round(les.duration / 60)} mins` : "Self-paced"}</span>
                          </div>

                          {/* OR / Dual Playback Actions */}
                          <div className="flex items-center gap-2">
                            {les.hasAudio && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLessonAudio(les)}
                                className="text-xs border-[#635BFF]/30 text-[#635BFF] hover:bg-[#F1EEFF] h-8 px-2.5 gap-1 rounded-lg"
                              >
                                <Headphones className="w-3.5 h-3.5" />
                                <span>Audio</span>
                              </Button>
                            )}

                            {les.hasVideo && (
                              <Button
                                size="sm"
                                onClick={() => openLessonVideo(les)}
                                className="text-xs bg-[#635BFF] hover:bg-[#5148E5] text-white h-8 px-2.5 gap-1 rounded-lg shadow-2xs"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Watch Video</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: Competitive & Scholarship Exams */}
            {(activeTab === "all" || activeTab === "exams") && searchResults.exams.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Competitive Exams & Scholarships ({searchResults.exams.length})</span>
                  </h3>
                  {activeTab === "all" && searchResults.exams.length > 3 && (
                    <button
                      onClick={() => setActiveTab("exams")}
                      className="text-xs font-semibold text-[#635BFF] hover:underline"
                    >
                      View all ({searchResults.exams.length}) ➔
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(activeTab === "all" ? searchResults.exams.slice(0, 4) : searchResults.exams).map((exam) => (
                    <Card key={exam.id} className="bg-white border-[#E2E8F0] hover:border-amber-400 transition-all shadow-2xs rounded-xl overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                                {exam.badge || "Scholarship"}
                              </Badge>
                              <span className="text-[11px] font-semibold text-slate-600">
                                {exam.conductingBody}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {exam.title}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                            Class {exam.eligibleClasses?.join(", ") || "All"}
                          </span>
                        </div>

                        {exam.overview && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {exam.overview}
                          </p>
                        )}

                        {exam.benefits?.title && (
                          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold">{exam.benefits.title}:</span>
                            <span className="truncate">{exam.benefits.description}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400">
                            {exam.category === "scholarship" ? "State / National Grant" : "Admissions / Talent"}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/student/exams?examId=${exam.id}`)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold h-8 px-3 rounded-lg gap-1"
                          >
                            <span>Exam Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 3: Curriculum Learning Modules */}
            {(activeTab === "all" || activeTab === "modules") && searchResults.modules.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                    <span>Curriculum Chapters & Modules ({searchResults.modules.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.modules.map((mod) => (
                    <Card key={mod.id} className="bg-white border-[#E2E8F0] hover:border-violet-400 transition-all shadow-2xs rounded-xl">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className="text-[10px] text-violet-700 border-violet-200 bg-violet-50">
                            {mod.class || "Class 8"}
                          </Badge>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {mod.lessons?.length || 0} Lessons
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {mod.description}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/student#${mod.id}`)}
                            className="text-xs text-[#635BFF] hover:bg-[#F1EEFF] h-7 px-2 font-semibold"
                          >
                            Open Module ➔
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: Quizzes & Practice Tests */}
            {(activeTab === "all" || activeTab === "quizzes") && searchResults.quizzes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>Practice Quizzes ({searchResults.quizzes.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.quizzes.map((quiz) => (
                    <Card key={quiz.id} className="bg-white border-[#E2E8F0] hover:border-emerald-400 transition-all shadow-2xs rounded-xl">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {quiz.difficulty || "Practice"}
                          </Badge>
                          <span className="text-[11px] text-slate-400">Class 6–12</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {quiz.description || "Self-paced multiple choice assessment."}
                        </p>
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/student/quiz?id=${quiz.id}`)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-7 px-3 rounded-lg"
                          >
                            Take Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: AI Explanation Dedicated Tab */}
            {activeTab === "ai" && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-2xs space-y-4 text-center max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#635BFF] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">
                    Deep Study & Concept Assistant
                  </h3>
                  <p className="text-xs text-slate-600">
                    Choose how you want GyanBot AI to explain &quot;{query}&quot;:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  <button
                    onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=concept`)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#635BFF] hover:bg-[#F1EEFF] text-xs transition-all"
                  >
                    <span className="font-bold text-slate-800 block">💡 Concept Explainer</span>
                    <span className="text-[11px] text-slate-500">Core theory and diagrams</span>
                  </button>
                  <button
                    onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=homework`)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#635BFF] hover:bg-[#F1EEFF] text-xs transition-all"
                  >
                    <span className="font-bold text-slate-800 block">📝 Homework Helper</span>
                    <span className="text-[11px] text-slate-500">Step-by-step problem solver</span>
                  </button>
                  <button
                    onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=story`)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#635BFF] hover:bg-[#F1EEFF] text-xs transition-all"
                  >
                    <span className="font-bold text-slate-800 block">📖 Story Mode</span>
                    <span className="text-[11px] text-slate-500">Relatable real-world story</span>
                  </button>
                  <button
                    onClick={() => router.push(`/student/learn-with-ai?q=${encodeURIComponent(query)}&mode=quiz`)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-[#635BFF] hover:bg-[#F1EEFF] text-xs transition-all"
                  >
                    <span className="font-bold text-slate-800 block">❓ Quiz Me</span>
                    <span className="text-[11px] text-slate-500">Interactive check for understanding</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {activeVideoLesson && (
        <VideoPlayer
          lesson={activeVideoLesson}
          module={activeVideoModule}
          offlineBlobUrl={null}
          onClose={() => {
            setActiveVideoLesson(null);
            setActiveVideoModule(null);
          }}
          onComplete={() => {}}
          updatingLessonId={null}
          downloadState={null}
        />
      )}

      {/* Audio Player Modal */}
      {activeAudioLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5" /> Audio Lecture
              </span>
              <button
                onClick={() => setActiveAudioLesson(null)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <LessonAudioPlayer
              src={activeAudioLesson.audio_url || activeAudioLesson.audioUrl || activeAudioLesson.audio_path}
              lessonId={activeAudioLesson.id}
              title={activeAudioLesson.title}
              autoPlay={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
