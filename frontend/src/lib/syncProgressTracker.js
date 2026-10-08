/**
 * Sync Progress Tracker
 * Manages progress for offline mutation sync (uploading pending offline progress/quizzes)
 * with strict timeouts to ensure loaders never get stuck on latency networks.
 */

class SyncProgressTracker {
  constructor() {
    this.listeners = new Set();
    this.state = {
      isSyncing: false,
      progress: 0,
      totalItems: 0,
      completedItems: 0,
      currentTask: "",
      statusText: "Ready",
      isComplete: false,
      error: null,
      visible: false,
    };
    this.autoHideTimer = null;
    this.watchdogTimer = null;
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (e) {
        console.warn("[SyncProgressTracker] Listener error:", e);
      }
    });
  }

  startSync(totalItems = 1, initialTask = "Synchronizing...") {
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);

    this.state = {
      isSyncing: true,
      progress: 15,
      totalItems: Math.max(1, totalItems),
      completedItems: 0,
      currentTask: initialTask,
      statusText: initialTask,
      isComplete: false,
      error: null,
      visible: true,
    };
    this.notify();

    // Safety Watchdog: Never stay open for more than 4.5 seconds on latency networks
    this.watchdogTimer = setTimeout(() => {
      if (this.state.isSyncing) {
        this.completeSync("Offline ready");
      }
    }, 4500);
  }

  updateProgress(completed, total, taskName = "") {
    const totalCount = Math.max(1, total || this.state.totalItems);
    const completedCount = Math.min(totalCount, Math.max(0, completed));
    const pct = Math.min(99, Math.round((completedCount / totalCount) * 85) + 15);

    this.state = {
      ...this.state,
      isSyncing: true,
      totalItems: totalCount,
      completedItems: completedCount,
      progress: pct,
      currentTask: taskName || this.state.currentTask,
      statusText: taskName ? `Syncing: ${taskName}` : `Synchronizing (${pct}%)...`,
      visible: true,
      isComplete: false,
    };
    this.notify();
  }

  completeSync(successMessage = "Synchronized!") {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);

    this.state = {
      ...this.state,
      isSyncing: false,
      progress: 100,
      completedItems: this.state.totalItems,
      currentTask: successMessage,
      statusText: successMessage,
      isComplete: true,
      visible: true,
    };
    this.notify();

    // Auto-hide quickly after completion
    this.autoHideTimer = setTimeout(() => {
      this.state.visible = false;
      this.notify();
    }, 2000);
  }

  failSync(errorMessage) {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.state = {
      ...this.state,
      isSyncing: false,
      error: errorMessage,
      statusText: `Sync Error`,
      visible: false, // Don't block screen on sync error
      isComplete: false,
    };
    this.notify();
  }

  dismiss() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    if (this.autoHideTimer) clearTimeout(this.autoHideTimer);
    this.state = {
      ...this.state,
      isSyncing: false,
      visible: false,
    };
    this.notify();
  }
}

export const syncProgressTracker = new SyncProgressTracker();
