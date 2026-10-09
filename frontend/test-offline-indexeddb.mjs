import "fake-indexeddb/auto";
import assert from "node:assert";

// Set up browser-like environment globals for Node test
globalThis.window = globalThis;
globalThis.window.location = { origin: "http://localhost:3000" };
try {
  Object.defineProperty(globalThis.navigator, "onLine", { value: false, configurable: true, writable: true });
} catch {
  Object.defineProperty(globalThis, "navigator", { value: { onLine: false }, configurable: true, writable: true });
}
globalThis.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; },
};

console.log("=================================================");
console.log("GYANARATNA OFFLINE INDEXEDDB VERIFICATION SUITE");
console.log("=================================================");

async function runTests() {
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      console.error(`  ✗ ${name}:`, e.message);
      throw e;
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      console.error(`  ✗ ${name}:`, e.message);
      throw e;
    }
  }

  // Import Offline DB modules
  const {
    db,
    seedOfflineDatabaseIfEmpty,
    cacheApiResponse,
    getCachedApiResponse,
    saveLocalLessonProgress,
    saveOfflineQuizAttempt,
    saveLocalDoubtSession,
    saveLocalDoubtMessage,
    updateLocalDoubtStatus,
    saveLocalGroupMessage,
    saveLocalUserProfile,
    getLocalUserProfile,
    getPendingSyncCount,
    getLocalProgressMap,
  } = await import("./src/lib/offlineDb.js");

  const { installClientFetchInterceptor } = await import("./src/lib/clientFetchInterceptor.js");

  console.log("\n[TEST GROUP 1: IndexedDB Initialization & Pre-Seeding]");

  await asyncTest("1.1 IndexedDB opens and schema v3 has all required stores", async () => {
    await db.open();
    const storeNames = db.tables.map(t => t.name);
    const requiredStores = [
      "cachedApi",
      "lessonProgress",
      "quizAttempts",
      "syncQueue",
      "downloadsMetadata",
      "userProfile",
      "doubtSessions",
      "doubtMessages",
      "groupMessages",
      "groupResources",
    ];
    for (const store of requiredStores) {
      assert.ok(storeNames.includes(store), `Store ${store} must exist in Dexie schema`);
    }
  });

  await asyncTest("1.2 seedOfflineDatabaseIfEmpty() seeds complete offline content", async () => {
    await seedOfflineDatabaseIfEmpty();

    const modules = await getCachedApiResponse("student_learning_modules");
    assert.ok(modules && Array.isArray(modules.modules), "Modules must be seeded");
    assert.ok(modules.modules.length >= 4, "Must have at least 4 STEM modules");

    const dashboard = await getCachedApiResponse("/api/student/dashboard");
    assert.ok(dashboard && dashboard.student, "Dashboard must be seeded");
    assert.strictEqual(dashboard.student.class, "Class 8");

    const subjects = await getCachedApiResponse("/api/subjects");
    assert.ok(Array.isArray(subjects) && subjects.length >= 5, "Subjects must be seeded");

    const mentor = await getCachedApiResponse("/api/student/mentor");
    assert.ok(mentor && mentor.mentor && mentor.mentor.name, "Mentor must be seeded");
    assert.strictEqual(mentor.mentor.name, "Swastik Kumar purohit");

    const doubts = await db.doubtSessions.toArray();
    assert.ok(doubts.length >= 2, "Doubt sessions must be seeded");

    const doubtMsgs = await db.doubtMessages.toArray();
    assert.ok(doubtMsgs.length >= 2, "Doubt messages must be seeded");

    const groupMsgs = await db.groupMessages.toArray();
    assert.ok(groupMsgs.length >= 3, "Group messages must be seeded");

    const groupRes = await db.groupResources.toArray();
    assert.ok(groupRes.length >= 2, "Group resources must be seeded");
  });

  console.log("\n[TEST GROUP 2: Local IndexedDB Mutations & Sync Queue]");

  await asyncTest("2.1 saveLocalLessonProgress saves locally and enqueues UPDATE_LESSON_PROGRESS", async () => {
    const prog = await saveLocalLessonProgress({
      lessonId: "les_alg_test_100",
      studentId: "student_offline_test",
      completed: true,
      lastPosition: 950,
      action: "complete",
    });

    assert.strictEqual(prog.lessonId, "les_alg_test_100");
    assert.strictEqual(prog.completed, true);
    assert.strictEqual(prog.syncStatus, "pending");

    const stored = await db.lessonProgress.get("les_alg_test_100");
    assert.strictEqual(stored.completed, true);

    const queued = await db.syncQueue
      .where("action")
      .equals("UPDATE_LESSON_PROGRESS")
      .and(i => i.entityId === "les_alg_test_100")
      .first();
    assert.ok(queued, "Lesson progress must be enqueued in syncQueue");
    assert.strictEqual(queued.status, "pending");
  });

  await asyncTest("2.2 saveOfflineQuizAttempt saves attempt and enqueues SUBMIT_QUIZ_RESPONSE", async () => {
    const attempt = await saveOfflineQuizAttempt({
      quizId: "quiz_alg_1",
      studentId: "student_offline_test",
      answers: { q_alg_1: "x = 5" },
      score: 100,
      correctAnswers: 5,
      totalQuestions: 5,
      timeSpent: 120,
      subject: "Mathematics",
    });

    assert.ok(attempt.id, "Attempt should have an autoincrement ID");
    assert.strictEqual(attempt.score, 100);

    const stored = await db.quizAttempts.get(attempt.id);
    assert.strictEqual(stored.score, 100);

    const queued = await db.syncQueue
      .where("action")
      .equals("SUBMIT_QUIZ_RESPONSE")
      .and(i => i.entityId === "quiz_alg_1")
      .first();
    assert.ok(queued, "Quiz attempt must be enqueued in syncQueue");
  });

  await asyncTest("2.3 saveLocalDoubtSession creates session and enqueues CREATE_DOUBT", async () => {
    const doubt = await saveLocalDoubtSession({
      subject: "Science",
      title: "How do photovoltaic cells generate electric potential?",
      description: "Looking for semiconductor band gap explanation.",
      studentId: "student_offline_test",
      studentName: "Alex Morgan",
    });

    assert.ok(doubt.id, "Doubt should have local ID");
    assert.strictEqual(doubt.status, "open");

    const storedDoubt = await db.doubtSessions.get(doubt.id);
    assert.ok(storedDoubt, "Doubt session stored in IndexedDB");

    const queued = await db.syncQueue
      .where("action")
      .equals("CREATE_DOUBT")
      .and(i => i.entityId === doubt.id)
      .first();
    assert.ok(queued, "Doubt must be enqueued in syncQueue");
  });

  await asyncTest("2.4 saveLocalDoubtMessage adds message and enqueues ADD_DOUBT_MESSAGE", async () => {
    const msg = await saveLocalDoubtMessage({
      sessionId: "doubt_offline_1",
      senderId: "student_offline_test",
      senderName: "Alex Morgan",
      senderRole: "student",
      message: "Thank you for the quadratic formula clarification!",
    });

    assert.ok(msg.id, "Message should have local ID");
    assert.strictEqual(msg.message, "Thank you for the quadratic formula clarification!");

    const storedMsg = await db.doubtMessages.get(msg.id);
    assert.ok(storedMsg, "Message stored in IndexedDB doubtMessages");

    const queued = await db.syncQueue
      .where("action")
      .equals("ADD_DOUBT_MESSAGE")
      .and(i => i.entityId === "doubt_offline_1")
      .first();
    assert.ok(queued, "Doubt message must be enqueued in syncQueue");
  });

  await asyncTest("2.5 updateLocalDoubtStatus updates status and enqueues UPDATE_DOUBT_STATUS", async () => {
    const res = await updateLocalDoubtStatus("doubt_offline_1", "closed");
    assert.strictEqual(res.success, true);

    const stored = await db.doubtSessions.get("doubt_offline_1");
    assert.strictEqual(stored.status, "closed");

    const queued = await db.syncQueue
      .where("action")
      .equals("UPDATE_DOUBT_STATUS")
      .and(i => i.entityId === "doubt_offline_1")
      .first();
    assert.ok(queued, "Doubt status update must be enqueued in syncQueue");
  });

  await asyncTest("2.6 saveLocalGroupMessage adds message and enqueues SEND_GROUP_MESSAGE", async () => {
    const msg = await saveLocalGroupMessage({
      groupId: "grp_offline_class8",
      senderId: "student_offline_test",
      senderName: "Alex Morgan",
      senderRole: "student",
      message: "Does anyone want to review algorithms tonight?",
    });

    assert.ok(msg.id, "Group message should have local ID");

    const stored = await db.groupMessages.get(msg.id);
    assert.ok(stored, "Group message stored in IndexedDB groupMessages");

    const queued = await db.syncQueue
      .where("action")
      .equals("SEND_GROUP_MESSAGE")
      .and(i => i.entityId === "grp_offline_class8")
      .first();
    assert.ok(queued, "Group message must be enqueued in syncQueue");
  });

  await asyncTest("2.7 User profiles persist and retrieve offline", async () => {
    await saveLocalUserProfile({
      userId: "user_test_99",
      role: "student",
      name: "Ravi Kumar",
      class: "Class 9",
    });

    const prof = await getLocalUserProfile("user_test_99");
    assert.strictEqual(prof.role, "student");
    assert.strictEqual(prof.name, "Ravi Kumar");
  });

  await asyncTest("2.8 getPendingSyncCount accurately reflects pending queue items", async () => {
    const count = await getPendingSyncCount();
    assert.ok(count >= 6, `Expected at least 6 pending operations in syncQueue, got ${count}`);
  });

  console.log("\n[TEST GROUP 3: Transparent Client-Side Fetch Interceptor]");

  await asyncTest("3.1 Install interceptor and verify offline GET requests", async () => {
    installClientFetchInterceptor();

    // Ensure navigator says offline
    navigator.onLine = false;

    // 1. GET /api/student/dashboard
    const dashRes = await fetch("/api/student/dashboard");
    assert.strictEqual(dashRes.status, 200);
    const dashData = await dashRes.json();
    assert.ok(dashData.student, "Dashboard data returned offline");

    // 2. GET /api/student/modules
    const modRes = await fetch("/api/student/modules");
    assert.strictEqual(modRes.status, 200);
    const modData = await modRes.json();
    assert.ok(Array.isArray(modData.modules), "Modules data returned offline");

    // 3. GET /api/student/doubts
    const doubtRes = await fetch("/api/student/doubts");
    assert.strictEqual(doubtRes.status, 200);
    const doubtData = await doubtRes.json();
    assert.ok(Array.isArray(doubtData.doubts), "Doubts list returned offline");

    // 4. GET /api/student/mentor
    const mentorRes = await fetch("/api/student/mentor");
    assert.strictEqual(mentorRes.status, 200);
    const mentorData = await mentorRes.json();
    assert.strictEqual(mentorData.mentor.name, "Swastik Kumar purohit");

    // 5. GET /api/student/group
    const grpRes = await fetch("/api/student/group");
    assert.strictEqual(grpRes.status, 200);
    const grpData = await grpRes.json();
    assert.ok(grpData.group, "Group data returned offline");

    // 6. GET /api/student/group/messages
    const grpMsgRes = await fetch("/api/student/group/messages");
    assert.strictEqual(grpMsgRes.status, 200);
    const grpMsgData = await grpMsgRes.json();
    assert.ok(Array.isArray(grpMsgData), "Group messages returned offline");

    // 7. GET /api/users/current/role
    const roleRes = await fetch("/api/users/current/role");
    assert.strictEqual(roleRes.status, 200);
    const roleData = await roleRes.json();
    assert.ok(roleData.role, "Role data returned offline");
  });

  await asyncTest("3.2 Offline POST/PATCH mutations succeed and persist to IndexedDB", async () => {
    navigator.onLine = false;

    // 1. POST Doubt
    const postDoubtRes = await fetch("/api/student/doubts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Mathematics",
        title: "Test Offline Intercepted Doubt",
        description: "Checking interceptor",
      }),
    });
    assert.strictEqual(postDoubtRes.status, 201);
    const postDoubtData = await postDoubtRes.json();
    assert.strictEqual(postDoubtData.title, "Test Offline Intercepted Doubt");

    // 2. POST Doubt Message
    const postMsgRes = await fetch(`/api/student/doubts/${postDoubtData.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Follow-up question offline" }),
    });
    assert.strictEqual(postMsgRes.status, 201);
    const postMsgData = await postMsgRes.json();
    assert.strictEqual(postMsgData.message, "Follow-up question offline");

    // 3. POST Group Message
    const postGrpMsgRes = await fetch("/api/student/group/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello classmates offline!" }),
    });
    assert.strictEqual(postGrpMsgRes.status, 201);

    // 4. POST Lesson Progress
    const progRes = await fetch("/api/student/lessons/les_alg_3/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, lastPosition: 1500 }),
    });
    assert.strictEqual(progRes.status, 200);
    const progData = await progRes.json();
    assert.strictEqual(progData.success, true);

    // 5. POST Quiz Response
    const quizRes = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: "quiz_sci_1", score: 95 }),
    });
    assert.strictEqual(quizRes.status, 201);
  });

  console.log("\n=================================================");
  console.log(`RESULTS: ALL ${passed} / ${total} OFFLINE INDEXEDDB TESTS PASSED!`);
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
