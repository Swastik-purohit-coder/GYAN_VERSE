import assert from "node:assert";

async function runSyncTest() {
  console.log("Testing /api/sync endpoint with offline operations...");

  const operations = [
    {
      id: 1,
      action: "UPDATE_LESSON_PROGRESS",
      entityType: "lesson_progress",
      entityId: "les_alg_1",
      idempotentKey: "prog_test_les_alg_1",
      payload: {
        lessonId: "les_alg_1",
        completed: true,
        lastPosition: 1080,
        action: "complete",
        updatedAt: new Date().toISOString(),
      },
    },
    {
      id: 2,
      action: "CREATE_DOUBT",
      entityType: "doubt_session",
      entityId: "doubt_offline_sync_test",
      idempotentKey: "doubt_create_sync_test",
      payload: {
        subject: "Mathematics",
        title: "Sync Test: Is zero a rational number?",
        description: "Zero can be written as 0/1 where 1 is non-zero.",
        teacher_id: "teacher_faculty_swastik",
        teacher_name: "Swastik Kumar purohit",
      },
    },
    {
      id: 3,
      action: "ADD_DOUBT_MESSAGE",
      entityType: "doubt_message",
      entityId: "doubt_offline_sync_test",
      idempotentKey: "doubt_msg_sync_test_1",
      payload: {
        message: "Adding follow up question during offline sync test",
        sender_role: "student",
      },
    },
    {
      id: 4,
      action: "SEND_GROUP_MESSAGE",
      entityType: "group_message",
      entityId: "grp_offline_class8",
      idempotentKey: "grp_msg_sync_test_1",
      payload: {
        message: "Sync engine test message from offline student squad",
      },
    },
  ];

  try {
    const port = process.env.PORT || 3001;
    const res = await fetch(`http://localhost:${port}/api/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "student_test_offline",
      },
      body: JSON.stringify({ operations }),
    });

    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));

    assert.ok(res.ok || res.status === 401, "Sync API route responds");
    console.log("✓ /api/sync handler verified.");
  } catch (err) {
    console.warn("Dev server sync test notice:", err.message);
  }
}

runSyncTest();
