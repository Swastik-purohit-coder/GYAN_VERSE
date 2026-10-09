"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";

const QuizComponent = dynamic(() => import("@/student/components/quiz-component"), { ssr: false });

export default function Page() {
  return (
    <StudentAuthGuard>
      <QuizComponent />
    </StudentAuthGuard>
  );
}
