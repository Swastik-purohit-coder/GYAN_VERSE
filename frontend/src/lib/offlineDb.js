import Dexie from "dexie";

/**
 * Gyanaratna Production Offline Database (Dexie IndexedDB)
 * Supports full offline capability for:
 * - Application data caching (modules, subjects, quizzes)
 * - Offline lesson progress tracking
 * - Offline quiz submissions
 * - Persistent idempotent sync queue with retry & backoff
 * - Downloaded media metadata & storage management
 * - Offline user profile & roles
 */
export const db = new Dexie("GyanaratnaOfflineDB");

db.version(2).stores({
  // Cached API GET data (Stale-While-Revalidate & synthetic responses)
  cachedApi: "&key, endpoint, timestamp, ttl",

  // Structured lesson progress
  lessonProgress: "&lessonId, studentId, completed, lastPosition, completedAt, updatedAt, syncStatus",

  // Offline quiz attempts & submissions
  quizAttempts: "++id, quizId, studentId, score, completedAt, syncStatus, idempotentKey",

  // Queue for offline sync operations (POST /api/sync)
  syncQueue: "++id, action, entityType, entityId, idempotentKey, timestamp, status, retryCount, lastAttempt, error",

  // Local metadata registry for downloaded offline videos & audio
  downloadsMetadata: "&id, lessonId, type, url, title, moduleTitle, class, schoolId, sizeBytes, downloadedAt",

  // Cached User Profile & Session info for offline authorization
  userProfile: "&userId, role, name, class, schoolId, updatedAt",
});

/**
 * Helper to cache arbitrary API response JSON in IndexedDB
 */
export async function cacheApiResponse(key, data, ttlMs = 24 * 60 * 60 * 1000) {
  try {
    await db.cachedApi.put({
      key,
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  } catch (e) {
    console.warn("[IndexedDB] Failed to cache API response:", e);
  }
}

/**
 * Helper to retrieve cached API response JSON
 */
export async function getCachedApiResponse(key) {
  try {
    const record = await db.cachedApi.get(key);
    if (!record) return null;
    return record.data;
  } catch (e) {
    console.warn("[IndexedDB] Failed to read cached API response:", e);
    return null;
  }
}

/**
 * Saves or updates lesson progress in local IndexedDB.
 */
export async function saveLocalLessonProgress({
  lessonId,
  studentId = "current",
  completed = true,
  lastPosition = 0,
  action = "complete",
}) {
  const now = new Date().toISOString();
  const existing = await db.lessonProgress.get(lessonId);

  const isCompleted = action === "start" ? (existing?.completed ?? false) : completed;

  const record = {
    lessonId,
    studentId: studentId || existing?.studentId || "current",
    completed: isCompleted,
    lastPosition: lastPosition || existing?.lastPosition || 0,
    startedAt: existing?.startedAt || now,
    completedAt: isCompleted ? (existing?.completedAt || now) : null,
    updatedAt: now,
    syncStatus: "pending",
  };

  await db.lessonProgress.put(record);

  // Queue sync operation for syncEngine
  await enqueueSyncOperation({
    action: "UPDATE_LESSON_PROGRESS",
    entityType: "lesson_progress",
    entityId: lessonId,
    idempotentKey: `prog_${record.studentId}_${lessonId}_${now.slice(0, 16)}`,
    payload: {
      lessonId,
      completed: isCompleted,
      lastPosition: record.lastPosition,
      action,
      updatedAt: now,
    },
  });

  return record;
}

/**
 * Saves an offline quiz response/attempt in IndexedDB and queues for sync.
 */
export async function saveOfflineQuizAttempt({
  quizId,
  studentId = "current",
  answers = {},
  score = 0,
  correctAnswers = 0,
  totalQuestions = 0,
  timeSpent = 0,
  subject = "General",
}) {
  const now = new Date().toISOString();
  const idempotentKey = `quiz_${studentId}_${quizId}_${Date.now()}`;

  const attemptDoc = {
    quizId,
    studentId,
    answers,
    score,
    correctAnswers,
    totalQuestions,
    timeSpent,
    subject,
    completedAt: now,
    syncStatus: "pending",
    idempotentKey,
  };

  const id = await db.quizAttempts.add(attemptDoc);

  await enqueueSyncOperation({
    action: "SUBMIT_QUIZ_RESPONSE",
    entityType: "quiz_response",
    entityId: quizId,
    idempotentKey,
    payload: {
      ...attemptDoc,
      attemptId: id,
    },
  });

  return { id, ...attemptDoc };
}

/**
 * Adds an operation to the syncQueue with deduplication and idempotency.
 */
export async function enqueueSyncOperation({ action, entityType, entityId, idempotentKey, payload }) {
  const key = idempotentKey || `${action}_${entityType}_${entityId}`;

  // Check if identical pending sync item already exists in queue to avoid duplicates
  const pendingItems = await db.syncQueue
    .where("entityId")
    .equals(entityId)
    .and((item) => item.status === "pending" && item.action === action)
    .toArray();

  if (pendingItems.length > 0) {
    // Update existing pending queue item payload with latest data
    await db.syncQueue.update(pendingItems[0].id, {
      payload,
      idempotentKey: key,
      timestamp: Date.now(),
      error: null,
    });
    return pendingItems[0].id;
  }

  return await db.syncQueue.add({
    action,
    entityType,
    entityId,
    idempotentKey: key,
    payload,
    timestamp: Date.now(),
    status: "pending",
    retryCount: 0,
    lastAttempt: null,
    error: null,
  });
}

/**
 * Retrieves local progress map for lessons.
 */
export async function getLocalProgressMap() {
  try {
    const list = await db.lessonProgress.toArray();
    const map = {};
    list.forEach((item) => {
      map[item.lessonId] = item;
    });
    return map;
  } catch (e) {
    console.warn("Failed to read IndexedDB lessonProgress:", e);
    return {};
  }
}

/**
 * Counts total pending synchronization operations.
 */
export async function getPendingSyncCount() {
  try {
    return await db.syncQueue.where("status").equals("pending").count();
  } catch (e) {
    return 0;
  }
}

