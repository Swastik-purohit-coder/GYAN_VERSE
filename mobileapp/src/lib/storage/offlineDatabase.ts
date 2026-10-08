/**
 * GyanVerse Mobile Offline Database (SQLite with expo-sqlite)
 * Full native replacement for Dexie IndexedDB with 100% schema & behavioral parity.
 */

import * as SQLite from 'expo-sqlite';
import { SyncActionType } from '../../../../shared/constants';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gyanverse_offline.db');
    await initSchema(dbInstance);
  }
  return dbInstance;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cached_api (
      key TEXT PRIMARY KEY,
      data TEXT,
      timestamp INTEGER,
      ttl INTEGER
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      lessonId TEXT PRIMARY KEY,
      studentId TEXT,
      completed INTEGER,
      lastPosition INTEGER,
      startedAt TEXT,
      completedAt TEXT,
      updatedAt TEXT,
      syncStatus TEXT
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quizId TEXT,
      studentId TEXT,
      answers TEXT,
      score INTEGER,
      correctAnswers INTEGER,
      totalQuestions INTEGER,
      timeSpent INTEGER,
      subject TEXT,
      completedAt TEXT,
      syncStatus TEXT,
      idempotentKey TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT,
      entityType TEXT,
      entityId TEXT,
      idempotentKey TEXT,
      payload TEXT,
      timestamp INTEGER,
      status TEXT,
      retryCount INTEGER,
      lastAttempt INTEGER,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_media (
      id TEXT PRIMARY KEY,
      lessonId TEXT,
      type TEXT,
      url TEXT,
      title TEXT,
      localFilePath TEXT,
      sizeBytes INTEGER,
      downloadedAt TEXT
    );
  `);
}

/**
 * Cache arbitrary API JSON response
 */
export async function cacheApiResponse(key: string, data: any, ttlMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO cached_api (key, data, timestamp, ttl) VALUES (?, ?, ?, ?)`,
      [key, JSON.stringify(data), Date.now(), ttlMs]
    );
  } catch (e) {
    console.warn('[OfflineDB] Failed to cache API response:', e);
  }
}

/**
 * Retrieve cached API JSON response
 */
export async function getCachedApiResponse<T>(key: string): Promise<T | null> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ data: string; timestamp: number; ttl: number }>(
      `SELECT data, timestamp, ttl FROM cached_api WHERE key = ?`,
      [key]
    );
    if (!row) return null;
    return JSON.parse(row.data) as T;
  } catch (e) {
    console.warn('[OfflineDB] Failed to read cached API response:', e);
    return null;
  }
}

/**
 * Saves or updates lesson progress in local SQLite.
 */
export async function saveLocalLessonProgress({
  lessonId,
  studentId = 'current',
  completed = true,
  lastPosition = 0,
  action = 'complete',
}: {
  lessonId: string;
  studentId?: string;
  completed?: boolean;
  lastPosition?: number;
  action?: string;
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const existing = await db.getFirstAsync<{ completed: number; lastPosition: number; startedAt: string; completedAt: string }>(
    `SELECT completed, lastPosition, startedAt, completedAt FROM lesson_progress WHERE lessonId = ?`,
    [lessonId]
  );

  const isCompleted = action === 'start' ? (existing ? Boolean(existing.completed) : false) : completed;
  const startedAt = existing?.startedAt || now;
  const completedAt = isCompleted ? (existing?.completedAt || now) : null;
  const finalPos = lastPosition || existing?.lastPosition || 0;

  await db.runAsync(
    `INSERT OR REPLACE INTO lesson_progress (lessonId, studentId, completed, lastPosition, startedAt, completedAt, updatedAt, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [lessonId, studentId, isCompleted ? 1 : 0, finalPos, startedAt, completedAt, now, 'pending']
  );

  // Queue sync operation
  await enqueueSyncOperation({
    action: 'UPDATE_LESSON_PROGRESS',
    entityType: 'lesson_progress',
    entityId: lessonId,
    idempotentKey: `prog_${studentId}_${lessonId}_${now.slice(0, 16)}`,
    payload: {
      lessonId,
      completed: isCompleted,
      lastPosition: finalPos,
      action,
      updatedAt: now,
    },
  });

  return { lessonId, studentId, completed: isCompleted, lastPosition: finalPos, updatedAt: now };
}

/**
 * Saves an offline quiz response/attempt in SQLite and queues for sync.
 */
export async function saveOfflineQuizAttempt({
  quizId,
  studentId = 'current',
  answers = {},
  score = 0,
  correctAnswers = 0,
  totalQuestions = 0,
  timeSpent = 0,
  subject = 'General',
}: {
  quizId: string;
  studentId?: string;
  answers?: Record<string | number, any>;
  score?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  timeSpent?: number;
  subject?: string;
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const idempotentKey = `quiz_${studentId}_${quizId}_${Date.now()}`;

  const result = await db.runAsync(
    `INSERT INTO quiz_attempts (quizId, studentId, answers, score, correctAnswers, totalQuestions, timeSpent, subject, completedAt, syncStatus, idempotentKey)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quizId,
      studentId,
      JSON.stringify(answers),
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      subject,
      now,
      'pending',
      idempotentKey,
    ]
  );

  const attemptId = result.lastInsertRowId;

  await enqueueSyncOperation({
    action: 'SUBMIT_QUIZ_RESPONSE',
    entityType: 'quiz_response',
    entityId: quizId,
    idempotentKey,
    payload: {
      quizId,
      studentId,
      answers,
      score,
      correctAnswers,
      totalQuestions,
      timeSpent,
      subject,
      completedAt: now,
      attemptId,
    },
  });

  return { id: attemptId, quizId, score, completedAt: now };
}

