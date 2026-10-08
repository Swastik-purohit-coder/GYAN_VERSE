"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Cloud,
  Wifi,
  Sparkles,
} from "lucide-react";
import { syncProgressTracker } from "@/lib/syncProgressTracker";

export default function SyncProgressLoader() {
  const [syncState, setSyncState] = useState(syncProgressTracker.getState());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const unsubscribe = syncProgressTracker.subscribe((state) => {
      setSyncState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  if (!syncState.visible) {
    return null;
  }

  const { isSyncing, progress, currentTask, isComplete, error, totalItems, completedItems } = syncState;

  return (
    <>
      {/* 1. Ultra-Slim Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-slate-800/40 pointer-events-none">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            error
              ? "bg-rose-500"
              : isComplete
              ? "bg-emerald-400"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Floating Sync Progress Pill / Toast */}
      <div className="fixed top-3 right-3 sm:right-6 z-[9998] max-w-sm w-[92vw] sm:w-auto transition-all duration-300 animate-in fade-in slide-in-from-top-3">
        <div
          className={`rounded-2xl p-3 shadow-2xl backdrop-blur-xl border text-white transition-all ${
            error
              ? "bg-slate-900/95 border-rose-500/40 text-rose-200"
              : isComplete
              ? "bg-slate-900/95 border-emerald-500/40 text-emerald-200"
              : "bg-slate-900/95 border-indigo-500/40 text-slate-200"
          }`}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  error
                    ? "bg-rose-500/20 text-rose-400"
                    : isComplete
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-indigo-500/20 text-indigo-400"
                }`}
              >
                {error ? (
                  <AlertCircle className="w-4 h-4" />
                ) : isComplete ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">
                    {error
                      ? "Sync Error"
                      : isComplete
                      ? "Synchronized"
                      : "Syncing Curriculum"}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      error
                        ? "bg-rose-500/20 text-rose-300"
                        : isComplete
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-indigo-500/20 text-indigo-300"
                    }`}
                  >
                    {progress}%
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                    {currentTask || (isComplete ? "All lessons ready offline" : "Caching assets...")}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => syncProgressTracker.dismiss()}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded Progress Track & Info */}
          {!isMinimized && (
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-out ${
                    error
                      ? "bg-rose-500"
                      : isComplete
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {totalItems > 0 ? `${completedItems} of ${totalItems} items` : "Optimizing..."}
                </span>
                <span className="text-indigo-300 font-medium">
                  {isComplete ? "Offline Ready" : "Fast Background Sync"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
