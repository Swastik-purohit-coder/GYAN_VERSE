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

    // Check immediate Clerk unsafeMetadata first
    const metaRole = user?.unsafeMetadata?.role;
    if (metaRole === "student") {
      router.replace("/student/dashboard");
      return;
    }
    if (metaRole === "teacher") {
      router.replace("/teacher/dashboard");
      return;
    }
    if (["principal", "admin", "higher_body"].includes(metaRole)) {
      setAuthorized(true);
      return;
    }

    let active = true;
    fetchUserRole(user.id)
      .then((data) => {
        if (!active) return;
        const role = typeof data === "string" ? data : data?.role;
        if (role === "student") {
          router.replace("/student/dashboard");
        } else if (role === "teacher") {
          router.replace("/teacher/dashboard");
        } else if (["principal", "admin", "higher_body"].includes(role)) {
          setAuthorized(true);
        } else {
          router.replace("/role-select");
        }
      })
      .catch(() => {
        if (!active) return;
        router.replace("/student/dashboard");
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
