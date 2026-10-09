"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Code,
  Award,
  TrendingUp,
  Palette,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Play,
  GraduationCap,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

const CATEGORY_MAP = {
  ai_tech: { label: "AI & Tech", icon: Cpu, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300" },
  coding: { label: "Robotics & IoT", icon: Code, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300" },
  leadership: { label: "Public Speaking", icon: Award, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300" },
  finance: { label: "Financial Literacy", icon: TrendingUp, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300" },
  design: { label: "UI/UX & Design", icon: Palette, color: "text-pink-600 bg-pink-50 dark:bg-pink-950/60 dark:text-pink-300" },
};

const SOURCE_BADGES = {
  teacher: { label: "Faculty Masterclass", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" },
  alumni: { label: "Alumni Mentor", color: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800" },
  senior: { label: "Senior Peer Scholar", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800" },
  retired_teacher: { label: "Veteran Educator", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" },
  community: { label: "Community Lab", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" },
};

function normalizeCat(raw) {
  const norm = String(raw || "").toLowerCase();
  if (norm.includes("ai") || norm.includes("tech") || norm.includes("prompt")) return "ai_tech";
  if (norm.includes("robot") || norm.includes("iot") || norm.includes("cod")) return "coding";
  if (norm.includes("speak") || norm.includes("debate") || norm.includes("lead")) return "leadership";
  if (norm.includes("finan") || norm.includes("money") || norm.includes("budget")) return "finance";
  if (norm.includes("design") || norm.includes("ui") || norm.includes("art")) return "design";
  return "ai_tech";
}

export default function DashboardSkillCoursesPreview({ studentClass = "Class 8", studentId = "student_guest" }) {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/skills?studentClass=${encodeURIComponent(studentClass)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data)) {
            setCourses(data);
          }
        }

        if (studentId) {
          const enrRes = await fetch(`/api/skills/enroll?studentId=${encodeURIComponent(studentId)}`);
          if (enrRes.ok) {
            const enrData = await enrRes.json();
            if (active && Array.isArray(enrData?.enrollments)) {
              const map = {};
              enrData.enrollments.forEach((e) => {
                map[e.course_id] = e;
              });
              setEnrollments(map);
            }
          }
        }
      } catch (err) {
        console.error("DashboardSkillCoursesPreview error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [studentClass, studentId]);

  const filteredCourses = useMemo(() => {
    if (selectedFilter === "all") return courses.slice(0, 4);
    return courses.filter((c) => normalizeCat(c.category) === selectedFilter).slice(0, 4);
  }, [courses, selectedFilter]);

  if (loading && courses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#172033] dark:text-white tracking-tight leading-none">
                Skill Micro-Courses & Tracks
              </h2>
              <Badge className="bg-purple-100 text-[#635BFF] dark:bg-purple-950/70 dark:text-purple-300 text-[10px] font-bold border-0 px-2 py-0.5">
                Teacher Verified
              </Badge>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-400 font-medium mt-1">
              Faculty-curated hands-on tracks in AI, robotics, finance & leadership
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/courses?tab=skills"
            className="text-xs font-bold text-[#635BFF] hover:text-[#5148E5] hover:underline flex items-center gap-1"
          >
            All Tracks ({courses.length}) →
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedFilter === "all"
              ? "bg-[#635BFF] text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white border border-[#E2E8F0] dark:border-slate-700"
          }`}
        >
          All Domains
        </button>
        {Object.entries(CATEGORY_MAP).map(([key, config]) => {
          const Icon = config.icon;
          const count = courses.filter((c) => normalizeCat(c.category) === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedFilter === key
                  ? "bg-[#635BFF] text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-[#64748B] dark:text-slate-400 hover:text-[#172033] dark:hover:text-white border border-[#E2E8F0] dark:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{config.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedFilter === key ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCourses.map((course) => {
          const catKey = normalizeCat(course.category);
          const catConfig = CATEGORY_MAP[catKey] || CATEGORY_MAP.ai_tech;
          const CatIcon = catConfig.icon;
          const sourceInfo = SOURCE_BADGES[course.source_type] || SOURCE_BADGES.teacher;
          const enrollment = enrollments[course.id];
          const isEnrolled = !!enrollment;
          const progress = enrollment?.progress_percent || 0;
          const modulesCount = Array.isArray(course.curriculum) ? course.curriculum.length : 3;

          return (
            <Card
              key={course.id}
              className="bg-white dark:bg-slate-800/90 border border-[#E2E8F0] dark:border-slate-700 rounded-2xl hover:shadow-md hover:border-[#635BFF]/30 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${catConfig.color}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catConfig.label}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${sourceInfo.color}`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{sourceInfo.label}</span>
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="font-bold text-[#172033] dark:text-white text-sm line-clamp-2 group-hover:text-[#635BFF] transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium mt-1 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-[#635BFF]" />
                    <span>{course.author_name || "School Faculty"}</span>
                  </p>
                  {course.description && (
                    <p className="text-xs text-[#475569] dark:text-slate-300 line-clamp-2 mt-1.5 font-normal">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Footer details & CTA */}
                <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9] dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration_hours || 4}h • {modulesCount} mods
                    </span>
                    <span className="capitalize font-semibold text-[#635BFF]">
                      {course.level || "Beginner"}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-slate-100 dark:bg-slate-700" />
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl shadow-xs mt-2"
                        asChild
                      >
                        <Link href={`/student/courses?tab=skills&courseId=${encodeURIComponent(course.id)}`}>
                          <Play className="w-3 h-3 mr-1 fill-current" />
                          Continue ({progress}%)
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-[#635BFF] hover:bg-[#5148E5] text-white font-bold text-xs h-8 rounded-xl shadow-xs"
                      asChild
                    >
                      <Link href={`/student/courses?tab=skills&courseId=${encodeURIComponent(course.id)}`}>
                        Explore Syllabus →
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
