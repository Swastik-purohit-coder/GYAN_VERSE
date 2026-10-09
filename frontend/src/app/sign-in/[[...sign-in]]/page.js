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

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      fallbackRedirectUrl="/"
    />
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInOfflineHandler />
    </Suspense>
  );
}


