"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

function SignInOfflineHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  useEffect(() => {
    // Set offline cookie so server middleware lets subsequent offline requests through
    try {
      if (typeof document !== "undefined") {
        document.cookie = "gyan_offline=true; path=/; max-age=86400; SameSite=Lax";
      }
    } catch (e) {}

    if (isOffline) {
      // Extract target URL from redirect_url param, or fallback to student dashboard
      const redirectParam = searchParams.get("redirect_url");
      let target = "/student/dashboard";

      if (redirectParam) {
        try {
          const parsed = new URL(redirectParam, window.location.origin);
          if (parsed.pathname && !parsed.pathname.startsWith("/sign-in")) {
            target = parsed.pathname + parsed.search;
          }
        } catch (e) {
          if (redirectParam.startsWith("/") && !redirectParam.startsWith("/sign-in")) {
            target = redirectParam;
          }
        }
      }

      // Seamlessly navigate to target page without showing any pop-up
      router.replace(target);
    }
  }, [isOffline, router, searchParams]);

  // When offline, show no popup - seamless transition to normal website usage
  if (isOffline) {
    return null;
  }

  const isDeleted = searchParams.get("account_deleted") === "true";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {isDeleted && (
        <div className="w-full max-w-md p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div>
            <p className="font-semibold text-xs sm:text-sm">Account Permanently Deleted</p>
            <p className="mt-0.5 text-xs opacity-90">
              Your student account, database records, offline cache storage, and device data have been completely wiped.
            </p>
          </div>
        </div>
      )}
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInOfflineHandler />
    </Suspense>
  );
}