/**
 * Adds an operation to the syncQueue with deduplication and idempotency.
 */
export async function enqueueSyncOperation({
  action,
  entityType,
  entityId,
  idempotentKey,
  payload,
}: {
  action: SyncActionType | string;
  entityType: string;
  entityId: string;
  idempotentKey?: string;
  payload: any;
}): Promise<number> {
  const db = await getDatabase();
  const key = idempotentKey || `${action}_${entityType}_${entityId}`;

  // Check if identical pending item exists
  const existing = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM sync_queue WHERE entityId = ? AND action = ? AND status = 'pending'`,
    [entityId, action]
  );

  if (existing) {
    await db.runAsync(
      `UPDATE sync_queue SET payload = ?, idempotentKey = ?, timestamp = ?, error = NULL WHERE id = ?`,
      [JSON.stringify(payload), key, Date.now(), existing.id]
    );
    return existing.id;
  }

  const res = await db.runAsync(
    `INSERT INTO sync_queue (action, entityType, entityId, idempotentKey, payload, timestamp, status, retryCount, lastAttempt, error)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, NULL, NULL)`,
    [action, entityType, entityId, key, JSON.stringify(payload), Date.now()]
  );

  return res.lastInsertRowId;
}

/**
 * Returns total count of pending sync items
 */
export async function getPendingSyncCount(): Promise<number> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`
    );
    return row?.count || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Returns pending sync queue items
 */
export async function getPendingSyncQueue(limit: number = 30): Promise<Array<{
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  idempotentKey: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}>> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: number;
      action: string;
      entityType: string;
      entityId: string;
      idempotentKey: string;
      payload: string;
      timestamp: number;
      retryCount: number;
    }>(
      `SELECT id, action, entityType, entityId, idempotentKey, payload, timestamp, retryCount
       FROM sync_queue WHERE status = 'pending' ORDER BY timestamp ASC LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      ...r,
      payload: JSON.parse(r.payload),
    }));
  } catch (e) {
    console.warn('[OfflineDB] Error getting pending sync queue:', e);
    return [];
  }
}

/**
 * Deletes a processed sync queue item and marks entity as synced
 */
export async function markSyncQueueItemSuccess(id: number, action: string, entityId: string, attemptId?: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);

  if (action === 'UPDATE_LESSON_PROGRESS' && entityId) {
    await db.runAsync(`UPDATE lesson_progress SET syncStatus = 'synced' WHERE lessonId = ?`, [entityId]);
  } else if (action === 'SUBMIT_QUIZ_RESPONSE' && attemptId) {
    await db.runAsync(`UPDATE quiz_attempts SET syncStatus = 'synced' WHERE id = ?`, [attemptId]);
  }
}

/**
 * Increments retry count on failed sync queue item
 */
export async function markSyncQueueItemFailed(id: number, errorMsg: string): Promise<void> {
  const db = await getDatabase();
  const item = await db.getFirstAsync<{ retryCount: number }>(`SELECT retryCount FROM sync_queue WHERE id = ?`, [id]);
  const retries = (item?.retryCount || 0) + 1;
  const status = retries >= 5 ? 'failed' : 'pending';

  await db.runAsync(
    `UPDATE sync_queue SET retryCount = ?, lastAttempt = ?, error = ?, status = ? WHERE id = ?`,
    [retries, Date.now(), errorMsg, status, id]
  );
}

/**
 * Returns a map of all local lesson progress
 */
export async function getLocalProgressMap(): Promise<Record<string, any>> {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`SELECT * FROM lesson_progress`);
    const map: Record<string, any> = {};
    rows.forEach((r) => {
      map[r.lessonId] = {
        ...r,
        completed: Boolean(r.completed),
      };
    });
    return map;
  } catch (e) {
    console.warn('[OfflineDB] Failed to read lesson_progress:', e);
    return {};
  }
}

/**
 * Registers downloaded media item
 */
export async function saveOfflineMediaRecord(media: {
  id: string;
  lessonId: string;
  type: string;
  url: string;
  title: string;
  localFilePath: string;
  sizeBytes: number;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT OR REPLACE INTO offline_media (id, lessonId, type, url, title, localFilePath, sizeBytes, downloadedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [media.id, media.lessonId, media.type, media.url, media.title, media.localFilePath, media.sizeBytes, now]
  );
}

/**
 * Returns all downloaded offline media
 */
export async function getOfflineMediaRecords(): Promise<any[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync(`SELECT * FROM offline_media ORDER BY downloadedAt DESC`);
  } catch (e) {
    return [];
  }
}

/**
 * Deletes downloaded media record
 */
export async function deleteOfflineMediaRecord(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM offline_media WHERE id = ?`, [id]);
}
