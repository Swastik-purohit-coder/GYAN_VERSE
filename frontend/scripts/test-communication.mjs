import http from "http";

const STUDENT_ID = "user_3K99ZaA2bTiBEfawPw1hLUHNngE";
const TEACHER_ID = "user_3K9D5RQ3gWncO8hMDcaJPMF41o5";
const ANOTHER_STUDENT_ID = "user_another_student_999";

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  return { status: res.status, data };
}

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING STUDENT COMMUNICATION FEATURE SUITE");
  console.log("==================================================");

  // 1. Unauthenticated requests rejected
  console.log("\n[1] Security & Authentication Guards");
  const unauth1 = await request("/api/student/mentor");
  assert(unauth1.status === 401, "Unauthenticated /api/student/mentor returns 401");

  const unauth2 = await request("/api/student/doubts");
  assert(unauth2.status === 401, "Unauthenticated /api/student/doubts returns 401");

  const unauth3 = await request("/api/teacher/doubts");
  assert(unauth3.status === 401, "Unauthenticated /api/teacher/doubts returns 401");

  // 2. Student Mentor
  console.log("\n[2] Feature: My Mentor");
  const mentorRes = await request("/api/student/mentor", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(mentorRes.status === 200, "Student can fetch assigned mentor");
  assert(Boolean(mentorRes.data?.mentor?.name), `Mentor name present: ${mentorRes.data?.mentor?.name}`);
  assert(!mentorRes.data?.mentor?.password, "Mentor password not exposed");
  assert(!mentorRes.data?.mentor?.secret, "Mentor secret keys not exposed");
  assert(Boolean(mentorRes.data?.mentor?.role), `Mentor role present: ${mentorRes.data?.mentor?.role}`);

  // 3. Student Doubts
  console.log("\n[3] Feature: My Doubt Sessions");
  const doubtsRes = await request("/api/student/doubts", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(doubtsRes.status === 200, "Student can fetch own doubts list");
  assert(Array.isArray(doubtsRes.data?.doubts), "Doubts is an array");

  // Create a new doubt
  const newDoubtRes = await request("/api/student/doubts", {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      subject: "Mathematics",
      title: "Why is 1/2 equal to 2/4?",
      description: "Need help understanding equivalence with geometric area models.",
    },
  });
  assert(newDoubtRes.status === 201, "Student can create a new doubt");
  const createdDoubtId = newDoubtRes.data?.id;
  assert(Boolean(createdDoubtId), `Created doubt ID: ${createdDoubtId}`);
  assert(newDoubtRes.data?.status === "open", "Initial doubt status is 'open'");

  // Fetch created doubt detail
  const encId = encodeURIComponent(createdDoubtId);
  const doubtDetail = await request(`/api/student/doubts/${encId}`, {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(doubtDetail.status === 200, "Student can fetch doubt session detail with messages");
  assert(doubtDetail.data?.title === "Why is 1/2 equal to 2/4?", "Doubt title matches");

  // 4. IDOR Protection: Another student cannot access this doubt
  console.log("\n[4] IDOR Security Verification");
  const idorRes = await request(`/api/student/doubts/${encId}`, {
    headers: { "x-user-id": ANOTHER_STUDENT_ID },
  });
  assert(idorRes.status === 403, "Another student is forbidden (403) from accessing private doubt");

  // 5. Student sends message in doubt thread
  console.log("\n[5] Doubt Chat Thread");
  const studentMsgRes = await request(`/api/student/doubts/${encId}/messages`, {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      message: "Also does this apply to negative fractions?",
    },
  });
  assert(studentMsgRes.status === 201, "Student can send message in doubt thread");

  // 6. Teacher Doubts & RBAC
  console.log("\n[6] Teacher Doubt Management & RBAC");
  const studentAsTeacher = await request("/api/teacher/doubts", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(studentAsTeacher.status === 403, "Student is rejected (403) from teacher doubts API");

  const teacherDoubts = await request("/api/teacher/doubts", {
    headers: { "x-user-id": TEACHER_ID },
  });
  assert(teacherDoubts.status === 200, "Teacher can view student doubts");
  assert(Array.isArray(teacherDoubts.data?.doubts), "Teacher doubts is an array");

  // Teacher replies to doubt
  const teacherReply = await request(`/api/teacher/doubts/${encId}/messages`, {
    method: "POST",
    headers: { "x-user-id": TEACHER_ID },
    body: {
      message: "Yes Swastik! (-1)/2 = (-2)/4 = -0.5. Equivalence holds identically for negative fractions.",
    },
  });
  assert(teacherReply.status === 201, "Teacher can reply to student doubt");
  assert(teacherReply.data?.sender_role === "teacher", "Reply sender role is teacher");

  // Teacher marks doubt answered
  const statusUpdate = await request(`/api/teacher/doubts/${encId}`, {
    method: "PATCH",
    headers: { "x-user-id": TEACHER_ID },
    body: { status: "answered" },
  });
  assert(statusUpdate.status === 200, "Teacher can update doubt status to 'answered'");

  // Verify student sees the teacher's reply
  const updatedDoubt = await request(`/api/student/doubts/${encId}`, {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(updatedDoubt.data?.status === "answered", "Student sees updated status 'answered'");
  const hasTeacherReply = updatedDoubt.data?.messages?.some((m) => m.sender_role === "teacher");
  assert(hasTeacherReply, "Student sees teacher reply in conversation history");

  // 7. My Group & Class Cohort
  console.log("\n[7] Feature: My Group (Class-Based Cohort)");
  const groupRes = await request("/api/student/group", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(groupRes.status === 200, "Student can fetch class-based group info");
  assert(Boolean(groupRes.data?.group?.name), `Group name: ${groupRes.data?.group?.name}`);
  assert(Boolean(groupRes.data?.group?.target_class), `Target class: ${groupRes.data?.group?.target_class}`);

  // Group messages
  const groupMsgs = await request("/api/student/group/messages", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(groupMsgs.status === 200, "Student can fetch class group messages");
  assert(Array.isArray(groupMsgs.data), "Group messages is an array");

  // Post message to group
  const postGroupMsg = await request("/api/student/group/messages", {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      message: "Hey everyone! Does anyone want to practice quiz questions together today?",
    },
  });
  assert(postGroupMsg.status === 201, "Student can post message to class group");

  // 8. Resource Sharing & Security Validation
  console.log("\n[8] Resource Sharing & Validation");
  // Test disallowed executable
  const exeUpload = await request("/api/student/group/resources", {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      file_name: "malicious_script.exe",
      file_type: "application/x-msdownload",
      file_size: 1024,
    },
  });
  assert(exeUpload.status === 400, "Executable .exe upload is blocked (400)");

  // Test oversized file > 25MB
  const largeUpload = await request("/api/student/group/resources", {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      file_name: "huge_video.mp4",
      file_type: "video/mp4",
      file_size: 50 * 1024 * 1024, // 50MB
    },
  });
  assert(largeUpload.status === 400, "Oversized file > 25MB is blocked (400)");

  // Test allowed PDF educational resource
  const validUpload = await request("/api/student/group/resources", {
    method: "POST",
    headers: { "x-user-id": STUDENT_ID },
    body: {
      file_name: "Fractions & Decimals Notes.pdf",
      file_type: "application/pdf",
      file_size: 2450000,
      file_url: "https://example.com/notes.pdf",
    },
  });
  assert(validUpload.status === 201, "Valid educational PDF resource is accepted (201)");

  // Fetch group resources
  const resourcesList = await request("/api/student/group/resources", {
    headers: { "x-user-id": STUDENT_ID },
  });
  assert(resourcesList.status === 200, "Student can fetch shared group resources");
  assert(Array.isArray(resourcesList.data?.resources), "Resources list is an array");

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
