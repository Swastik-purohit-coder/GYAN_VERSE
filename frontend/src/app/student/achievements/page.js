"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";

const Achievements = dynamic(() => import("@/student/components/achievements"), { ssr: false });

export default function Page() {
  return (
    <StudentAuthGuard>
      <Achievements />
    </StudentAuthGuard>
  );
}
