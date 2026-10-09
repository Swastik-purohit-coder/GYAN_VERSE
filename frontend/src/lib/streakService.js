import apiClient from './api';
import { getOfflineStreak } from './offline/offlineRepository';
import { cacheApiResponse, getCachedApiResponse } from './offlineDb';

/**
 * StreakService - Manages student streaks with offline fallback
 */
export const StreakService = {
  async getStreakStats(userId) {
    if (!userId) {
      return {
        currentStreak: 0,
        completedToday: false,
        todayQuizzes: 0,
        todayTimeSpent: 0,
        todayAverageScore: 0,
      };
    }

    try {
      const data = await getOfflineStreak(userId);
      return {
        currentStreak: Number(data?.currentStreak) || 0,
        completedToday: Boolean(data?.completedToday),
        todayQuizzes: Number(data?.todayQuizzes) || 0,
        todayTimeSpent: Number(data?.todayTimeSpent) || 0,
        todayAverageScore: Number(data?.todayAverageScore) || 0,
        lastCompletionDate: data?.lastCompletionDate || null,
        isOffline: Boolean(data?.isOffline),
      };
    } catch (err) {
      console.warn('[StreakService] Failed to load streak stats:', err);
      return {
        currentStreak: 0,
        completedToday: false,
        todayQuizzes: 0,
        todayTimeSpent: 0,
        todayAverageScore: 0,
        isOffline: true,
      };
    }
  },

  async getQuizHistory(userId, options = {}) {
    const cacheKey = `quiz_history_${userId}`;
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const history = await apiClient.getStreak(userId);
        if (history) {
          await cacheApiResponse(cacheKey, history);
          return history;
        }
      } catch (e) {
        console.warn('[StreakService] Quiz history network fetch failed, using cache:', e);
      }
    }

    const cached = await getCachedApiResponse(cacheKey);
    return cached || { completions: [] };
  },

  async recordQuizCompletion(userId, quizData = {}) {
    const cacheKey = `streak_${userId}`;
    const now = new Date().toISOString();

    const optimisticRecord = {
      userId,
      currentStreak: (quizData.currentStreak || 1),
      completedToday: true,
      todayQuizzes: 1,
      todayTimeSpent: quizData.timeSpent || 0,
      todayAverageScore: quizData.score || 100,
      lastCompletionDate: now,
    };

    // Update local cache immediately
    await cacheApiResponse(cacheKey, optimisticRecord);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const result = await apiClient.recordStreakActivity?.({
          userId,
          ...quizData,
        });
        if (result) {
          await cacheApiResponse(cacheKey, result);
          return result;
        }
      } catch (e) {
        console.warn('[StreakService] Online streak record failed, continuing offline:', e);
      }
    }

    return optimisticRecord;
  },

  async simulateQuizCompletion(userId) {
    return this.recordQuizCompletion(userId, {
      quizId: 'simulated_quiz',
      score: 100,
      timeSpent: 120,
    });
  },

  async getDailyActivity(userId, date = null) {
    const cacheKey = `daily_activity_${userId}_${date || 'today'}`;
    const cached = await getCachedApiResponse(cacheKey);
    return cached || { active: true, quizzesCompleted: 0 };
  },
};
