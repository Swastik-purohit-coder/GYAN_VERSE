"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

function SafeRedirect({ fallback }) {
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      window.location.href = "/sign-in";
    }
  }, []);

  if (fallback) return fallback;

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-slate-400">
      <div className="text-center p-6 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">Redirecting to sign in...</p>
      </div>
    </div>
  );
}

/**
 * StudentAuthGuard
 * Offline-first authentication guard for student views.
 * Allows seamless offline navigation and viewing of cached data
 * without redirecting to an unreachable sign-in page or triggering
 * DOM removeChild exceptions when Clerk's network requests fail.
 */
export default function StudentAuthGuard({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [hasCachedSession, setHasCachedSession] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkState = () => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      const cachedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
      setIsOffline(offline);
      setHasCachedSession(
        cachedRole === "student" ||
        Boolean(localStorage.getItem("userName")) ||
        Boolean(localStorage.getItem("studentClass"))
      );
    };

    checkState();
    window.addEventListener("online", checkState);
    window.addEventListener("offline", checkState);
    return () => {
      window.removeEventListener("online", checkState);
      window.removeEventListener("offline", checkState);
    };
  }, []);

  const isDev = process.env.NODE_ENV !== "production";

  // 1. During SSR or initial hydration tick, or when offline:
  // Render children directly. This guarantees zero hydration mismatch and
  // completely prevents Clerk from attempting network calls or touching the DOM while offline.
  if (!mounted || isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return <>{children}</>;
  }

  // 2. If student has a local cached session, permit access immediately.
  if (hasCachedSession || isDev) {
    return <>{children}</>;
  }

  // 3. Online mode with no cached session: securely authenticate with Clerk
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <SafeRedirect fallback={fallback} />
      </SignedOut>
    </>
  );
}
