"use client";

import React from "react";
import {
  FileText,
  UserCheck,
  CreditCard,
  PenTool,
  Award,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const getStepIcon = (actionType) => {
  switch (actionType) {
    case "document_prep":
      return FileText;
    case "registration":
      return UserCheck;
    case "admit_card":
      return CreditCard;
    case "exam":
      return PenTool;
    case "result":
    case "counseling":
      return Award;
    default:
      return Calendar;
  }
};

const getStepBadgeStyle = (actionType) => {
  switch (actionType) {
    case "document_prep":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    case "registration":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "admit_card":
      return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    case "exam":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "result":
    case "counseling":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  }
};

export default function ExamTimelineStepper({ timeline = [], examTitle = "" }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm">
        Timeline information currently being updated by conducting authorities.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative border-l-2 border-[#635BFF]/30 ml-4 md:ml-6 space-y-8 pb-4">
        {timeline.map((step, idx) => {
          const StepIcon = getStepIcon(step.actionType);
          const badgeStyle = getStepBadgeStyle(step.actionType);
          const isLast = idx === timeline.length - 1;

          return (
            <div key={step.stepNumber || idx} className="relative pl-6 md:pl-8 group">
              {/* Node Icon on the vertical line */}
              <div className="absolute -left-[17px] top-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-[#635BFF] text-[#635BFF] shadow-sm group-hover:scale-110 group-hover:bg-[#635BFF] group-hover:text-white transition-all">
                <StepIcon className="w-4 h-4" />
              </div>

              {/* Step Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-xs hover:border-[#635BFF]/40 transition-colors">
                {/* Header row: Step #, Title, and Time Window */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#635BFF]/10 text-[#635BFF]">
                      Step {step.stepNumber || idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                  </div>
                  {step.timeWindow && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeStyle} flex items-center gap-1.5`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {step.timeWindow}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {step.description}
                </p>

                {/* Document Checklist if available */}
                {step.documentChecklist && step.documentChecklist.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Mandatory Documents Required:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {step.documentChecklist.map((doc, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official URL link if available */}
                {step.officialUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <a
                      href={step.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#635BFF] hover:text-[#4F46E5] hover:underline"
                    >
                      <span>Visit Application Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
