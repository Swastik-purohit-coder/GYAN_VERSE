"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

/**
 * StudentAuthGuard
 * Offline-first authentication guard for student views.
 * Allows seamless offline navigation and viewing of cached data
 * without redirecting to an unreachable sign-in page.
 */
export default function StudentAuthGuard({ children }) {
  const [isOffline, setIsOffline] = useState(false);
  const [hasCachedSession, setHasCachedSession] = useState(false);

  useEffect(() => {
    const checkState = () => {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      const cachedRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
      setIsOffline(offline);
      setHasCachedSession(cachedRole === "student" || Boolean(localStorage.getItem("userName")));
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

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        {isOffline || hasCachedSession || isDev ? (
          children
        ) : (
          <RedirectToSignIn />
        )}
      </SignedOut>
    </>
  );
}
