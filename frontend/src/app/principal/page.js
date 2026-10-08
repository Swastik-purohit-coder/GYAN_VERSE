"use client";

import TeacherDashboardView from "@/teacher/components/TeacherDashboardView";

export default function PrincipalPage() {
  return <TeacherDashboardView defaultView="principal" forcedRole="principal" />;
}
