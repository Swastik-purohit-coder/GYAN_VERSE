"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import OfflineSafeAuthGuard from "@/components/OfflineSafeAuthGuard";
import { fetchUserRole } from "@/lib/users";
import TeacherSidebar from "@/teacher/components/TeacherSidebar";
import { Menu } from "lucide-react";
import { Badge } from "@/teacher/components/ui/badge";

export default function TeacherLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // When offline, check local role from IndexedDB/localStorage
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
      if (!localRole || ["teacher", "admin", "principal", "higher_body"].includes(localRole)) {
        setAuthorized(true);
        return;
      }
    }

    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setAuthorized(true);
      }
      return;
    }

    // Check immediate Clerk unsafeMetadata for instant authorization
    const metaRole = user?.unsafeMetadata?.role;
    if (["teacher", "admin", "principal", "higher_body"].includes(metaRole)) {
      setAuthorized(true);
      return;
    }

    let active = true;
    fetchUserRole(user.id)
      .then((data) => {
        if (!active) return;
        const role = typeof data === "string" ? data : data?.role;
        if (role === "student") {
          router.replace("/student");
          return;
        }
        if (role === "unassigned") {
          router.replace("/role-select");
          return;
        }
        if (["teacher", "admin", "principal", "higher_body"].includes(role)) {
          setAuthorized(true);
        } else {
          router.replace("/student");
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthorized(true);
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, user?.unsafeMetadata?.role, router]);

  return (
    <OfflineSafeAuthGuard>
      {authorized ? (
        <div className="flex h-screen bg-[#FAF8F5] text-slate-900 overflow-hidden font-sans">
          {/* Mobile Overlay */}
          {mobileOpen && (
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* Desktop & Mobile Sidebar Drawer */}
          <TeacherSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Top Navigation Bar */}
            <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Open navigation sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                    Gyanaratna
                  </span>
                  <span className="text-slate-300 hidden sm:inline">•</span>
                  <h1 className="text-sm font-extrabold text-slate-800 tracking-tight">
                    Faculty Workspace
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-indigo-50 text-[#635BFF] border-indigo-200/60 font-semibold text-xs px-2.5 py-0.5">
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
      ) : (
        <div className="min-h-screen w-full bg-[#FAF8F5] bg-grid-cream flex items-center justify-center">
          <div className="text-slate-600 font-medium text-sm animate-pulse">
            Verifying faculty authorization...
          </div>
        </div>
      )}
    </OfflineSafeAuthGuard>
  );
}
