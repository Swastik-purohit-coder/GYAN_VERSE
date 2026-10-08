"use client";

import { useEffect } from "react";
import { isNetworkQualityDecent } from "@/lib/syncEngine";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handle chunk load errors gracefully
    window.addEventListener("error", (event) => {
      if (event.message && event.message.includes("Loading chunk")) {
        console.warn("Chunk load error detected, attempting recovery");
        event.preventDefault();
      }
    });

    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes("Loading chunk")) {
        console.warn("Dynamic import error:", event.reason);
        event.preventDefault();
      }
    });

    // Essential core routes to warm-cache silently in background without blocking network
    const warmList = [
      "/",
      "/student",
      "/student/lessons",
      "/student/courses",
      "/student/quiz",
      "/student/games",
      "/manifest.json",
      "/logo.webp",
      "/fonts/KFOmCnqEu92Fr1Mu4mxK.woff2",
    ];

    if ("serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Defer silent background warming so user's dashboard is completely instant
            setTimeout(async () => {
              // Only warm cache if network is available and has decent speed
              if (isNetworkQualityDecent() && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                  type: "warm-cache",
                  urls: warmList,
                });
              }
            }, 4000);
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

