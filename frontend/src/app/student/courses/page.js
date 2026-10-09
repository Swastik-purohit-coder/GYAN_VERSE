"use client";
import dynamic from "next/dynamic";

const CourseSelection = dynamic(() => import("@/student/components/course-selection"), { ssr: false });

export default function Page() {
  return <CourseSelection />;
}
