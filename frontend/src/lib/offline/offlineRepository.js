import apiClient from "@/lib/api";
import {
  db,
  cacheApiResponse,
  getCachedApiResponse,
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
  getLocalProgressMap,
} from "@/lib/offlineDb";

/**
 * Offline Repository - Local-First Data Abstraction Layer
 *
 * Implements Stale-While-Revalidate with IndexedDB persistence:
 * 1. Returns fresh data from network when online and updates IndexedDB cache.
 * 2. Seamlessly serves cached data when offline without throwing unhandled exceptions.
 * 3. Enriches offline data with locally stored pending progress and quiz attempts.
 */

export async function getOfflineLearningModules(options = {}) {
  const cacheKey = "student_learning_modules";

  // 1. If online, fetch from network and update cache
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const networkData = await apiClient.getStudentModules(options);
      if (networkData && Array.isArray(networkData.modules)) {
        await cacheApiResponse(cacheKey, networkData);
        return networkData;
      }
    } catch (err) {
      console.warn("[OfflineRepo] Network fetch failed, falling back to local cache:", err.message);
    }
  }

  // 2. Read from IndexedDB cachedApi
  const cached = await getCachedApiResponse(cacheKey);
  if (cached && Array.isArray(cached.modules)) {
    // Merge local lesson progress from IndexedDB
    const localProgressMap = await getLocalProgressMap();
    const enrichedModules = cached.modules.map((mod) => {
      const enrichedLessons = (mod.lessons || []).map((les) => {
        const localProg = localProgressMap[les.id];
        if (localProg) {
          return {
            ...les,
            progress: {
              completed: Boolean(localProg.completed),
              lastPosition: localProg.lastPosition || 0,
              completedAt: localProg.completedAt || null,
            },
          };
        }
        return les;
      });

      const totalLessons = enrichedLessons.length;
      const completedLessons = enrichedLessons.filter((l) => l.progress?.completed).length;

      return {
        ...mod,
        lessons: enrichedLessons,
        stats: {
          totalLessons,
          completedLessons,
          isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        },
      };
    });

    return {
      ...cached,
      modules: enrichedModules,
      isOfflineFallback: true,
    };
  }

  // Fallback empty result
  return {
    modules: [],
    studentClass: null,
    isOfflineFallback: true,
  };
}

export async function getOfflineSubjects(filter = {}) {
  const classVal = filter.class || filter.classFilter || "all";
  const cacheKey = `subjects_${classVal}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getSubjects(filter);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Subjects network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  return Array.isArray(cached) ? cached : [];
}

export async function getOfflineQuizzes(filters = {}) {
  const cacheKey = `quizzes_${JSON.stringify(filters)}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getQuizzes(filters);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Quizzes network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  return Array.isArray(cached) ? cached : [];
}

export async function getOfflineQuizQuestions(params = {}) {
  const cacheKey = `quiz_questions_${params.quizId || "all"}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getQuizQuestions(params);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Quiz questions network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  return Array.isArray(cached) ? cached : [];
}

export async function getOfflineStreak(userId) {
  const cacheKey = `streak_${userId}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getStreak(userId);
      if (data) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Streak network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  return (
    cached || {
      userId,
      currentStreak: 0,
      lastCompletionDate: null,
      isOffline: true,
    }
  );
}

export {
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
};
