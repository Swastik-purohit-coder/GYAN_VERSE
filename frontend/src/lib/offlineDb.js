import Dexie from "dexie";
import {
  OFFLINE_SEED_MODULES,
  OFFLINE_SEED_SUBJECTS,
  OFFLINE_SEED_MENTOR,
  OFFLINE_SEED_DOUBTS,
  OFFLINE_SEED_GROUP,
  OFFLINE_SEED_GROUP_MESSAGES,
  OFFLINE_SEED_GROUP_RESOURCES,
  OFFLINE_SEED_DASHBOARD,
  OFFLINE_SEED_QUIZZES,
  OFFLINE_SEED_LEADERBOARD,
} from "./offlineSeedData.js";

/**
 * Gyanaratna Production Offline Database (Dexie IndexedDB v3)
 * Full offline capability with local-first persistence for:
 * - Application GET API caching (Stale-While-Revalidate & synthetic responses)
 * - Structured lesson progress & completion tracking
 * - Interactive quiz attempts & responses
 * - 1-on-1 Doubt Sessions & message threads
 * - Class Group chat & shared resources
 * - User Profile & RBAC roles for offline navigation
 * - Idempotent background synchronization queue with retry & backoff
 * - Downloaded video/media registry
 */
export const db = new Dexie("GyanaratnaOfflineDB");

db.version(2).stores({
  cachedApi: "&key, endpoint, timestamp, ttl",
  lessonProgress: "&lessonId, studentId, completed, lastPosition, completedAt, updatedAt, syncStatus",
  quizAttempts: "++id, quizId, studentId, score, completedAt, syncStatus, idempotentKey",
  syncQueue: "++id, action, entityType, entityId, idempotentKey, timestamp, status, retryCount, lastAttempt, error",
  downloadsMetadata: "&id, lessonId, type, url, title, moduleTitle, class, schoolId, sizeBytes, downloadedAt",
  userProfile: "&userId, role, name, class, schoolId, updatedAt",
});

db.version(3).stores({
  // Cached API GET data
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

  // 1-on-1 Doubt Sessions
  doubtSessions: "&id, student_id, teacher_id, subject, title, status, unread_by_student, unread_by_teacher, created_at, updated_at",

  // Messages inside Doubt Sessions
  doubtMessages: "++id, session_id, sender_id, sender_name, sender_role, message, created_at, syncStatus",

  // Class Group Chat Messages
  groupMessages: "++id, group_id, sender_id, sender_name, sender_role, message, created_at, syncStatus",

  // Class Group Shared Resources
  groupResources: "&id, group_id, file_name, file_type, file_size, file_url, created_at",
});

/**
 * Cache arbitrary API response JSON in IndexedDB
 */
