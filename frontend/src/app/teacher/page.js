"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import TeacherDashboardView from "@/teacher/components/TeacherDashboardView";

export default function TeacherPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;
    const metadataRole = user?.unsafeMetadata?.role;
    if (metadataRole === "student") {
      router.replace("/student/dashboard");
      return;
    }
    fetchUserRole(user.id).then((doc) => {
      const r = typeof doc === "string" ? doc : doc?.role;
      if (r === "student") {
        router.replace("/student/dashboard");
      }
    });
  }, [user, isLoaded, router]);

  return <TeacherDashboardView defaultView="teacher" />;
}
