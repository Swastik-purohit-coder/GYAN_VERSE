"use client";

import { Suspense } from "react";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import StudentSkillCoursesSection from "@/student/components/StudentSkillCoursesSection";
import { SubHeader } from "@/student/components/sub-header";
import { Card, CardContent } from "@/student/components/ui/card";
import { useUser } from "@clerk/nextjs";

function SkillsPageContent() {
  const { user } = useUser();
  const studentClass = user?.unsafeMetadata?.class || "Class 8";

  return (
    <div className="space-y-6">
      <SubHeader showProgress showStreak user={{ streak: 7, xp: 620, xpToNextLevel: 1000, level: 10 }} />
      <Card className="border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-2xl backdrop-blur-sm transition-colors">
        <CardContent className="p-6">
          <StudentSkillCoursesSection initialClass={studentClass} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function StudentSkillsPage() {
  return (
    <StudentAuthGuard>
      <Suspense fallback={
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Loading Skill Tracks...</p>
        </div>
      }>
        <SkillsPageContent />
      </Suspense>
    </StudentAuthGuard>
  );
}
