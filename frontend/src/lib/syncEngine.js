import { db, getPendingSyncCount } from "./offlineDb.js";

export const SYNC_STATES = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  PENDING_SYNC: "PENDING_SYNC",
  SYNC_ERROR: "SYNC_ERROR",
  POOR_NETWORK: "POOR_NETWORK",
};

let currentSyncState = typeof navigator !== "undefined" && !navigator.onLine ? SYNC_STATES.OFFLINE : SYNC_STATES.ONLINE;
let isSyncing = false;
let listenersInitialized = false;
let syncSubscribers = new Set();
let lastSyncError = null;

/**
 * Checks if network is currently connected and has acceptable quality/speed for automatic syncing.
 * Avoids saturating slow-2g/2g networks or high-latency connections.
 * @returns {boolean}
 */
export function isNetworkQualityDecent() {
  if (typeof navigator === "undefined" || !navigator.onLine) return false;

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    // 1. Data saver preference enabled by user
    if (conn.saveData) return false;

    // 2. Slow cellular types (2G or slow 2G)
    if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") return false;

    // 3. High latency (Round Trip Time > 1500ms)
    if (typeof conn.rtt === "number" && conn.rtt > 1500) return false;

    // 4. Very low bandwidth (< 0.25 Mbps = 250 kbps)
    if (typeof conn.downlink === "number" && conn.downlink < 0.25) return false;
  }

  return true;
}

/**
 * Subscribes a callback to sync state changes.
 * @param {(state: string, details: object) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToSyncStatus(callback) {
  syncSubscribers.add(callback);
  callback(currentSyncState, { error: lastSyncError });
  return () => syncSubscribers.delete(callback);
}

function notifySubscribers(details = {}) {
  syncSubscribers.forEach((cb) => {
    try {
      cb(currentSyncState, { error: lastSyncError, ...details });
    } catch (e) {
      console.warn("Error in sync subscriber:", e);
    }
  });
}

export function getSyncState() {
  return currentSyncState;
}

export function setSyncState(newState, details = {}) {
  currentSyncState = newState;
  if (details.error !== undefined) lastSyncError = details.error;
  notifySubscribers(details);
}

/**
 * Automatically processes the offline syncQueue with backoff, deduplication & conflict resolution.
 * Only executes when network is online and has decent speed/latency.
 */
