"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/components/ThemeProvider";
import {
  Sparkles,
  BookOpen,
  Cpu,
  Code,
  Award,
  Palette,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  X,
  ShieldCheck,
  GraduationCap,
  Star,
  Play,
  Check,
  Filter,
  Flame,
  ArrowRight,
  TrendingUp,
  Layers,
  Search,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const CATEGORIES = [
  { id: "all", label: "All Skills", icon: Sparkles },
  { id: "ai_tech", label: "AI & Emerging Tech", icon: Cpu },
  { id: "coding", label: "Robotics & IoT", icon: Code },
  { id: "leadership", label: "Public Speaking & Debate", icon: Award },
  { id: "finance", label: "Financial Literacy", icon: TrendingUp },
  { id: "design", label: "UI/UX & Design", icon: Palette },
];

const SOURCE_LABELS = {
  teacher: { label: "Faculty Masterclass", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" },
  alumni: { label: "Alumni Mentor", color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800" },
  senior: { label: "Senior Peer Scholar", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800" },
  retired_teacher: { label: "Veteran Educator", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" },
  community: { label: "Community Lab", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" },
};

function normalizeCategoryKey(raw) {
  const norm = String(raw || "").toLowerCase();
  if (norm.includes("ai") || norm.includes("tech") || norm.includes("prompt")) return "ai_tech";
  if (norm.includes("robot") || norm.includes("iot") || norm.includes("cod") || norm.includes("sensor")) return "coding";
  if (norm.includes("speak") || norm.includes("debate") || norm.includes("lead") || norm.includes("story")) return "leadership";
  if (norm.includes("finan") || norm.includes("money") || norm.includes("invest") || norm.includes("budget")) return "finance";
  if (norm.includes("design") || norm.includes("ui") || norm.includes("ux") || norm.includes("art")) return "design";
  return "ai_tech";
}

export default function StudentSkillCoursesSection({ initialClass }) {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSource, setActiveSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  const searchParams = useSearchParams();
  const studentId = user?.id || "guest_student";
  const studentName = user?.fullName || user?.firstName || "Student";
  const studentClass = initialClass || user?.unsafeMetadata?.class || "Class 8";

  // Deep-link auto-open for courseId in URL query
  useEffect(() => {
    const cId = searchParams?.get("courseId");
    if (cId && courses.length > 0 && !selectedCourse) {
      const match = courses.find((c) => String(c.id) === String(cId));
      if (match) {
        setSelectedCourse(match);
      }
    }
  }, [searchParams, courses, selectedCourse]);

  // Fetch skill courses from API
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({ studentClass });
        const res = await fetch(`/api/skills?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data)) {
            setCourses(data);
          }
        }

        // Also fetch student's active enrollments
        if (studentId) {
          const enrRes = await fetch(`/api/skills/enroll?studentId=${encodeURIComponent(studentId)}`);
          if (enrRes.ok) {
            const enrData = await enrRes.json();
            if (active && Array.isArray(enrData?.enrollments)) {
              const enrMap = {};
              enrData.enrollments.forEach((e) => {
                enrMap[e.course_id] = e;
              });
              setEnrollments(enrMap);
            }
          }
        }
      } catch (err) {
        console.warn("[StudentSkillCoursesSection] Load failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [studentClass, studentId]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const catKey = normalizeCategoryKey(c.category);
      const matchesCat = activeCategory === "all" || catKey === activeCategory;
      const matchesSrc = activeSource === "all" || (c.source_type || "teacher") === activeSource;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        c.title.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query)) ||
        (c.instructor_name && c.instructor_name.toLowerCase().includes(query)) ||
        (c.author_name && c.author_name.toLowerCase().includes(query));

      return matchesCat && matchesSrc && matchesSearch;
    });
  }, [courses, activeCategory, activeSource, searchQuery]);

  // Enrolled courses list
  const enrolledCourses = useMemo(() => {
    return courses.filter((c) => Boolean(enrollments[c.id]));
  }, [courses, enrollments]);

  // Handle Enrollment
  const handleEnrollOrProgress = async (courseId, incrementPct = null) => {
    setEnrollingId(courseId);
    try {
      const current = enrollments[courseId];
      const newPct = incrementPct !== null
        ? Math.min(100, Math.max(0, incrementPct))
        : (current ? Math.min(100, (current.progress_percent || 0) + 25) : 25);

      const isCompleted = newPct >= 100;

      const res = await fetch("/api/skills/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentId,
          studentName,
          progressPercent: newPct,
          completed: isCompleted,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setEnrollments((prev) => ({
          ...prev,
          [courseId]: result.enrollment || {
            course_id: courseId,
            student_id: studentId,
            progress_percent: newPct,
            completed: isCompleted,
          },
        }));

        if (selectedCourse && selectedCourse.id === courseId) {
          setSelectedCourse((prev) => ({
            ...prev,
            progress_percent: newPct,
            completed: isCompleted,
          }));
        }
      }
    } catch (err) {
      console.warn("Enrollment error:", err);
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-8 border border-indigo-800/40 shadow-xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                Teacher &amp; Faculty Curated Skill Tracks
              </span>
              <span className="text-xs text-indigo-300/80 font-medium">
                {studentClass} Eligible
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Skill Micro-Courses &amp; Masterclasses
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
              Equip yourself with high-demand practical skills in Artificial Intelligence, Robotics, Public Speaking, and Financial Literacy curated by school teachers and certified alumni mentors.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <div className="text-2xl font-black text-white">{courses.length}</div>
              <div className="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider">Tracks</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[90px]">
              <div className="text-2xl font-black text-emerald-300">{enrolledCourses.length}</div>
              <div className="text-[11px] text-indigo-200 font-semibold uppercase tracking-wider">Enrolled</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: IN-PROGRESS ENROLLED MICRO-COURSES (If any) */}
      {enrolledCourses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                My Enrolled Micro-Courses
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {enrolledCourses.length} Active Track{enrolledCourses.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => {
              const enr = enrollments[course.id] || {};
              const progressPct = enr.progress_percent || 0;
              const isCompleted = enr.completed || progressPct >= 100;

              return (
                <div
                  key={`enr_${course.id}`}
                  className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/40 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {course.badge_name || "Skill Track"}
                      </span>
                      {isCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                          ✓ Completed
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {progressPct}% Done
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      By {course.instructor_name || course.author_name}
                    </p>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      View Syllabus &amp; Modules
                    </button>
                    <Button
                      size="sm"
                      onClick={() => handleEnrollOrProgress(course.id)}
                      disabled={enrollingId === course.id}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-2.5 font-semibold"
                    >
                      {isCompleted ? "Review Track" : "Continue →"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CATEGORY FILTER TABS & SEARCH */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Domain Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill courses..."
              className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Source Filter Sub-Bar */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-500 shrink-0">Contributor:</span>
          {["all", "teacher", "alumni", "senior", "community"].map((srcKey) => {
            const isActive = activeSource === srcKey;
            const label =
              srcKey === "all"
                ? "All Mentors"
                : srcKey === "teacher"
                ? "🏫 Faculty"
                : srcKey === "alumni"
                ? "🎓 Alumni"
                : srcKey === "senior"
                ? "⭐ Peers"
                : "🌐 Labs";

            return (
              <button
                key={srcKey}
                type="button"
                onClick={() => setActiveSource(srcKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: SKILL MICRO-COURSES GRID */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading teacher skill micro-courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No skill courses found matching criteria
          </h4>
          <p className="text-xs text-slate-400">
            Try switching domain filters or clear your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const enr = enrollments[course.id];
            const isEnrolled = Boolean(enr);
            const isCompleted = Boolean(enr?.completed || (enr?.progress_percent || 0) >= 100);
            const sourceMeta = SOURCE_LABELS[course.source_type] || SOURCE_LABELS.teacher;

            return (
              <Card
                key={course.id}
                className="group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden rounded-2xl"
              >
                <div className="p-5 pb-3">
                  {/* Top Bar: Contributor attribution + Level */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${sourceMeta.color}`}>
                      {sourceMeta.label}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {course.level || "Beginner"}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Key Highlights */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{course.duration_hours || 10} Hours Content</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{course.modules_count || 4} Modules</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Instructor + Action */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {course.instructor_name || course.author_name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {course.author_role || "Instructor"}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setSelectedCourse(course)}
                    className="h-8 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 px-3 cursor-pointer shadow-xs"
                  >
                    {isCompleted ? "View Badge" : isEnrolled ? "Continue" : "Explore"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* INTERACTIVE COURSE SYLLABUS & ENROLLMENT MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                    {selectedCourse.category || "Skill Track"}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {selectedCourse.level || "Beginner"} • {selectedCourse.duration_hours || 10} Hours
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedCourse.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {/* Instructor Profile Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(selectedCourse.instructor_name || selectedCourse.author_name || "T").charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {selectedCourse.instructor_name || selectedCourse.author_name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {selectedCourse.author_role || "Official Course Mentor"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 shrink-0">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Verified Mentor
                </Badge>
              </div>

              {/* Course Overview */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 text-xs uppercase tracking-wider">
                  Course Overview &amp; Learning Objectives
                </h4>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedCourse.description}
                </p>
              </div>

              {/* Curriculum Breakdown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Curriculum Modules ({(selectedCourse.curriculum || []).length || selectedCourse.modules_count || 4})
                  </h4>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Hands-on Practice
                  </span>
                </div>

                <div className="space-y-2">
                  {Array.isArray(selectedCourse.curriculum) && selectedCourse.curriculum.length > 0 ? (
                    selectedCourse.curriculum.map((mod, idx) => (
                      <div
                        key={mod.id || idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            {mod.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                          {mod.duration || "2h"}
                        </span>
                      </div>
                    ))
                  ) : (
                    Array.from({ length: selectedCourse.modules_count || 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                            Module {idx + 1}: Foundational Core &amp; Interactive Application
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                          2.5 Hours
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Certificate / Badge Preview */}
              <div className="p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedCourse.badge_icon || "⚡"}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-amber-900 dark:text-amber-300">
                    Earn Digital Credential: {selectedCourse.badge_name || "Skill Specialist Badge"}
                  </h5>
                  <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                    Complete all modules to receive a certified completion credential on your GyanVerse profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {enrollments[selectedCourse.id] ? (
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Status: {enrollments[selectedCourse.id].progress_percent || 0}% Complete
                  </span>
                ) : (
                  <span>Free enrollment for all students</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCourse(null)}
                  className="text-xs h-9"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleEnrollOrProgress(selectedCourse.id)}
                  disabled={enrollingId === selectedCourse.id}
                  className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {enrollments[selectedCourse.id]?.completed
                    ? "✓ Course Completed"
                    : enrollments[selectedCourse.id]
                    ? "Mark Next Module Complete (+25%)"
                    : "Enroll in Micro-Course"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
