"use client";
<<<<<<< Updated upstream

import { useState } from "react";
=======
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
>>>>>>> Stashed changes
import TeacherSidebar from "@/teacher/components/TeacherSidebar";
import { Menu, Building2, Bell, Sparkles } from "lucide-react";
import { Badge } from "@/teacher/components/ui/badge";

export default function TeacherLayout({ children }) {
<<<<<<< Updated upstream
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] bg-grid-cream text-stone-900 selection:bg-stone-200 flex">
      {/* Primary Sidebar (Desktop Sticky & Mobile Drawer) */}
      <TeacherSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header Bar (< lg screens) */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#0e1626] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">GYANARATNA</span>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-[10px]">
              Faculty Portal
            </Badge>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
=======
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) return;

    let active = true;
    fetchUserRole(user.id)
      .then((data) => {
        if (!active) return;
        const role = typeof data === "string" ? data : data?.role;
        if (role === "student") {
          router.replace("/student/dashboard");
          return;
        }
        if (role === "unassigned") {
          router.replace("/role-select");
          return;
        }
        if (role === "teacher" || role === "admin") {
          setAuthorized(true);
        } else {
          router.replace("/student/dashboard");
        }
      })
      .catch(() => {
        if (!active) return;
        router.replace("/student/dashboard");
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, router]);

  return (
    <>
      <SignedIn>
        {authorized ? (
          <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600">
            <div className="flex">
              <TeacherSidebar />
              <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
                <div className="max-w-6xl mx-auto">{children}</div>
              </main>
            </div>
          </div>
        ) : (
          <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 flex items-center justify-center">
            <div className="text-white font-medium text-sm animate-pulse">
              Verifying teacher authorization...
            </div>
          </div>
        )}
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
>>>>>>> Stashed changes
  );
}