export async function processSyncQueue(options = {}) {
  const { force = false } = options;
  if (typeof window === "undefined") return { syncedCount: 0 };

  // Check if device is completely offline
  if (!navigator.onLine) {
    const pending = await getPendingSyncCount();
    setSyncState(pending > 0 ? SYNC_STATES.PENDING_SYNC : SYNC_STATES.OFFLINE);
    return { syncedCount: 0, offline: true };
  }

  // Check network quality (unless explicitly forced)
  if (!force && !isNetworkQualityDecent()) {
    const pending = await getPendingSyncCount();
    if (pending > 0) {
      setSyncState(SYNC_STATES.PENDING_SYNC, {
        reason: "poor_network",
        message: "Network speed is low. Auto-sync will resume when connection improves.",
      });
    }
    return { syncedCount: 0, poorNetwork: true };
  }

  if (isSyncing) return { syncedCount: 0, inProgress: true };

  try {
    isSyncing = true;
    setSyncState(SYNC_STATES.SYNCING);

    // 1. Fetch pending sync operations from IndexedDB (ordered by timestamp)
    const pendingItems = await db.syncQueue
      .where("status")
      .equals("pending")
      .limit(30)
      .toArray();

    if (!pendingItems || pendingItems.length === 0) {
      isSyncing = false;
      setSyncState(SYNC_STATES.SYNCED);
      return { syncedCount: 0 };
    }

    const payloadOperations = pendingItems.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      idempotentKey: item.idempotentKey,
      payload: item.payload,
      timestamp: item.timestamp,
      retryCount: item.retryCount || 0,
    }));

    // 2. Send batch payload to POST /api/sync
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations: payloadOperations }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown HTTP Error");
      throw new Error(`Sync HTTP error ${res.status}: ${errText.slice(0, 150)}`);
    }

    const data = await res.json();
    const processedIds = Array.isArray(data?.processedIds) ? data.processedIds : [];
    const failedIds = Array.isArray(data?.failedIds) ? data.failedIds : [];

    // 3. Process successfully synchronized records
    if (processedIds.length > 0) {
      for (const queueId of processedIds) {
        const queueItem = pendingItems.find((i) => i.id === queueId);
        if (queueItem) {
          // Update local entity syncStatus in IndexedDB
          if (queueItem.action === "UPDATE_LESSON_PROGRESS" && queueItem.entityId) {
            const localProg = await db.lessonProgress.get(queueItem.entityId);
            if (localProg) {
              await db.lessonProgress.update(queueItem.entityId, { syncStatus: "synced" });
            }
          } else if (queueItem.action === "SUBMIT_QUIZ_RESPONSE" && queueItem.payload?.attemptId) {
            await db.quizAttempts.update(queueItem.payload.attemptId, { syncStatus: "synced" });
          } else if (queueItem.action === "CREATE_DOUBT" && queueItem.entityId) {
            const localDoubt = await db.doubtSessions.get(queueItem.entityId);
            if (localDoubt) {
              await db.doubtSessions.update(queueItem.entityId, { syncStatus: "synced" });
            }
          } else if (queueItem.action === "ADD_DOUBT_MESSAGE" && queueItem.payload?.localMsgId) {
            await db.doubtMessages.update(queueItem.payload.localMsgId, { syncStatus: "synced" });
          } else if (queueItem.action === "SEND_GROUP_MESSAGE" && queueItem.payload?.localMsgId) {
            await db.groupMessages.update(queueItem.payload.localMsgId, { syncStatus: "synced" });
          }

          // Remove completed task from syncQueue
          await db.syncQueue.delete(queueId);
        }
      }
    }

    // 4. Increment retry counts on any failed items
    if (failedIds.length > 0) {
      for (const failedItem of failedIds) {
        const existing = await db.syncQueue.get(failedItem.id);
        if (existing) {
          const retries = (existing.retryCount || 0) + 1;
          if (retries >= 5) {
            // Mark as failed permanently if retried 5 times
            await db.syncQueue.update(failedItem.id, {
              status: "failed",
              retryCount: retries,
              lastAttempt: Date.now(),
              error: failedItem.error || "Max retry limit exceeded",
            });
          } else {
            await db.syncQueue.update(failedItem.id, {
              retryCount: retries,
              lastAttempt: Date.now(),
              error: failedItem.error || "Temporary sync failure",
            });
          }
        }
      }
    }

    // Check remaining pending count
    const remainingPending = await getPendingSyncCount();
    isSyncing = false;

    if (remainingPending > 0) {
      setSyncState(SYNC_STATES.PENDING_SYNC, { remainingCount: remainingPending });
    } else {
      setSyncState(SYNC_STATES.SYNCED, { syncedCount: processedIds.length });
    }

    return { syncedCount: processedIds.length, remainingPending };
  } catch (err) {
    console.warn("[SyncEngine] Background auto-sync error:", err.message);
    isSyncing = false;
    setSyncState(SYNC_STATES.SYNC_ERROR, { error: err.message });
    return { syncedCount: 0, error: err.message };
  }
}

/**
 * Initializes automatic sync triggers for app startup, online events, network quality changes, and visibility.
 * Does not require manual user triggers.
 */
export function initSyncEngine(onSyncComplete) {
  if (typeof window === "undefined") return;

  const tryAutoSync = () => {
    if (isNetworkQualityDecent() && !isSyncing) {
      getPendingSyncCount().then((count) => {
        if (count > 0) {
          processSyncQueue().then((res) => {
            if (res?.syncedCount > 0 && onSyncComplete) onSyncComplete(res);
          });
        }
      });
    }
  };

  // Attempt auto-sync on initial startup if network is good
  tryAutoSync();

  if (listenersInitialized) return;
  listenersInitialized = true;

  // 1. Trigger automatically when browser goes online and has decent speed
  window.addEventListener("online", () => {
    setSyncState(SYNC_STATES.ONLINE);
    // Slight delay to allow connection stability to establish
    setTimeout(tryAutoSync, 1000);
  });

  // 2. Trigger when browser goes offline
  window.addEventListener("offline", () => {
    setSyncState(SYNC_STATES.OFFLINE);
  });

  // 3. Listen to Network Information API changes (e.g., switches to Wi-Fi / 4G / lower latency)
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && conn.addEventListener) {
    conn.addEventListener("change", () => {
      if (isNetworkQualityDecent()) {
        tryAutoSync();
      }
    });
  }

  // 4. Trigger automatically when app returns to foreground (tab visible)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      tryAutoSync();
    }
  });

  // 5. Periodic automatic background sync check (every 30 seconds when online & decent speed)
  setInterval(() => {
    tryAutoSync();
  }, 30000);
}

