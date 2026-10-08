/**
 * GyanVerse Native Offline Sync Engine
 * Uses NetInfo for network quality gating, SQLite for idempotent queueing,
 * and automatic synchronization with the Next.js /api/sync endpoint.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import {
  getPendingSyncCount,
  getPendingSyncQueue,
  markSyncQueueItemSuccess,
  markSyncQueueItemFailed,
} from '../storage/offlineDatabase';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../services/apiClient';
import { SYNC_STATUS } from '../../../../shared/constants';

let isSyncing = false;
let listenersInitialized = false;

/**
 * Checks if current network connection has decent speed and stability.
 */
export function isNetworkQualityDecent(state: NetInfoState): boolean {
  if (!state.isConnected || !state.isInternetReachable) return false;

  // If cellular, check details
  if (state.type === 'cellular') {
    const details = state.details;
    if (details && 'cellularGeneration' in details) {
      if (details.cellularGeneration === '2g') {
        return false;
      }
    }
  }

  return true;
}

/**
 * Processes pending sync queue items in batch with idempotent backend API.
 */
export async function processSyncQueue(options: { force?: boolean } = {}): Promise<{
  syncedCount: number;
  remainingPending: number;
}> {
  if (isSyncing) {
    return { syncedCount: 0, remainingPending: await getPendingSyncCount() };
  }

  const netState = await NetInfo.fetch();

  if (!netState.isConnected) {
    const pending = await getPendingSyncCount();
    useAppStore.getState().setSyncStatus(SYNC_STATUS.OFFLINE, pending);
    return { syncedCount: 0, remainingPending: pending };
  }

  if (!options.force && !isNetworkQualityDecent(netState)) {
    const pending = await getPendingSyncCount();
    useAppStore.getState().setSyncStatus(SYNC_STATUS.IDLE, pending);
    return { syncedCount: 0, remainingPending: pending };
  }

  try {
    isSyncing = true;
    useAppStore.getState().setSyncStatus(SYNC_STATUS.SYNCING);

    const pendingItems = await getPendingSyncQueue(30);

    if (pendingItems.length === 0) {
      isSyncing = false;
      useAppStore.getState().setSyncStatus(SYNC_STATUS.SYNCED, 0);
      return { syncedCount: 0, remainingPending: 0 };
    }

    const payloadOperations = pendingItems.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      idempotentKey: item.idempotentKey,
      payload: item.payload,
      timestamp: item.timestamp,
      retryCount: item.retryCount,
    }));

    // Post to Next.js API
    const response = await apiClient.syncBatch(payloadOperations);

    // Mark processed items
    for (const item of pendingItems) {
      const attemptId = item.payload?.attemptId;
      await markSyncQueueItemSuccess(item.id, item.action, item.entityId, attemptId);
    }

    const remaining = await getPendingSyncCount();
    isSyncing = false;

    if (remaining > 0) {
      useAppStore.getState().setSyncStatus(SYNC_STATUS.IDLE, remaining);
    } else {
      useAppStore.getState().setSyncStatus(SYNC_STATUS.SYNCED, 0);
    }

    return { syncedCount: pendingItems.length, remainingPending: remaining };
  } catch (error: any) {
    console.warn('[SyncEngine] Background auto-sync failed:', error?.message);
    isSyncing = false;
    const remaining = await getPendingSyncCount();
    useAppStore.getState().setSyncStatus(SYNC_STATUS.ERROR, remaining);
    return { syncedCount: 0, remainingPending: remaining };
  }
}

/**
 * Initializes automatic background listeners for network status and app foregrounding.
 */
export function initNativeSyncEngine(): () => void {
  if (listenersInitialized) return () => {};
  listenersInitialized = true;

  const trySync = async (state?: NetInfoState) => {
    const current = state || (await NetInfo.fetch());
    const isOffline = !current.isConnected;
    useAppStore.getState().setNetworkStatus(isOffline);

    if (isNetworkQualityDecent(current) && !isSyncing) {
      const count = await getPendingSyncCount();
      if (count > 0) {
        await processSyncQueue();
      }
    }
  };

  // Initial check
  trySync();

  // 1. Subscribe to NetInfo network changes
  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    trySync(state);
  });

  // 2. Subscribe to AppState (when app returns to foreground)
  const appStateSubscription = AppState.addEventListener(
    'change',
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        trySync();
      }
    }
  );

  // 3. Periodic timer check (every 30s)
  const intervalId = setInterval(() => {
    trySync();
  }, 30000);

  return () => {
    unsubscribeNetInfo();
    appStateSubscription.remove();
    clearInterval(intervalId);
    listenersInitialized = false;
  };
}
