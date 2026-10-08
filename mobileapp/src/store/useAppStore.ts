import { create } from 'zustand';
import { UserProfile, UserRole, SyncStatusType } from '../../../shared/types';
import { USER_ROLES, SYNC_STATUS } from '../../../shared/constants';

interface AppState {
  // Authentication & Profile
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setRole: (role: UserRole) => void;

  // Network & Offline Status
  isOffline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  syncStatus: SyncStatusType;
  setNetworkStatus: (isOffline: boolean) => void;
  setSyncStatus: (status: SyncStatusType, pendingCount?: number) => void;

  // App Settings
  lowDataMode: boolean;
  setLowDataMode: (enabled: boolean) => void;

  // Active Media Downloads Tracking
  downloadingLessons: Record<string, number>; // lessonId -> percentage
  setDownloadProgress: (lessonId: string, progressPercent: number) => void;
  removeDownloadProgress: (lessonId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'student-demo-1',
    email: 'student@gyanverse.edu',
    fullName: 'Arjun Sharma',
    role: USER_ROLES.STUDENT,
    streakCount: 5,
    lastActiveDate: new Date().toISOString(),
    xpPoints: 340,
    level: 3,
  },
  role: USER_ROLES.STUDENT,
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRole: (role) => set({ role }),

  isOffline: false,
  isSyncing: false,
  pendingSyncCount: 0,
  syncStatus: SYNC_STATUS.IDLE,
  setNetworkStatus: (isOffline) => set({ isOffline }),
  setSyncStatus: (syncStatus, pendingSyncCount) =>
    set((state) => ({
      syncStatus,
      isSyncing: syncStatus === SYNC_STATUS.SYNCING,
      pendingSyncCount: pendingSyncCount !== undefined ? pendingSyncCount : state.pendingSyncCount,
    })),

  lowDataMode: false,
  setLowDataMode: (lowDataMode) => set({ lowDataMode }),

  downloadingLessons: {},
  setDownloadProgress: (lessonId, progressPercent) =>
    set((state) => ({
      downloadingLessons: {
        ...state.downloadingLessons,
        [lessonId]: progressPercent,
      },
    })),
  removeDownloadProgress: (lessonId) =>
    set((state) => {
      const updated = { ...state.downloadingLessons };
      delete updated[lessonId];
      return { downloadingLessons: updated };
    }),
}));
