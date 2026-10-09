"use client";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";

const GlobalSearch = dynamic(() => import("@/student/components/search"), { ssr: false });

export default function Page() {
  return (
    <StudentAuthGuard>
      <GlobalSearch />
    </StudentAuthGuard>
  );
}
