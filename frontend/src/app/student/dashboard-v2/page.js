"use client";

import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import DashboardV2 from "@/student/views/DashboardV2";

export default function Page() {
  return (
    <StudentAuthGuard>
      <DashboardV2 />
    </StudentAuthGuard>
  );
}
