import apiClient from "@/lib/api";
import {
  db,
  cacheApiResponse,
  getCachedApiResponse,
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
  saveLocalDoubtSession,
  saveLocalDoubtMessage,
  updateLocalDoubtStatus,
  saveLocalGroupMessage,
  getLocalProgressMap,
} from "@/lib/offlineDb";
import {
  OFFLINE_SEED_MODULES,
  OFFLINE_SEED_DASHBOARD,
  OFFLINE_SEED_SUBJECTS,
  OFFLINE_SEED_QUIZZES,
  OFFLINE_SEED_MENTOR,
  OFFLINE_SEED_GROUP,
} from "@/lib/offlineSeedData";

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
  let cached = await getCachedApiResponse(cacheKey);
  if (!cached || !Array.isArray(cached.modules)) {
    cached = OFFLINE_SEED_MODULES;
  }

  // Merge local lesson progress from IndexedDB
  const localProgressMap = await getLocalProgressMap();
  const enrichedModules = (cached.modules || []).map((mod) => {
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
  return Array.isArray(cached) && cached.length > 0 ? cached : OFFLINE_SEED_SUBJECTS;
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
  return Array.isArray(cached) && cached.length > 0 ? cached : OFFLINE_SEED_QUIZZES;
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
  if (Array.isArray(cached) && cached.length > 0) return cached;

  const foundQuiz = OFFLINE_SEED_QUIZZES.find((q) => q.id === params.quizId);
  return foundQuiz?.questions || [];
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
      currentStreak: 7,
      lastCompletionDate: "2026-10-08",
      isOffline: true,
    }
  );
}

export async function getOfflineMentor() {
  const cacheKey = "/api/student/mentor";
  const cached = await getCachedApiResponse(cacheKey);
  return cached || OFFLINE_SEED_MENTOR;
}

export async function getOfflineGroup() {
  const cacheKey = "/api/student/group";
  const cached = await getCachedApiResponse(cacheKey);
  return cached || OFFLINE_SEED_GROUP;
}

export {
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
  saveLocalDoubtSession,
  saveLocalDoubtMessage,
  updateLocalDoubtStatus,
  saveLocalGroupMessage,
};
