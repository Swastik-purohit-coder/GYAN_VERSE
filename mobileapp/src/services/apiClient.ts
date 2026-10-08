/**
 * GyanVerse Mobile API Client
 * Communicates directly with the Next.js backend API routes.
 */

import { Lesson, Course, Subject, QuizQuestion, QuizSubmission, StreakRecord } from '../../../shared/types';
import { SYNC_ACTIONS } from '../../../shared/constants';

// Configurable API Base URL (defaults to localhost:3000 for development)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.warn(`[ApiClient] Request failed for ${url}:`, error);
      throw error;
    }
  }

  // --- Lessons & Courses ---

  async getSubjects(): Promise<Subject[]> {
    return this.request<Subject[]>('/api/subjects');
  }

  async getCourses(): Promise<Course[]> {
    return this.request<Course[]>('/api/courses');
  }

  async getLessons(subjectId?: string): Promise<Lesson[]> {
    const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    return this.request<Lesson[]>(`/api/lessons${query}`);
  }

  async getLessonById(id: string): Promise<Lesson> {
    return this.request<Lesson>(`/api/lessons/${id}`);
  }

  // --- Media Streaming URLs ---

  getVideoStreamUrl(lessonId: string): string {
    return `${this.baseUrl}/api/media/video/${lessonId}`;
  }

  getAudioStreamUrl(lessonId: string): string {
    return `${this.baseUrl}/api/media/audio/${lessonId}`;
  }

  getThumbnailUrl(lessonId: string): string {
    return `${this.baseUrl}/api/media/thumbnail/${lessonId}`;
  }

  // --- Quizzes ---

  async getQuizQuestions(lessonId: string): Promise<QuizQuestion[]> {
    return this.request<QuizQuestion[]>(`/api/quizzes?lessonId=${encodeURIComponent(lessonId)}`);
  }

  async submitQuiz(submission: QuizSubmission): Promise<{ success: boolean; score: number; xpEarned: number }> {
    return this.request<{ success: boolean; score: number; xpEarned: number }>('/api/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  // --- Streaks ---

  async getStreak(): Promise<StreakRecord> {
    return this.request<StreakRecord>('/api/streak');
  }

  async updateStreak(activityType: string = 'lesson_completed'): Promise<StreakRecord> {
    return this.request<StreakRecord>('/api/streak', {
      method: 'POST',
      body: JSON.stringify({ activityType }),
    });
  }

  // --- Offline Batch Sync ---

  async syncBatch(operations: Array<{ action: string; payload: any; timestamp: number }>): Promise<{
    success: boolean;
    syncedCount: number;
    failedOperations: string[];
  }> {
    return this.request<{ success: boolean; syncedCount: number; failedOperations: string[] }>('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ operations }),
    });
  }

  // --- AI Study Buddy ---

  async askStudyBuddy(prompt: string, lessonContext?: string): Promise<{ reply: string }> {
    return this.request<{ reply: string }>('/api/ai/study-buddy', {
      method: 'POST',
      body: JSON.stringify({ prompt, context: lessonContext }),
    });
  }
}

export const apiClient = new ApiClient();