export async function cacheApiResponse(key, data, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  try {
    const cleanKey = String(key).trim();
    await db.cachedApi.put({
      key: cleanKey,
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  } catch (e) {
    console.warn("[IndexedDB] Failed to cache API response:", e);
  }
}

/**
 * Retrieve cached API response JSON from IndexedDB
 */
export async function getCachedApiResponse(key) {
  try {
    const cleanKey = String(key).trim();
    let record = await db.cachedApi.get(cleanKey);

    // If not found with query string, try matching pathname only
    if (!record && cleanKey.includes("?")) {
      const pathname = cleanKey.split("?")[0];
      record = await db.cachedApi.get(pathname);
    }

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
 * Retrieves all locally saved quiz attempts from IndexedDB.
 */
export async function getOfflineQuizAttempts(studentId = null) {
  try {
    const attempts = await db.quizAttempts.toArray();
    if (!studentId || studentId === "current") return attempts;
    return attempts.filter((a) => a.studentId === studentId);
  } catch (err) {
    console.warn("[IndexedDB] Failed to get offline quiz attempts:", err);
    return [];
  }
}

/**
 * Saves a new Doubt Session locally and queues for sync.
 */
export async function saveLocalDoubtSession({
  subject = "General",
  title,
  description = "",
  studentId = "current",
  studentName = "Alex Morgan",
  teacherId = "teacher_faculty_swastik",
  teacherName = "Swastik Kumar purohit",
}) {
  const now = new Date().toISOString();
  const id = `doubt_local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const newDoubt = {
    id,
    student_id: studentId,
    student_name: studentName,
    teacher_id: teacherId,
    teacher_name: teacherName,
    subject,
    title: title.trim(),
    description: description ? description.trim() : "",
    status: "open",
    unread_by_student: false,
    unread_by_teacher: true,
    created_at: now,
    updated_at: now,
  };

  await db.doubtSessions.put(newDoubt);

  // Add initial message if description exists
  if (description) {
    await db.doubtMessages.add({
      session_id: id,
      sender_id: studentId,
      sender_name: studentName,
      sender_role: "student",
      message: description.trim(),
      created_at: now,
      syncStatus: "pending",
    });
  }

  // Update cachedApi list
  try {
    const cached = (await getCachedApiResponse("/api/student/doubts")) || { doubts: [], unreadCount: 0 };
    const updatedList = [newDoubt, ...(cached.doubts || [])];
    await cacheApiResponse("/api/student/doubts", {
      doubts: updatedList,
      unreadCount: cached.unreadCount || 0,
    });
  } catch {}

  // Enqueue for background sync
  await enqueueSyncOperation({
    action: "CREATE_DOUBT",
    entityType: "doubt_session",
    entityId: id,
    idempotentKey: `doubt_create_${id}`,
    payload: newDoubt,
  });

  return newDoubt;
}

/**
 * Saves a message to an existing Doubt Session locally and queues for sync.
 */
export async function saveLocalDoubtMessage({
  sessionId,
  senderId = "current",
  senderName = "Alex Morgan",
  senderRole = "student",
  message,
}) {
  const now = new Date().toISOString();
  const msgDoc = {
    session_id: sessionId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    message: message.trim(),
    created_at: now,
    syncStatus: "pending",
  };

  const id = await db.doubtMessages.add(msgDoc);
  const createdMsg = { id, ...msgDoc };

  // Update parent doubt session timestamp
  const parentDoubt = await db.doubtSessions.get(sessionId);
  if (parentDoubt) {
    await db.doubtSessions.update(sessionId, {
      updated_at: now,
      status: senderRole === "student" ? "open" : "answered",
      unread_by_student: senderRole === "teacher",
      unread_by_teacher: senderRole === "student",
    });
  }

  // Update cachedApi thread
  try {
    const threadKey = `/api/student/doubts/${sessionId}`;
    const cachedThread = await getCachedApiResponse(threadKey);
    if (cachedThread) {
      const messages = Array.isArray(cachedThread.messages) ? [...cachedThread.messages, createdMsg] : [createdMsg];
      await cacheApiResponse(threadKey, { ...cachedThread, messages, updated_at: now });
    }
  } catch {}

  // Enqueue sync operation
  await enqueueSyncOperation({
    action: "ADD_DOUBT_MESSAGE",
    entityType: "doubt_message",
    entityId: sessionId,
    idempotentKey: `doubt_msg_${sessionId}_${id}_${Date.now()}`,
    payload: {
      ...createdMsg,
      localMsgId: id,
    },
  });

  return createdMsg;
}

/**
 * Updates status of a doubt session locally and queues for sync.
 */
export async function updateLocalDoubtStatus(sessionId, status) {
  const now = new Date().toISOString();
  await db.doubtSessions.update(sessionId, { status, updated_at: now });

  // Update cachedApi
  try {
    const threadKey = `/api/student/doubts/${sessionId}`;
    const cachedThread = await getCachedApiResponse(threadKey);
    if (cachedThread) {
      await cacheApiResponse(threadKey, { ...cachedThread, status, updated_at: now });
    }

    const listKey = "/api/student/doubts";
    const cachedList = await getCachedApiResponse(listKey);
    if (cachedList && Array.isArray(cachedList.doubts)) {
      const updatedDoubts = cachedList.doubts.map((d) => (d.id === sessionId ? { ...d, status, updated_at: now } : d));
      await cacheApiResponse(listKey, { ...cachedList, doubts: updatedDoubts });
    }
  } catch {}

  await enqueueSyncOperation({
    action: "UPDATE_DOUBT_STATUS",
    entityType: "doubt_session",
    entityId: sessionId,
    idempotentKey: `doubt_status_${sessionId}_${status}_${Date.now()}`,
    payload: { sessionId, status, updatedAt: now },
  });

  return { success: true, sessionId, status };
}

/**
 * Saves a Class Group Chat message locally and queues for sync.
 */
export async function saveLocalGroupMessage({
  groupId = "grp_offline_class8",
  senderId = "current",
  senderName = "Alex Morgan",
  senderRole = "student",
  message,
}) {
  const now = new Date().toISOString();
  const msgDoc = {
    group_id: groupId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    message: message.trim(),
    created_at: now,
    syncStatus: "pending",
  };

  const id = await db.groupMessages.add(msgDoc);
  const createdMsg = { id, ...msgDoc };

  // Update cachedApi for group messages
  try {
    const cachedMsgs = (await getCachedApiResponse("/api/student/group/messages")) || [];
    const updatedList = Array.isArray(cachedMsgs) ? [...cachedMsgs, createdMsg] : [createdMsg];
    await cacheApiResponse("/api/student/group/messages", updatedList);
  } catch {}

  // Enqueue sync operation
  await enqueueSyncOperation({
    action: "SEND_GROUP_MESSAGE",
    entityType: "group_message",
    entityId: groupId,
    idempotentKey: `grp_msg_${groupId}_${id}_${Date.now()}`,
    payload: {
      ...createdMsg,
      localMsgId: id,
    },
  });

  return createdMsg;
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

/**
 * Saves user profile to local IndexedDB for seamless offline auth.
 */
export async function saveLocalUserProfile(profile) {
  if (!profile || !profile.userId) return;
  try {
    const existing = await db.userProfile.get(profile.userId).catch(() => null);
    await db.userProfile.put({
      ...(existing || {}),
      ...profile,
      userId: profile.userId,
      role: profile.role || existing?.role || "student",
      name: profile.name || existing?.name || "Student",
      class: profile.class || existing?.class || "Class 8",
      schoolId: profile.schoolId || profile.school_id || existing?.schoolId || "Gyanaratna STEM Academy",
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("[IndexedDB] Failed to save userProfile:", e);
  }
}

/**
 * Retrieves cached user profile from local IndexedDB.
 */
export async function getLocalUserProfile(userId) {
  try {
    if (userId) {
      const p = await db.userProfile.get(userId);
      if (p) return p;
    }
    // Return any existing profile if exact ID not found
    const all = await db.userProfile.toArray();
    if (all && all.length > 0) return all[0];
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Comprehensive Pre-Seeding:
 * Populates IndexedDB with complete, realistic learning content and offline data if empty.
 * Guarantees zero blank screens or fetch errors when offline.
 */
export async function seedOfflineDatabaseIfEmpty() {
  try {
    const checkInit = await db.cachedApi.get("seed_initialized");
    if (checkInit?.data === true) {
      return; // Already initialized
    }

    console.log("[IndexedDB] Initializing complete offline dataset for Gyanaratna...");

    // 1. Modules & Lessons
    await cacheApiResponse("student_learning_modules", OFFLINE_SEED_MODULES);
    await cacheApiResponse("/api/student/modules", OFFLINE_SEED_MODULES);
    await cacheApiResponse("/api/teacher/modules", { modules: OFFLINE_SEED_MODULES.modules });

    // 2. Dashboard
    await cacheApiResponse("/api/student/dashboard", OFFLINE_SEED_DASHBOARD);
    await cacheApiResponse("/api/student/dashboard?userId=current", OFFLINE_SEED_DASHBOARD);

    // 3. Subjects
    await cacheApiResponse("/api/subjects", OFFLINE_SEED_SUBJECTS);
    await cacheApiResponse("/api/subjects?class=Class+8", OFFLINE_SEED_SUBJECTS);
    await cacheApiResponse("/api/subjects?class=all", OFFLINE_SEED_SUBJECTS);
    await cacheApiResponse("subjects_all", OFFLINE_SEED_SUBJECTS);
    await cacheApiResponse("subjects_Class 8", OFFLINE_SEED_SUBJECTS);

    // 4. Quizzes & Questions
    await cacheApiResponse("/api/quizzes", OFFLINE_SEED_QUIZZES);
    await cacheApiResponse("quizzes_{}", OFFLINE_SEED_QUIZZES);
    for (const q of OFFLINE_SEED_QUIZZES) {
      await cacheApiResponse(`/api/quizzes/${q.id}`, q);
      await cacheApiResponse(`/api/questions?quizId=${q.id}`, q.questions);
      await cacheApiResponse(`quiz_questions_${q.id}`, q.questions);
    }

    // 5. Mentor Info
    await cacheApiResponse("/api/student/mentor", OFFLINE_SEED_MENTOR);

    // 6. Doubt Sessions & Message Threads
    await cacheApiResponse("/api/student/doubts", {
      doubts: OFFLINE_SEED_DOUBTS,
      unreadCount: 0,
    });
    await cacheApiResponse("/api/teacher/doubts", {
      doubts: OFFLINE_SEED_DOUBTS,
      unreadCount: 1,
    });

    for (const doubt of OFFLINE_SEED_DOUBTS) {
      await db.doubtSessions.put({
        id: doubt.id,
        student_id: doubt.student_id,
        teacher_id: doubt.teacher_id,
        subject: doubt.subject,
        title: doubt.title,
        description: doubt.description,
        status: doubt.status,
        unread_by_student: doubt.unread_by_student,
        unread_by_teacher: doubt.unread_by_teacher,
        created_at: doubt.created_at,
        updated_at: doubt.updated_at,
      });

      await cacheApiResponse(`/api/student/doubts/${doubt.id}`, doubt);
      await cacheApiResponse(`/api/teacher/doubts/${doubt.id}`, doubt);

      if (Array.isArray(doubt.messages)) {
        for (const msg of doubt.messages) {
          await db.doubtMessages.add({
            session_id: doubt.id,
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            sender_role: msg.sender_role,
            message: msg.message,
            created_at: msg.created_at,
            syncStatus: "synced",
          });
        }
      }
    }

    // 7. Class Group Chat & Resources
    await cacheApiResponse("/api/student/group", OFFLINE_SEED_GROUP);
    await cacheApiResponse("/api/student/group/messages", OFFLINE_SEED_GROUP_MESSAGES);
    await cacheApiResponse("/api/student/group/resources", { resources: OFFLINE_SEED_GROUP_RESOURCES });

    for (const gm of OFFLINE_SEED_GROUP_MESSAGES) {
      await db.groupMessages.add({
        group_id: gm.group_id,
        sender_id: gm.sender_id,
        sender_name: gm.sender_name,
        sender_role: gm.sender_role,
        message: gm.message,
        created_at: gm.created_at,
        syncStatus: "synced",
      });
    }

    for (const res of OFFLINE_SEED_GROUP_RESOURCES) {
      await db.groupResources.put(res);
    }

    // 8. Streak & Leaderboard
    await cacheApiResponse("/api/streak/current", OFFLINE_SEED_DASHBOARD.streak);
    await cacheApiResponse("streak_current", OFFLINE_SEED_DASHBOARD.streak);
    await cacheApiResponse("/api/leaderboard", OFFLINE_SEED_LEADERBOARD);

    // 9. Initial Lesson Progress Map
    for (const mod of OFFLINE_SEED_MODULES.modules) {
      for (const les of mod.lessons) {
        if (les.progress?.completed) {
          await db.lessonProgress.put({
            lessonId: les.id,
            studentId: "current",
            completed: true,
            lastPosition: les.progress.lastPosition || 0,
            completedAt: les.progress.completedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: "synced",
          });
        }
      }
    }

    // 10. Default User Profiles for Offline Auth
    await db.userProfile.put({
      userId: "current",
      role: "student",
      name: "Alex Morgan",
      class: "Class 8",
      schoolId: "Gyanaratna STEM Academy",
      updatedAt: new Date().toISOString(),
    });

    await db.userProfile.put({
      userId: "teacher_faculty_swastik",
      role: "teacher",
      name: "Swastik Kumar purohit",
      class: "Class 8",
      schoolId: "Gyanaratna STEM Academy",
      updatedAt: new Date().toISOString(),
    });

    // Mark initialization complete
    await cacheApiResponse("seed_initialized", true);
    console.log("[IndexedDB] Offline dataset successfully populated.");
  } catch (err) {
    console.warn("[IndexedDB] Seed initialization error:", err);
  }
}
