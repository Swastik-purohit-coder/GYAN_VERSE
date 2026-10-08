/**
 * GyanVerse Shared TypeScript Types & Models
 * Shared across Next.js Web (`frontend/`) and React Native Mobile (`mobileapp/`).
 */

import { SyncActionType, SyncStatusType, MediaType, DownloadStatusType, UserRole } from './constants';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  streakCount: number;
  lastActiveDate: string;
  xpPoints: number;
  level: number;
}

export interface Subject {
  id: string;
  title: string;
  description: string;
  iconName: string;
  colorCode: string;
  moduleCount: number;
  lessonCount: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  subjectTitle?: string;
  title: string;
  description: string;
  durationMinutes: number;
  durationSeconds?: number;
  mediaType: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  order: number;
  isLocked?: boolean;
  isCompleted?: boolean;
  contentMarkdown?: string;
  fileSizeBytes?: number;
  localMediaUri?: string;
}

export interface Course {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  lessons: Lesson[];
  progressPercent: number;
}

export interface QuizQuestion {
  id: string;
  lessonId?: string;
  subjectId?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface QuizSubmission {
  id?: string;
  quizId: string;
  lessonId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  selectedAnswers: Record<number, number>;
  timeSpentSeconds: number;
  submittedAt: string;
  synced: boolean;
}

export interface UserProgressRecord {
  lessonId: string;
  userId: string;
  isCompleted: boolean;
  progressSeconds: number;
  totalDurationSeconds: number;
  lastWatchedAt: string;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  action: SyncActionType;
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
}

export interface OfflineMediaItem {
  lessonId: string;
  title: string;
  mediaType: MediaType;
  localFilePath: string;
  remoteUrl: string;
  fileSizeBytes: number;
  downloadStatus: DownloadStatusType;
  progressPercent: number;
  downloadedAt?: string;
}

export interface StreakRecord {
  date: string;
  count: number;
  completedTasks: string[];
  synced: boolean;
}
