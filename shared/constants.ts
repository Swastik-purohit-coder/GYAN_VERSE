/**
 * GyanVerse Shared Constants
 * Shared across Next.js Web (`frontend/`) and React Native Mobile (`mobileapp/`).
 */

export const SYNC_ACTIONS = {
  UPDATE_LESSON_PROGRESS: 'UPDATE_LESSON_PROGRESS',
  SUBMIT_QUIZ_RESPONSE: 'SUBMIT_QUIZ_RESPONSE',
  UPDATE_STREAK: 'UPDATE_STREAK',
  BOOKMARK_LESSON: 'BOOKMARK_LESSON',
  SAVE_NOTE: 'SAVE_NOTE',
} as const;

export type SyncActionType = typeof SYNC_ACTIONS[keyof typeof SYNC_ACTIONS];

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error',
  OFFLINE: 'offline',
} as const;

export type SyncStatusType = typeof SYNC_STATUS[keyof typeof SYNC_STATUS];

export const MEDIA_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

export const DOWNLOAD_STATUS = {
  NOT_DOWNLOADED: 'not_downloaded',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  DOWNLOADED: 'downloaded',
  FAILED: 'failed',
} as const;

export type DownloadStatusType = typeof DOWNLOAD_STATUS[keyof typeof DOWNLOAD_STATUS];

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const SUBJECT_CATEGORIES = [
  'Mathematics',
  'Science',
  'Computer Science',
  'English',
  'Social Studies',
  'General Knowledge',
] as const;
