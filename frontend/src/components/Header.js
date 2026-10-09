"use client";
import headerStyles from './Header.module.css';

import { useState, useEffect } from "react";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import ClientOnly from './ClientOnly';
import Link from "next/link";
import { openSignIn } from '@/lib/openSignIn';
import { usePathname } from "next/navigation";
import { fetchUserRole } from "@/lib/users";
import OnlineBadge from "@/components/OnlineBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import PreHeader from "@/components/PreHeader";

export default function Header() {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setRole(null);
      return;
    }
    const metaRole = user?.unsafeMetadata?.role;
    if (metaRole) {
      setRole(metaRole);
      return;
    }
    let active = true;
    fetchUserRole(user.id)
      .then((doc) => {
        if (!active) return;
        const r = typeof doc === "string" ? doc : doc?.role;
        setRole(r);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isSignedIn, user?.id, user?.unsafeMetadata?.role]);

  const { theme } = useTheme();

  // Hide global root header on Teacher & Principal executive shells (they have dedicated full-height sidebar and navigation)
  const isTeacherOrPrincipal = pathname?.startsWith("/teacher") || pathname?.startsWith("/principal");
  if (isTeacherOrPrincipal) {
    return null;
  }

  const isLight = theme === "light";
  const isWelcome = pathname === "/";
  const isStudentShell = [
    "/student",
    "/subjects",
    "/achievements",
    "/progress",
    "/settings",
  ].some((p) => pathname?.startsWith(p));
  const isRoleSelect = pathname === "/role-select";
  const headerRightPad = pathname?.startsWith("/student") ? "pr-14 sm:pr-4" : "";

  return (
    <header
      className="sticky top-0 z-50 w-full border-b transition-colors bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 shadow-xs"
      style={isLight ? { backgroundColor: "rgba(255, 255, 255, 0.95)", color: "#0f172a" } : { backgroundColor: "rgba(15, 23, 42, 0.95)", color: "#f8fafc" }}
    >
      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center ${headerRightPad}`}>
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.webp"
              alt="Gyanaratna Logo"
              className="h-8 w-8 object-contain rounded-md transition-transform group-hover:scale-105"
            />
            <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isLight ? "text-[#0F172A]" : "text-[#F8FAFC]"}`}>GYANARATNA</h1>
          </Link>
        </div>
        <nav>
          {isWelcome ? (
            <div className="flex items-center gap-3">
              <ul className="flex space-x-4">
                <li>
                  <Link href="/contact">Contact</Link>
                </li>
              </ul>
              <ThemeToggle />
            </div>
          ) : isStudentShell ? (
            <ClientOnly fallback={<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">{!pathname?.startsWith("/student") && <OnlineBadge />}<ThemeToggle /><PreHeader /></div>}>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {!pathname?.startsWith("/student") && <OnlineBadge />}
                <ThemeToggle />
                <PreHeader />
                <SignedIn>
                  <div className={headerStyles.profilePicture}>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <button onClick={(e) => { e.preventDefault(); openSignIn('/sign-in'); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer">Sign in</button>
                </SignedOut>
              </div>
            </ClientOnly>
          ) : (
            <ClientOnly fallback={<div className="flex items-center gap-4 flex-shrink-0"><ThemeToggle /></div>}>
              <div className="flex items-center gap-4 flex-shrink-0">
                <ul className="hidden md:flex space-x-4 items-center">
                  <li>
                    <Link href="/">Home</Link>
                  </li>
                  {!isRoleSelect && (
                    <>
                      {role === "student" && (
                        <li>
                          <Link href="/student">Dashboard</Link>
                        </li>
                      )}
                      {["principal", "admin", "higher_body"].includes(role) && (
                        <li>
                          <Link href="/principal">Executive Portal</Link>
                        </li>
                      )}
                      {role === "teacher" && (
                        <li>
                          <Link href="/teacher">Teacher Dashboard</Link>
                        </li>
                      )}
                      {!role && (
                        <>
                          <li>
                            <Link href="/student">Student</Link>
                          </li>
                          <li>
                            <Link href="/teacher">Teacher</Link>
                          </li>
                        </>
                      )}
                    </>
                  )}
                  <li>
                    <Link href="/contact">Contact</Link>
                  </li>
                </ul>
                <ThemeToggle />
                <SignedIn>
                  <div className={headerStyles.profilePicture}>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
                <SignedOut>
                  <button onClick={(e) => { e.preventDefault(); openSignIn('/sign-in'); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer">Sign in</button>
                </SignedOut>
              </div>
            </ClientOnly>
          )}
        </nav>
      </div>
    </header>
  );
}
