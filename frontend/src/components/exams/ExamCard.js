"use client";

import React from "react";
import {
  Calendar,
  Building2,
  Award,
  Sparkles,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  ExternalLink,
} from "lucide-react";

export default function ExamCard({
  exam,
  matchScore,
  matchReason,
  keyHighlight,
  isTracked = false,
  onOpenDetails,
  onToggleTrack,
}) {
  const {
    title,
    shortName,
    conductingBody,
    category,
    badge,
    eligibility = {},
    benefits = {},
    importantDates = {},
  } = exam;

  // Determine category color accents
  const getCategoryTheme = (cat) => {
    switch (cat) {
      case "scholarship":
        return {
          pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          accent: "text-emerald-600 dark:text-emerald-400",
          label: "Scholarship & Aid",
        };
      case "school_admission":
        return {
          pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          accent: "text-amber-600 dark:text-amber-400",
          label: "School Admission",
        };
      case "engineering":
        return {
          pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          accent: "text-blue-600 dark:text-blue-400",
          label: "Engineering",
        };
      case "medical":
        return {
          pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
          accent: "text-rose-600 dark:text-rose-400",
          label: "Medical",
        };
      case "defense":
        return {
          pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
          accent: "text-orange-600 dark:text-orange-400",
          label: "Defense",
        };
      case "pure_science":
        return {
          pill: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          accent: "text-purple-600 dark:text-purple-400",
          label: "Research / Pure Science",
        };
      case "central_university":
        return {
          pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
          accent: "text-indigo-600 dark:text-indigo-400",
          label: "Central University",
        };
      default:
        return {
          pill: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          accent: "text-[#635BFF]",
          label: cat.replace("_", " "),
        };
    }
  };

  const theme = getCategoryTheme(category);

  // High-yield tangible benefit summary
  const getBenefitPill = () => {
    if (benefits.monetaryAmountPerYear) {
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(benefits.monetaryAmountPerYear);
      return `${formatted}/yr Cash Grant`;
    }
    if (benefits.title) {
      return benefits.title;
    }
    return "Merit Recognition & Honors";
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#635BFF]/50 transition-all duration-200 flex flex-col justify-between">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${theme.pill}`}
            >
              {theme.label}
            </span>

            {badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {badge}
              </span>
            )}

            {eligibility.classesAllowed && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Class {eligibility.classesAllowed.join(", ")}
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleTrack && onToggleTrack(exam.id)}
            title={isTracked ? "Remove from Tracked Exams" : "Track this Exam"}
            className={`p-2 rounded-xl transition-colors ${
              isTracked
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {isTracked ? (
              <BookmarkCheck className="w-4 h-4 fill-rose-500" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Title & Short Name */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#635BFF] transition-colors leading-snug">
          {shortName ? `${shortName} - ${title}` : title}
        </h3>

        {/* Conducting Body */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 truncate">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{conductingBody}</span>
        </p>

        {/* Tangible Benefit Pill */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <Award className={`w-4 h-4 shrink-0 ${theme.accent}`} />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {getBenefitPill()}
          </span>
        </div>

        {/* Match score spotlight if recommended */}
        {matchScore !== undefined && matchScore !== null && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500 text-white shadow-2xs">
              <Sparkles className="w-3 h-3" />
              {matchScore}% Match
            </span>
            {matchReason && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {matchReason}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Dates + Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Next Timeline Info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-[#635BFF]" />
          <span className="font-medium text-[11px] truncate">
            {importantDates.examDate
              ? `Exam: ${importantDates.examDate}`
              : importantDates.applicationDeadline
              ? `Deadline: ${importantDates.applicationDeadline}`
              : "Timeline Available"}
          </span>
        </div>

        {/* Details CTA */}
        <button
          onClick={() => onOpenDetails && onOpenDetails(exam)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#635BFF]/10 hover:bg-[#635BFF] text-[#635BFF] hover:text-white text-xs font-bold transition-all"
        >
          <span>View Steps</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
