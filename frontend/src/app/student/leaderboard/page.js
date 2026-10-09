"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";

const Leaderboard = dynamic(() => import("@/student/components/leaderboard"), { ssr: false });

export default function Page() {
  return (
    <StudentAuthGuard>
      <Leaderboard />
    </StudentAuthGuard>
  );
}
