"use client";

import { useEffect } from "react";
import { isNetworkQualityDecent, initSyncEngine } from "@/lib/syncEngine";
import { seedOfflineDatabaseIfEmpty } from "@/lib/offlineDb";
import { installClientFetchInterceptor } from "@/lib/clientFetchInterceptor";

// Immediate early installation in browser before any child components render
if (typeof window !== "undefined") {
  try {
    installClientFetchInterceptor();
  } catch (e) {}

  const updateOfflineCookie = () => {
    try {
      if (typeof document !== "undefined") {
        if (!navigator.onLine) {
          document.cookie = "gyan_offline=true; path=/; max-age=86400; SameSite=Lax";
        } else {
          document.cookie = "gyan_offline=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
    } catch (e) {}
  };
  updateOfflineCookie();
  window.addEventListener("online", updateOfflineCookie);
  window.addEventListener("offline", updateOfflineCookie);

  const isChunkOrClerkError = (errObj, messageStr) => {
    const msg = String(messageStr || errObj?.message || errObj || "").toLowerCase();
    const name = String(errObj?.name || "").toLowerCase();
    return (
      name.includes("chunkloaderror") ||
      msg.includes("loading chunk") ||
      msg.includes("clerk.accounts.dev") ||
      msg.includes("signin_clerk") ||
      msg.includes("failed to fetch dynamically imported module")
    );
  };

  const earlyOnError = (event) => {
    if (isChunkOrClerkError(event.error, event.message)) {
      console.warn("[Offline Recovery] Early suppressed ChunkLoadError:", event.message || event.error?.message);
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  };

  const earlyOnRejection = (event) => {
    if (isChunkOrClerkError(event.reason, event.reason?.message)) {
      console.warn("[Offline Recovery] Early suppressed rejection:", event.reason?.message || event.reason);
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  };

  window.addEventListener("error", earlyOnError, true);
  window.addEventListener("unhandledrejection", earlyOnRejection, true);
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Install client-side fetch interceptor for IndexedDB local database support
    try {
      installClientFetchInterceptor();
    } catch (e) {
      console.warn("Client fetch interceptor init error:", e);
    }

    // 2. Pre-seed IndexedDB database if empty so full web app works offline on fresh launch
    try {
      seedOfflineDatabaseIfEmpty();
    } catch (e) {
      console.warn("Offline database seeding error:", e);
    }

    // 3. Initialize background sync engine
    try {
      initSyncEngine();
    } catch (e) {
      console.warn("Sync engine init error:", e);
    }

    // Robust ChunkLoadError & Clerk script recovery when offline
    const isChunkOrClerkError = (errObj, messageStr) => {
      const msg = String(messageStr || errObj?.message || errObj || "").toLowerCase();
      const name = String(errObj?.name || "").toLowerCase();
      return (
        name.includes("chunkloaderror") ||
        msg.includes("loading chunk") ||
        msg.includes("clerk.accounts.dev") ||
        msg.includes("signin_clerk") ||
        msg.includes("failed to fetch dynamically imported module")
      );
    };

    const onErrorHandler = (event) => {
      if (isChunkOrClerkError(event.error, event.message)) {
        console.warn("[Offline Recovery] Suppressed ChunkLoadError:", event.message || event.error?.message);
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    const onUnhandledRejectionHandler = (event) => {
      if (isChunkOrClerkError(event.reason, event.reason?.message)) {
        console.warn("[Offline Recovery] Suppressed dynamic chunk rejection:", event.reason?.message || event.reason);
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener("error", onErrorHandler, true);
    window.addEventListener("unhandledrejection", onUnhandledRejectionHandler, true);

    // Essential core routes to warm-cache silently in background without blocking network
    const warmList = [
      "/",
      "/student",
      "/student/dashboard",
      "/student/exams",
      "/exams",
      "/student/lessons",
      "/student/courses",
      "/student/quiz",
      "/student/games",
      "/student/groups",
      "/teacher",
      "/manifest.json",
      "/logo.webp",
      "/fonts/KFOmCnqEu92Fr1Mu4mxK.woff2",
    ];

    if ("serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            const captureCurrentChunks = () => {
              try {
                if (navigator.serviceWorker.controller) {
                  const chunkUrls = Array.from(
                    document.querySelectorAll('script[src*="/_next/"], link[href*="/_next/"]')
                  )
                    .map((el) => el.src || el.href)
                    .filter(Boolean);

                  if (chunkUrls.length > 0) {
                    navigator.serviceWorker.controller.postMessage({
                      type: "cache-chunks",
                      urls: chunkUrls,
                    });
                  }
                }
              } catch (e) {}
            };

            // Capture current chunks immediately
            captureCurrentChunks();

            // Defer silent background warming so user's dashboard is completely instant
            setTimeout(async () => {
              // Only warm cache if network is available and has decent speed
              if (isNetworkQualityDecent() && navigator.serviceWorker.controller) {
                captureCurrentChunks();
                navigator.serviceWorker.controller.postMessage({
                  type: "warm-cache",
                  urls: warmList,
                });
              }
            }, 2000);
          })
          .catch((err) => console.warn("SW registration failed:", err));
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register);
      }
    }

    // Listen for SW queue flush messages
    const onMessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === "queue-flushed") {
        if (msg.flushed > 0) {
          console.log(`[SW] Synchronized ${msg.flushed} offline action(s)`);
        }
      }
    };

    navigator.serviceWorker?.addEventListener("message", onMessage);

    const onOnline = () => {
      if (isNetworkQualityDecent() && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "flush-queue" });
      }
    };
    window.addEventListener("online", onOnline);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMessage);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
