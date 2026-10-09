"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import TeacherDashboardView from "@/teacher/components/TeacherDashboardView";

export default function PrincipalPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) return;

    // Check immediate Clerk unsafeMetadata, localStorage, and cookie first
    const metaRole = user?.unsafeMetadata?.role;
    const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    let cookieRole = null;
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)gyan_user_role=([^;]+)/);
      if (match) cookieRole = decodeURIComponent(match[1]);
    }
    const immediateRole =
      (metaRole && metaRole !== "unassigned" ? metaRole : null) ||
      (localRole && localRole !== "unassigned" ? localRole : null) ||
      (cookieRole && cookieRole !== "unassigned" ? cookieRole : null);

    if (["principal", "admin", "higher_body"].includes(immediateRole)) {
      setAuthorized(true);
      return;
    }
    if (immediateRole === "student") {
      router.replace("/student/dashboard");
      return;
    }
    if (immediateRole === "teacher") {
      router.replace("/teacher/dashboard");
      return;
    }

    let active = true;
    fetchUserRole(user.id)
      .then((data) => {
        if (!active) return;
        const role = typeof data === "string" ? data : data?.role;
        const finalRole = (role && role !== "unassigned") ? role : immediateRole;
        if (["principal", "admin", "higher_body"].includes(finalRole)) {
          setAuthorized(true);
        } else if (finalRole === "teacher") {
          router.replace("/teacher/dashboard");
        } else if (finalRole === "student") {
          router.replace("/student/dashboard");
        } else {
          router.replace("/role-select");
        }
      })
      .catch(() => {
        if (!active) return;
        if (["principal", "admin", "higher_body"].includes(immediateRole)) {
          setAuthorized(true);
        } else {
          router.replace("/student/dashboard");
        }
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, user?.unsafeMetadata?.role, router]);

  return (
    <>
      <SignedIn>
        {authorized ? (
          <TeacherDashboardView defaultView="principal" />
        ) : (
          <div className="min-h-screen w-full bg-[#FAF8F5] bg-grid-cream flex items-center justify-center">
            <div className="text-slate-600 font-medium text-sm animate-pulse">
              Verifying institutional executive authorization...
            </div>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
