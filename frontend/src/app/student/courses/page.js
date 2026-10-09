"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";

const CourseSelection = dynamic(() => import("@/student/components/course-selection"), { ssr: false });

export default function Page() {
  return (
    <StudentAuthGuard>
      <CourseSelection />
    </StudentAuthGuard>
  );
}
