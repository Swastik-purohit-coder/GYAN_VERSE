"use client";
import dynamic from "next/dynamic";

const QuizComponent = dynamic(() => import("@/student/components/quiz-component"), { ssr: false });

export default function Page() {
  return <QuizComponent />;
}
