"use client";

import React, { useState, useEffect } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

function SafeRedirect({ fallback }) {
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      window.location.href = "/sign-in";
    }
  }, []);

  if (fallback) return fallback;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center p-6 space-y-4">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-2" />
        <p className="text-slate-400">Redirecting to sign in...</p>
        <a
          href="/sign-in"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium inline-block transition-colors"
        >
          Click here to Sign In
        </a>
      </div>
    </div>
  );
}

/**
 * OfflineSafeAuthGuard
 * 
 * Protects pages with Clerk authentication when online, while seamlessly
 * bypassing remote auth checks when offline to serve the full app from IndexedDB.
 * 
 * Prevents ChunkLoadError (such as signin_clerk.browser_*.js) when offline.
 */
export default function OfflineSafeAuthGuard({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    setMounted(true);
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // When offline, immediately serve authenticated children using local IndexedDB session
  if (isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return <>{children}</>;
  }

  // Educational Knowledge Base & Student Portal routes are handled by StudentAuthGuard
  const isStudentRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/student");
  if (isStudentRoute) {
    return <>{children}</>;
  }

  // Before hydration mounted, render children so SSR matches and offline users get instant content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <SafeRedirect fallback={fallback} />
      </SignedOut>
    </>
  );
}

