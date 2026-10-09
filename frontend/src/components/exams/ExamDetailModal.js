"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Building2,
  Clock,
  Award,
  BookOpen,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  MapPin,
  ListOrdered,
  FileText,
  HelpCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import ExamTimelineStepper from "./ExamTimelineStepper";

export default function ExamDetailModal({
  exam,
  isOpen,
  onClose,
  isTracked = false,
  onToggleTrack,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !exam) return null;

  const {
    title,
    shortName,
    conductingBody,
    category,
    badge,
    overview,
    howItWorks,
    benefits = {},
    eligibility = {},
    timeline = [],
    importantDates = {},
    syllabusPattern = {},
    officialLinks = [],
    recommendationTags = [],
  } = exam;

  // Format currency in Indian numbering format
  const formatINR = (amt) => {
    if (!amt) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const totalCalculatedBenefit =
    benefits.monetaryAmountPerYear && benefits.durationYears
      ? benefits.monetaryAmountPerYear * benefits.durationYears
      : null;

  const tabs = [
    { id: "overview", label: "Overview", icon: BookOpen },
    { id: "benefits", label: "Benefits & Aid", icon: Award },
    { id: "eligibility", label: "Eligibility", icon: ShieldCheck },
    { id: "timeline", label: "Steps & Timeline", icon: ListOrdered },
    { id: "syllabus", label: "Syllabus & Pattern", icon: FileText },
    { id: "links", label: "Official Portals", icon: ExternalLink },
  ];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 transition-opacity animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/60">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2 pr-10">
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/20">
                {badge}
              </span>
            )}
            <span className="text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {category.replace("_", " ")}
            </span>
            {eligibility.classesAllowed && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Classes {eligibility.classesAllowed.join(", ")}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#635BFF]" />
            Conducted by <span className="font-semibold text-slate-700 dark:text-slate-200">{conductingBody}</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none bg-slate-50/70 dark:bg-slate-900/70 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-[#635BFF] text-[#635BFF] bg-white dark:bg-slate-800/80 shadow-xs"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#635BFF]" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  What is this examination?
                </h3>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                  {overview}
                </p>
              </div>

              {howItWorks && (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#635BFF] mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    How It Works
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {howItWorks}
                  </p>
                </div>
              )}

              {/* Highlights Quick Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Exam Mode</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {syllabusPattern.mode || "Offline / CBT"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Duration</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {syllabusPattern.durationMinutes ? `${syllabusPattern.durationMinutes} Minutes` : "Varies"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Total Marks</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {syllabusPattern.totalMarks ? `${syllabusPattern.totalMarks} Marks` : "Graded / Rank"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Marking</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    {syllabusPattern.negativeMarking ? "Negative Marking Applies" : "No Negative Marking"}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {recommendationTags && recommendationTags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 mb-2">Focus Areas & Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendationTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BENEFITS & PERKS */}
          {activeTab === "benefits" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Financial Spotlight Card */}
              {benefits.monetaryAmountPerYear ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <DollarSign className="w-4 h-4" />
                    Direct Financial Aid
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {formatINR(benefits.monetaryAmountPerYear)}{" "}
                    <span className="text-sm font-semibold text-slate-500">per academic year</span>
                  </h3>

                  {totalCalculatedBenefit && (
                    <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      Total Grant over {benefits.durationYears} Years:{" "}
                      <span className="font-bold text-sm">{formatINR(totalCalculatedBenefit)}</span>
                    </div>
                  )}

                  {benefits.disbursementMethod && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      Disbursement: {benefits.disbursementMethod}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#635BFF]/10 via-indigo-500/5 to-transparent border border-[#635BFF]/20">
                  <div className="flex items-center gap-2 text-[#635BFF] font-bold text-xs uppercase tracking-wider mb-1">
                    <GraduationCap className="w-4 h-4" />
                    Admission & Career Gateway
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {benefits.title || "Full Tuition Waiver & Premier Admissions"}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {benefits.description}
                  </p>
                </div>
              )}

              {/* Comprehensive Perks List */}
              {benefits.perks && benefits.perks.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#635BFF]" />
                    Key Perks & Privileges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {benefits.perks.map((perk, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                          {perk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quotas & Reservations */}
              {benefits.reservationsAndQuotas && (
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                    Quotas & Reservations
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                    {benefits.reservationsAndQuotas}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ELIGIBILITY */}
          {activeTab === "eligibility" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Eligibility Summary
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  {eligibility.summary || "Open to eligible students meeting criteria below."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Classes Allowed */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">Eligible Class Levels</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {eligibility.classesAllowed?.map((cls) => (
                      <span
                        key={cls}
                        className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#635BFF]/10 text-[#635BFF]"
                      >
                        Class {cls}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stream Requirement */}
                {eligibility.streamRequired && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Subject Stream</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {eligibility.streamRequired.map((st) => (
                        <span
                          key={st}
                          className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 uppercase"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Min Percentage */}
                {eligibility.minPercentage !== undefined && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Minimum Qualifying Marks</span>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {eligibility.minPercentage}% marks
                      {eligibility.minPercentageReserved && (
                        <span className="text-xs font-normal text-slate-500 ml-1.5">
                          ({eligibility.minPercentageReserved}% for SC/ST/PwD)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Age Criteria */}
                {eligibility.ageLimit && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Age Limit / DOB Window</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {eligibility.ageLimit}
                    </p>
                  </div>
                )}

                {/* Income Cap */}
                {eligibility.incomeCap && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Family Income Cap</span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatINR(eligibility.incomeCap)} / year
                    </p>
                    <span className="text-[11px] text-slate-500">Applicable for parental annual income</span>
                  </div>
                )}

                {/* Domicile */}
                {eligibility.domicile && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-400">Domicile / Residence</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      {eligibility.domicile}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STEPS & TIMELINE */}
          {activeTab === "timeline" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Important Key Dates Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Application Window</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {importantDates.applicationDeadline || "TBA"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Admit Card Release</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {importantDates.admitCardDate || "TBA"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Exam Date</span>
                  <p className="text-xs sm:text-sm font-bold text-[#635BFF] mt-0.5">
                    {importantDates.examDate || "TBA"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">Results Announcement</span>
                  <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {importantDates.resultDate || "TBA"}
                  </p>
                </div>
              </div>

              {/* 5-Step Visual Stepper */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Step-by-Step Application Process
                </h4>
                <ExamTimelineStepper timeline={timeline} examTitle={title} />
              </div>
            </div>
          )}

          {/* TAB 5: SYLLABUS & PATTERN */}
          {activeTab === "syllabus" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Question Format</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {syllabusPattern.questionFormat || "Objective MCQs"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Marking Scheme</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {syllabusPattern.markingScheme || "Varies by subject"}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400">Medium of Paper</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {syllabusPattern.languagesAvailable?.join(", ") || "English / Regional"}
                  </p>
                </div>
              </div>

              {/* Subject Breakdowns */}
              {syllabusPattern.subjects && syllabusPattern.subjects.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    Subject Weightage & High-Yield Topics
                  </h4>
                  <div className="space-y-3">
                    {syllabusPattern.subjects.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {sub.name}
                          </h5>
                          <div className="flex items-center gap-2">
                            {sub.questionCount && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {sub.questionCount} Questions
                              </span>
                            )}
                            {sub.weightageMarks && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[#635BFF]">
                                {sub.weightageMarks} Marks
                              </span>
                            )}
                          </div>
                        </div>

                        {sub.keyTopics && sub.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sub.keyTopics.map((topic, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-xs px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: OFFICIAL PORTALS */}
          {activeTab === "links" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Official Government Notice
                </span>
                Gyan Verse provides factual, verified guidance for student empowerment. All official
                registrations and fees must be processed exclusively through designated government and
                conducting authority websites listed below. Beware of unauthorized intermediaries.
              </div>

              <div className="space-y-3">
                {officialLinks.map((link, lIdx) => (
                  <div
                    key={lIdx}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#635BFF]/50 transition-colors"
                  >
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        {link.title}
                      </h5>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                        {link.url}
                      </p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-[#635BFF] hover:bg-[#5249e0] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onToggleTrack && onToggleTrack(exam.id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border transition-all ${
              isTracked
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            {isTracked ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Tracked in My Exams</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-slate-500" />
                <span>Track / Bookmark Exam</span>
              </>
            )}
          </button>

          {officialLinks && officialLinks[0] && (
            <a
              href={officialLinks[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249e0] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Apply on Official Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
