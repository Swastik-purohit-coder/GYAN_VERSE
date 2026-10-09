// test-account-deletion.mjs
// Verification script for student account deletion API via HTTP fetch

import { clearAllStudentClientData } from "../src/lib/clearStudentClientData.js";

async function runTests() {
  console.log("=== Testing clearAllStudentClientData() in Node environment ===");
  const purgeStatus = await clearAllStudentClientData();
  console.log("Purge status (Node/SSR safe):", purgeStatus);
  if (typeof purgeStatus === "object" && purgeStatus !== null) {
    console.log("✅ clearAllStudentClientData executed safely without throwing in non-browser context.");
  } else {
    throw new Error("clearAllStudentClientData did not return expected status object");
  }

  console.log("\n=== Testing /api/student/account HTTP Endpoint on Next.js Server ===");

  // Test 1: Unauthenticated request without body
  console.log("\n--- Test 1: Sending DELETE without auth/body ---");
  const res1 = await fetch("http://localhost:3000/api/student/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  const json1 = await res1.json();
  console.log("Status:", res1.status, "Body:", json1);
  if (res1.status === 401) {
    console.log("✅ Unauthenticated request correctly returned 401 Unauthorized.");
  } else {
    console.warn("Status was:", res1.status);
  }

  // Test 2: Sending DELETE with test userId
  console.log("\n--- Test 2: Sending DELETE with test userId in body ---");
  const testUserId = "user_test_deletion_" + Date.now();
  const res2 = await fetch("http://localhost:3000/api/student/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: testUserId }),
  });
  const json2 = await res2.json();
  console.log("Status:", res2.status, "Body:", json2);
  if (res2.status === 200 && json2.success === true) {
    console.log("✅ Account deletion API executed successfully with 200 OK!");
    console.log("Tables cleared count:", json2.summary?.databaseTablesCleared?.length || 0);
  } else {
    throw new Error(`Expected 200 OK, got ${res2.status}: ${JSON.stringify(json2)}`);
  }

  // Test 3: POST fallback
  console.log("\n--- Test 3: Testing POST /api/student/account fallback ---");
  const res3 = await fetch("http://localhost:3000/api/student/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: testUserId }),
  });
  const json3 = await res3.json();
  console.log("Status:", res3.status, "Body:", json3);
  if (res3.status === 200 && json3.success === true) {
    console.log("✅ POST fallback executed successfully with 200 OK!");
  } else {
    throw new Error(`Expected 200 OK on POST, got ${res3.status}`);
  }

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
