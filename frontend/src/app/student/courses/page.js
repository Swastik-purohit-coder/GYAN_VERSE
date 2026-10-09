"use client";
import { Suspense } from "react";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";

const CourseSelection = dynamic(() => import("@/student/components/course-selection"), { ssr: false });

export default function Page() {
  return (
    <ErrorBoundary
      fallbackTitle="Offline Courses"
      fallbackMessage="Unable to load interactive course viewer online. Stored lessons and local resources remain available."
    >
      <StudentAuthGuard>
        <Suspense fallback={
          <div className="py-16 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading Courses...</p>
          </div>
        }>
          <CourseSelection />
        </Suspense>
      </StudentAuthGuard>
    </ErrorBoundary>
  );
}
