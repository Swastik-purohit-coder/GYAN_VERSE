"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Play,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Video,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { SubHeader } from "./sub-header";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import YouTubePlayer from "./YouTubePlayer";
import { useCourses } from "@/hooks/useCourses";
import StudentSkillCoursesSection from "./StudentSkillCoursesSection";

// Map subject icons cleanly
const getSubjectIcon = (iconName, subjectName) => {
  const norm = (iconName || subjectName || "").toLowerCase();
  if (norm.includes("math") || norm.includes("calc")) {
    return <Calculator className="w-6 h-6 text-indigo-400" />;
  }
  if (norm.includes("sci") || norm.includes("flask") || norm.includes("chem") || norm.includes("phys")) {
    return <FlaskConical className="w-6 h-6 text-emerald-400" />;
  }
  if (norm.includes("eng") || norm.includes("book") || norm.includes("read") || norm.includes("lit")) {
    return <BookOpen className="w-6 h-6 text-amber-400" />;
  }
  return <Layers className="w-6 h-6 text-cyan-400" />;
};

export function CourseSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    studentClass,
    canonicalClassName,
    subjects,
    message,
    loading,
    error,
    updateVideoProgress,
  } = useCourses();

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [activeTab, setActiveTab] = useState(
    searchParams?.get("tab") === "skills" ? "skills" : "curriculum"
  );

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    if (tabParam === "skills") {
      setActiveTab("skills");
    } else if (tabParam === "curriculum") {
      setActiveTab("curriculum");
    }
  }, [searchParams]);

  // Derive the active subject object
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [selectedSubjectId, subjects]);

  // Support deep-linking from searchParams: /student/courses?subject=Mathematics
  useEffect(() => {
    const subjectParam = searchParams?.get("subject");
    if (!subjectParam || selectedSubjectId || !subjects.length) return;

    const paramLower = subjectParam.trim().toLowerCase();
    const matched = subjects.find(
      (s) => s.subjectName.toLowerCase() === paramLower || s.id.toLowerCase() === paramLower
    );
    if (matched) {
      setSelectedSubjectId(matched.id);
    }
  }, [searchParams, selectedSubjectId, subjects]);

  const handleProgressUpdate = ({ videoId, currentTime, duration, completed }) => {
    updateVideoProgress({
      videoId,
      lastPosition: currentTime,
      duration,
      completed,
    });
  };

  const currentClassTitle = canonicalClassName || studentClass || "My Class";

  return (
    <div className="space-y-6">
      <SubHeader showProgress showStreak user={{ streak: 7, xp: 620, xpToNextLevel: 1000, level: 10 }} />

      <Card className="border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#172033] dark:text-white shadow-xs rounded-2xl backdrop-blur-sm transition-colors">
        <CardContent className="p-6">
          {/* Top Breadcrumb & Header */}
          <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#635BFF] dark:text-indigo-400">
                  <span>Courses</span>
                  {selectedSubject && (
                    <>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600 dark:text-slate-300">{currentClassTitle}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-[#172033] dark:text-white font-bold">{selectedSubject.subjectName}</span>
                    </>
                  )}
                </div>
                <h1 className="mt-1 text-2xl font-black text-[#172033] dark:text-white tracking-tight">
                  {selectedSubject ? `${selectedSubject.subjectName}` : `${currentClassTitle} Courses`}
                </h1>
              </div>

              {!selectedSubject && (
                <div className="mt-2 sm:mt-0 flex items-center gap-2">
                  <Badge variant="outline" className="border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-[#635BFF] dark:text-indigo-400" />
                    {activeTab === "skills" ? "Teacher & Mentor Micro-Courses" : "Curated YouTube Curriculum"}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* SECTION SWITCHER TABS (Academic Curriculum vs Skill Micro-Courses) */}
          {!selectedSubject && (
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 w-fit mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("curriculum");
                  router.replace("/student/courses?tab=curriculum");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "curriculum"
                    ? "bg-white dark:bg-slate-900 text-[#635BFF] dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Academic Curriculum</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("skills");
                  router.replace("/student/courses?tab=skills");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Skill Micro-Courses &amp; Tracks</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-500 font-extrabold px-1.5 py-0.5 rounded-full border border-amber-400/30">
                  TEACHER ADDED
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: SKILL MICRO-COURSES CONTENT */}
          {!selectedSubject && activeTab === "skills" && (
            <StudentSkillCoursesSection initialClass={currentClassTitle} />
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Loading your class courses...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
              <p className="font-semibold">Unable to load courses:</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
            </div>
          )}

          {/* Missing Class in Profile */}
          {!loading && !error && !studentClass && (
            <div className="py-12 text-center text-slate-600 dark:text-slate-300 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-[#172033] dark:text-white">Student Class Required</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {message || "Please select your Class in your profile to access your class-specific courses."}
              </p>
              <Button
                onClick={() => router.push("/role-select")}
                className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl text-xs font-semibold px-4 py-2 shadow-xs"
              >
                Set My Class
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && studentClass && subjects.length === 0 && (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Video className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
              <h3 className="text-base font-semibold text-[#172033] dark:text-slate-200">
                No course videos are available for {currentClassTitle} yet.
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Class curriculum videos will appear here once published.
              </p>
            </div>
          )}

          {/* VIEW 1: SUBJECTS OVERVIEW GRID (ACADEMIC CURRICULUM) */}
          {!loading && !error && !selectedSubject && activeTab === "curriculum" && subjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((subject) => {
                const total = subject.totalVideos || 0;
                const completed = subject.completedVideos || 0;
                const progressPct = subject.progressPercent || 0;
                const isStarted = progressPct > 0;

                return (
                  <div
                    key={subject.id}
                    className="group relative rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#635BFF]/40 dark:hover:border-indigo-500/50 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Icon + Video Count Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-[#635BFF] dark:text-indigo-400 group-hover:border-[#635BFF]/40 transition-colors shadow-xs">
                          {getSubjectIcon(subject.icon, subject.subjectName)}
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 text-xs px-2.5 py-0.5 shadow-xs"
                        >
                          {total} {total === 1 ? "video" : "videos"}
                        </Badge>
                      </div>

                      {/* Subject Name */}
                      <h3 className="text-lg font-bold text-[#172033] dark:text-white tracking-tight group-hover:text-[#635BFF] dark:group-hover:text-indigo-300 transition-colors">
                        {subject.subjectName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                        {total} learning videos
                      </p>

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-1.5 mb-5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Completion</span>
                          <span className="font-bold text-[#635BFF] dark:text-indigo-300">{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden border border-slate-200/60 dark:border-slate-700/40">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {completed} of {total} completed
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => setSelectedSubjectId(subject.id)}
                      className={`w-full rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-all ${
                        isStarted
                          ? "bg-[#635BFF] hover:bg-[#5148E5] text-white shadow-md shadow-indigo-600/20"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white border border-slate-200/80 dark:border-slate-600"
                      }`}
                    >
                      <span>{isStarted ? "Continue Learning" : "Start Learning"}</span>
                      <span>→</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: SUBJECT VIDEO LIST */}
          {!loading && !error && selectedSubject && (
            <div className="space-y-6">
              {/* Back to courses button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedSubjectId(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors group cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#635BFF] dark:text-indigo-400 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Courses</span>
                </button>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-[#172033] dark:text-white">{selectedSubject.completedVideos}</span> of{" "}
                  <span className="font-bold text-[#172033] dark:text-white">{selectedSubject.totalVideos}</span> completed (
                  <span className="text-[#635BFF] dark:text-indigo-400 font-semibold">{selectedSubject.progressPercent}%</span>)
                </div>
              </div>

              {/* Subject Title Banner */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#635BFF] dark:text-indigo-400 shadow-xs">
                    {getSubjectIcon(selectedSubject.icon, selectedSubject.subjectName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#172033] dark:text-white">
                      {currentClassTitle} → {selectedSubject.subjectName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Curated educational videos ordered by curriculum sequence
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-48 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${selectedSubject.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-right text-slate-500 dark:text-slate-400">
                    {selectedSubject.progressPercent}% completed
                  </div>
                </div>
              </div>

              {/* Video List */}
              {selectedSubject.videos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  No videos published for {selectedSubject.subjectName} yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSubject.videos.map((vid, idx) => {
                    const isCompleted = Boolean(vid.progress?.completed);
                    const inProgress = !isCompleted && (vid.progress?.lastPosition || 0) > 0;
                    const durationMins = vid.duration ? Math.round(vid.duration / 60) : null;

                    return (
                      <div
                        key={vid.id}
                        className={`group rounded-xl border p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isCompleted
                            ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80"
                            : inProgress
                            ? "bg-white dark:bg-slate-800/90 border-[#635BFF]/40 dark:border-indigo-500/40 shadow-sm shadow-indigo-500/10"
                            : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800 shadow-xs"
                        }`}
                      >
                        {/* Video Info Left */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {/* Order Number / Status Icon */}
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                              isCompleted
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : inProgress
                                ? "bg-indigo-500/15 text-[#635BFF] dark:text-indigo-400 border border-indigo-500/30"
                                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-[#172033] dark:text-white text-sm group-hover:text-[#635BFF] dark:group-hover:text-indigo-300 transition-colors">
                                {vid.title}
                              </h4>
                              <Badge className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/40 text-[10px] px-1.5 py-0">
                                YouTube
                              </Badge>
                              {isCompleted && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/40 text-[10px] px-1.5 py-0">
                                  Completed
                                </Badge>
                              )}
                              {inProgress && (
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40 text-[10px] px-1.5 py-0">
                                  In Progress ({vid.progress?.completionPct}%)
                                </Badge>
                              )}
                            </div>

                            {vid.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                {vid.description}
                              </p>
                            )}

                            {durationMins && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>~{durationMins} min</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Watch Action Button */}
                        <div className="w-full sm:w-auto shrink-0 flex justify-end">
                          <Button
                            onClick={() => setActiveVideo(vid)}
                            className={`rounded-xl text-xs font-semibold px-4 py-2 flex items-center gap-1.5 w-full sm:w-auto ${
                              isCompleted
                                ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-600"
                                : "bg-[#635BFF] hover:bg-[#5148E5] text-white shadow-sm shadow-indigo-600/30"
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch</span>
                            <span>→</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW 3: YOUTUBE VIDEO PLAYER MODAL */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="space-y-0.5 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-indigo-600 text-white text-[10px]">
                    {selectedSubject?.subjectName || "Course"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {currentClassTitle}
                  </span>
                  {activeVideo.progress?.completed && (
                    <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </Badge>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <YouTubePlayer
                url={activeVideo.youtubeUrl}
                courseVideoId={activeVideo.id}
                onProgress={handleProgressUpdate}
                autoPlay={true}
              />
            </div>

            {/* Modal Footer & Information */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {activeVideo.description || "Watch this lesson video to make progress in your course."}
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <Button
                  size="sm"
                  variant={activeVideo.progress?.completed ? "default" : "outline"}
                  className={`text-xs rounded-xl ${
                    activeVideo.progress?.completed
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                  onClick={() => {
                    const nextCompleted = !activeVideo.progress?.completed;
                    handleProgressUpdate({
                      videoId: activeVideo.id,
                      currentTime: activeVideo.duration || 100,
                      duration: activeVideo.duration || 100,
                      completed: nextCompleted,
                    });
                    setActiveVideo((prev) =>
                      prev
                        ? {
                            ...prev,
                            progress: {
                              ...prev.progress,
                              completed: nextCompleted,
                              completionPct: nextCompleted ? 100 : 0,
                            },
                          }
                        : null
                    );
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  {activeVideo.progress?.completed ? "Completed" : "Mark Complete"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                  onClick={() => setActiveVideo(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseSelection;
