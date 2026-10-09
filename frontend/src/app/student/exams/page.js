"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Sparkles,
  Search,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Filter,
  GraduationCap,
  Calendar,
  Layers,
  SlidersHorizontal,
  X,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { EXAMS_DATABASE } from "@/data/examsData";
import {
  getPersonalizedExamRecommendations,
  filterExams,
} from "@/lib/recommendationEngine";
import ExamCard from "@/components/exams/ExamCard";
import ExamDetailModal from "@/components/exams/ExamDetailModal";
import RecommendationWizardModal from "@/components/exams/RecommendationWizardModal";

export default function ExamsHubPage() {
  // 1. Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [classBracket, setClassBracket] = useState("all");
  const [specificClass, setSpecificClass] = useState("all");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'open_now' | 'tracked'

  // 2. Tracked (Bookmarked) Exams State
  const [trackedExamIds, setTrackedExamIds] = useState([]);

  // 3. Modals State
  const [selectedExam, setSelectedExam] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // 4. Student Profile for Personalization
  const [studentProfile, setStudentProfile] = useState({
    studentClass: 10,
    stream: "general",
    aspiration: "scholarship_financial_aid",
    familyIncome: "below_1_5L",
    state: "Odisha",
  });

  // Load tracked exams and profile from localStorage on client mount
  useEffect(() => {
    try {
      const savedTracks = localStorage.getItem("tracked_exams_list");
      if (savedTracks) {
        setTrackedExamIds(JSON.parse(savedTracks));
      }
      const savedProfile = localStorage.getItem("student_exam_profile");
      if (savedProfile) {
        setStudentProfile(JSON.parse(savedProfile));
      }
    } catch (e) {
      console.warn("Could not load exam data from localStorage", e);
    }
  }, []);

  // Toggle Tracking an Exam
  const handleToggleTrack = (examId) => {
    setTrackedExamIds((prev) => {
      let next;
      if (prev.includes(examId)) {
        next = prev.filter((id) => id !== examId);
      } else {
        next = [...prev, examId];
      }
      try {
        localStorage.setItem("tracked_exams_list", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Generate Personalized Recommendations based on Student Profile
  const recommendations = useMemo(() => {
    return getPersonalizedExamRecommendations(studentProfile, EXAMS_DATABASE);
  }, [studentProfile]);

  // Create a fast lookup map for recommendations by examId
  const recommendationMap = useMemo(() => {
    const map = new Map();
    recommendations.forEach((rec) => {
      map.set(rec.exam.id, rec);
    });
    return map;
  }, [recommendations]);

  // Filtered examinations list
  const filteredExams = useMemo(() => {
    let list = filterExams(EXAMS_DATABASE, {
      classBracket,
      specificClass,
      category,
      status: statusFilter === "open_now" ? "open_now" : "all",
      searchQuery,
    });

    // If 'tracked' filter is active, only show bookmarked exams
    if (statusFilter === "tracked") {
      list = list.filter((exam) => trackedExamIds.includes(exam.id));
    }

    return list;
  }, [classBracket, specificClass, category, statusFilter, searchQuery, trackedExamIds]);

  // Top 3 Spotlighted Recommendations
  const topRecommendations = useMemo(() => {
    return recommendations.slice(0, 3);
  }, [recommendations]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setClassBracket("all");
    setSpecificClass("all");
    setCategory("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* =========================================================
          HERO BANNER
         ========================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#0F172A] p-6 sm:p-8 md:p-10 text-white shadow-xl">
        {/* Subtle decorative background blur shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#635BFF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Authoritative National & State Examination Portal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Exams, Scholarships & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-300 via-indigo-200 to-white bg-clip-text text-transparent">
              Admissions Roadmap
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Discover class-wise entrance exams, state talent scholarships (PMST, NMMS, NRTS),
            boarding admissions (Navodaya, Sainik School), and national entrances (JEE, NEET,
            NDA, NEST, CUET) with step-by-step verified timelines and syllabus breakdowns.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Total Covered
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-300">
                23 Active Exams
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Grades & Levels
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">
                Class 5 to 12
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Scholarships / Aid
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">
                ₹2.4 Cr+ Pool
              </p>
            </div>
          </div>

          {/* Wizard Action Button */}
          <div className="pt-2">
            <button
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#635BFF] to-indigo-600 hover:from-[#5249e0] hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-[#635BFF]/30 hover:scale-102 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Find My Perfect Matching Exams</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          PERSONALIZED SPOTLIGHT SECTION
         ========================================================= */}
      {topRecommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-[#635BFF]/10 text-[#635BFF]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Recommended for Class {studentProfile.studentClass} ({studentProfile.stream.toUpperCase()})
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Top matched opportunities tailored to your class level, state domicile, and aspirations.
              </p>
            </div>

            <button
              onClick={() => setIsWizardOpen(true)}
              className="text-xs font-bold text-[#635BFF] hover:underline flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adjust Student Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommendations.map((rec) => (
              <ExamCard
                key={rec.exam.id}
                exam={rec.exam}
                matchScore={rec.matchScore}
                matchReason={rec.reasons?.[0]}
                keyHighlight={rec.keyHighlight}
                isTracked={trackedExamIds.includes(rec.exam.id)}
                onOpenDetails={(ex) => setSelectedExam(ex)}
                onToggleTrack={handleToggleTrack}
              />
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          DIRECTORY CONTROLS: SEARCH & MULTI-TIER FILTERS
         ========================================================= */}
      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Class Bracket Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            {[
              { id: "all", label: "All Classes (5–12)" },
              { id: "class_5_8", label: "Classes 5–8 (Foundation & Aid)" },
              { id: "class_9_10", label: "Classes 9–10 (Secondary & Talent)" },
              { id: "class_11_12", label: "Classes 11–12 (Career Entrances)" },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setClassBracket(b.id);
                  setSpecificClass("all");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  classBracket === b.id
                    ? "bg-white dark:bg-slate-900 text-[#635BFF] shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exam, conducting body, NEET, PMST..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Specific Class Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Grade:
          </span>
          {["all", "5", "6", "7", "8", "9", "10", "11", "12"].map((cls) => {
            const isSelected = specificClass === cls;
            return (
              <button
                key={cls}
                onClick={() => setSpecificClass(cls)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#635BFF] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {cls === "all" ? "All Grades" : `Class ${cls}`}
              </button>
            );
          })}
        </div>

        {/* Category & Status Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Categories" },
              { id: "scholarship", label: "Scholarships & Aid" },
              { id: "school_admission", label: "School Admissions" },
              { id: "engineering", label: "Engineering" },
              { id: "medical", label: "Medical" },
              { id: "defense", label: "Defense (NDA)" },
              { id: "pure_science", label: "Research (IISER/NEST)" },
              { id: "central_university", label: "Central Univs (CUET)" },
              { id: "law", label: "Law (CLAT)" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  category === cat.id
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent font-bold shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Switches (Open Now, Tracked) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter(statusFilter === "open_now" ? "all" : "open_now")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                statusFilter === "open_now"
                  ? "bg-emerald-500 text-white border-transparent"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Applications Live</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === "tracked" ? "all" : "tracked")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                statusFilter === "tracked"
                  ? "bg-rose-500 text-white border-transparent"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Tracked ({trackedExamIds.length})</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          DIRECTORY RESULTS GRID
         ========================================================= */}
      <section className="space-y-4">
        {/* Count Header */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-900 dark:text-white">{filteredExams.length}</strong> of{" "}
            {EXAMS_DATABASE.length} examinations
          </span>

          {(classBracket !== "all" ||
            specificClass !== "all" ||
            category !== "all" ||
            statusFilter !== "all" ||
            searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-[#635BFF] hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExams.map((exam) => {
              const rec = recommendationMap.get(exam.id);
              return (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  matchScore={rec ? rec.matchScore : null}
                  matchReason={rec?.reasons?.[0]}
                  keyHighlight={rec?.keyHighlight}
                  isTracked={trackedExamIds.includes(exam.id)}
                  onOpenDetails={(ex) => setSelectedExam(ex)}
                  onToggleTrack={handleToggleTrack}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching examinations found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn&apos;t find any exams matching your current filters or search query. Try broadening your criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-[#635BFF] text-white text-xs font-bold hover:bg-[#5249e0] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      {/* =========================================================
          MODALS INTEGRATION
         ========================================================= */}
      {/* 1. Exam Detail Modal */}
      <ExamDetailModal
        exam={selectedExam}
        isOpen={Boolean(selectedExam)}
        onClose={() => setSelectedExam(null)}
        isTracked={selectedExam ? trackedExamIds.includes(selectedExam.id) : false}
        onToggleTrack={handleToggleTrack}
      />

      {/* 2. Recommendation Wizard Modal */}
      <RecommendationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialProfile={studentProfile}
        onComplete={(newProfile) => {
          setStudentProfile(newProfile);
          // Auto filter to their class for immediate feedback
          setSpecificClass(String(newProfile.studentClass));
        }}
      />
    </div>
  );
}
