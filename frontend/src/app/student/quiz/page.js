"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import dynamic from "next/dynamic";

const QuizComponent = dynamic(() => import("@/student/components/quiz-component"), { ssr: false });

export default function Page() {
  return (
    <ErrorBoundary
      fallbackTitle="Offline Quizzes"
      fallbackMessage="Unable to load quiz session online. Cached offline quizzes remain accessible."
    >
      <StudentAuthGuard>
        <QuizComponent />
      </StudentAuthGuard>
    </ErrorBoundary>
  );
}
