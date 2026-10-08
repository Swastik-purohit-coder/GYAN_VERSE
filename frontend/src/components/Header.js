"use client";
import headerStyles from './Header.module.css';

import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import ClientOnly from './ClientOnly';
import Link from "next/link";
import { openSignIn } from '@/lib/openSignIn';
import { usePathname } from "next/navigation";
<<<<<<< Updated upstream
=======
import { fetchUserRole } from "@/lib/users";
// LanguageToggle replaced by Google Translate widget in PreHeader
// import LanguageToggle from "@/components/LanguageToggle";
>>>>>>> Stashed changes
import OnlineBadge from "@/components/OnlineBadge";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
<<<<<<< Updated upstream
=======
import { useState, useEffect } from "react";
>>>>>>> Stashed changes
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
  }, [isSignedIn, user?.id]);

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
  const headerRightPad = isStudentShell ? "pr-14 sm:pr-4" : "";

  return (
    <header
      className={`${headerRightPad} w-full max-w-7xl mx-auto px-4 py-3 flex justify-between items-center relative z-50`}
      style={isLight ? { backgroundColor: "#ffffff", color: "#000000" } : { backgroundColor: "#000000", color: "#f8fafc" }}
    >
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.webp"
            alt="Gyanaratna Logo"
            className="h-8 w-8 object-contain rounded-md"
          />
          <h1 className="text-xl font-bold tracking-tight">GYANARATNA</h1>
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
          <ClientOnly fallback={<div className="flex items-center gap-3 flex-shrink-0"><OnlineBadge /><ThemeToggle /><PreHeader /></div>}>
            <div className="flex items-center gap-3 flex-shrink-0">
              <OnlineBadge />
              <ThemeToggle />
              <PreHeader />
              <SignedIn>
                <div className={headerStyles.profilePicture}>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
              <SignedOut>
                <button onClick={(e) => { e.preventDefault(); openSignIn('/sign-in'); }} className="text-sm text-blue-600 hover:underline">Sign in</button>
              </SignedOut>
            </div>
          </ClientOnly>
        ) : (
          <ClientOnly fallback={<div className="flex items-center gap-4 flex-shrink-0"><ThemeToggle /></div>}>
            <div className="flex items-center gap-4 flex-shrink-0">
<<<<<<< Updated upstream
              <ul className="hidden md:flex space-x-4 items-center">
                <li>
                  <Link href="/">Home</Link>
                </li>
                {!isRoleSelect && (
                  <>
                    <li>
                      <Link href="/student">Student</Link>
                    </li>
                    <li>
                      <Link href="/teacher">Teacher</Link>
                    </li>
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
                <button onClick={(e) => { e.preventDefault(); openSignIn('/sign-in'); }} className="text-sm text-blue-600 hover:underline">Sign in</button>
              </SignedOut>
            </div>
          </ClientOnly>
=======
            <ul className="hidden md:flex space-x-4 items-center">
              <li>
                <Link href="/">Home</Link>
              </li>
              {!isRoleSelect && (
                <>
                  {role === "student" && (
                    <li>
                      <Link href="/student/dashboard">Dashboard</Link>
                    </li>
                  )}
                  {(role === "teacher" || role === "admin") && (
                    <li>
                      <Link href="/teacher/dashboard">Dashboard</Link>
                    </li>
                  )}
                  {!role && (
                    <>
                      <li>
                        <Link href="/student/dashboard">Student</Link>
                      </li>
                      <li>
                        <Link href="/teacher/dashboard">Teacher</Link>
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
              <button onClick={(e) => { e.preventDefault(); openSignIn('/sign-in'); }} className="text-sm text-blue-600 hover:underline">Sign in</button>
            </SignedOut>
          </div>
        </ClientOnly>
>>>>>>> Stashed changes
        )}
      </nav>
    </header>
  );
}
