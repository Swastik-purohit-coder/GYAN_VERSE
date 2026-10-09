"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Gauge,
} from "lucide-react";
import {
  subscribeToSyncStatus,
  getSyncState,
  isNetworkQualityDecent,
  SYNC_STATES,
} from "@/lib/syncEngine";
import { getPendingSyncCount } from "@/lib/offlineDb";

export default function SyncStatusBadge() {
  const [syncState, setSyncState] = useState(getSyncState());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState(null);
  const [syncDetails, setSyncDetails] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentlySynced, setRecentlySynced] = useState(false);

  useEffect(() => {
    // 1. Subscribe to SyncEngine state transitions
    const unsubscribe = subscribeToSyncStatus((newState, details) => {
      setSyncState(newState);
      setSyncDetails(details || {});
      if (details?.error) {
        setSyncError(details.error);
      } else if (newState === SYNC_STATES.SYNCED) {
        setSyncError(null);
        setRecentlySynced(true);
        setTimeout(() => setRecentlySynced(false), 4000);
      }

      // Update pending count
      getPendingSyncCount().then((count) => setPendingCount(count));
    });

    // Check count on mount
    getPendingSyncCount().then((count) => setPendingCount(count));

    return () => unsubscribe();
  }, []);

  const isOffline = syncState === SYNC_STATES.OFFLINE;
  const isSyncing = syncState === SYNC_STATES.SYNCING;
  const isPoorNetwork = syncDetails?.reason === "poor_network";
  const isPending = (syncState === SYNC_STATES.PENDING_SYNC || pendingCount > 0) && !isSyncing;
  const isError = syncState === SYNC_STATES.SYNC_ERROR;

  // Don't clutter UI when all synced and online unless user clicked to inspect or recently synced
  if (!isOffline && !isSyncing && !isPending && !isError && !recentlySynced && !isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-emerald-400 text-xs font-medium border border-slate-700/60 shadow-lg backdrop-blur-md cursor-pointer transition-all hover:scale-105"
        title="Application is online and synchronized"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="hidden sm:inline text-[11px] text-slate-300">Online</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm transition-all duration-300">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shadow-2xl backdrop-blur-md border cursor-pointer select-none transition-all ${
          isOffline
            ? "bg-amber-950/90 text-amber-200 border-amber-500/40"
            : isSyncing
            ? "bg-indigo-950/90 text-indigo-200 border-indigo-500/40"
            : isPoorNetwork
            ? "bg-amber-950/90 text-amber-200 border-amber-500/40"
            : isError
            ? "bg-rose-950/90 text-rose-200 border-rose-500/40"
            : isPending
            ? "bg-blue-950/90 text-blue-200 border-blue-500/40"
            : "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
        }`}
      >
        {/* Status Icon */}
        {isOffline ? (
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
        ) : isPoorNetwork ? (
          <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        ) : isPending ? (
          <Clock className="w-4 h-4 text-blue-400 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}

        {/* Status Message */}
        <div className="flex flex-col min-w-0 pr-1">
          <span className="font-semibold truncate">
            {isOffline
              ? "Offline Mode (IndexedDB Active)"
              : isSyncing
              ? "Auto-Syncing with Server..."
              : isPoorNetwork
              ? "Slow Connection (IndexedDB Cache Active)"
              : isError
              ? "Sync Retrying"
              : isPending
              ? `${pendingCount} Change${pendingCount > 1 ? "s" : ""} Saved in IndexedDB`
              : "IndexedDB Synced & Online"}
          </span>
          <span className="text-[10px] opacity-80 truncate">
            {isOffline
              ? "Local database active • Auto-syncs when online"
              : isSyncing
              ? "Syncing queued mutations in background"
              : isPoorNetwork
              ? "Serving from local DB • Will sync when network improves"
              : isError
              ? "Auto-retrying in background"
              : isPending
              ? "Safely stored locally • Auto-syncs when online"
              : "Full offline database ready"}
          </span>
        </div>
      </div>

      {/* Expanded Details Popover (Purely Informational, No User Action Needed) */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl text-xs space-y-2 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span className="font-semibold text-slate-300">Automatic Sync Status</span>
            <span className="text-[10px] font-mono text-slate-400">
              {typeof navigator !== "undefined" && navigator.onLine
                ? isNetworkQualityDecent()
                  ? "Network: Fast & Ready"
                  : "Network: High Latency / Slow"
                : "Network: Offline"}
            </span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <p>• Offline Lessons & Quizzes: <span className="text-emerald-400 font-semibold">Available</span></p>
            <p>• Pending Operations in Queue: <span className="font-bold text-white">{pendingCount}</span></p>
            <p className="text-[10px] text-slate-400 italic">
              • Synchronization is completely automatic in the background whenever a stable, decent network connection is detected.
            </p>
            {syncError && <p className="text-rose-400 text-[10px] truncate">• Notice: {syncError}</p>}
          </div>

          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-end">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-slate-200 text-[11px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

