"use client";
import dynamic from "next/dynamic";

const LessonViewer = dynamic(() => import("@/student/components/lesson-viewer"), { ssr: false });

export default function Page() {
  return <LessonViewer />;
}
