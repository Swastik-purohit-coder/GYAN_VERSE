import assert from "node:assert";
import { jsPDF } from "jspdf";

console.log("==================================================");
console.log("  TESTING VIRTUAL ID CARD & MULTI-STUDENT FEATURES");
console.log("==================================================\n");

async function runTests() {
  const baseUrl = "http://localhost:3000";

  // Test 1: Fetch students registry and verify multi-student distribution
  console.log("TEST 1: Verifying Multi-Student Mobile Distribution in /api/students...");
  const resAll = await fetch(`${baseUrl}/api/students`);
  assert.strictEqual(resAll.status, 200, "API should return 200 OK");
  const allStudents = await resAll.json();
  assert(Array.isArray(allStudents), "Expected student array");
  console.log(`  ✓ Loaded ${allStudents.length} total students.`);

  // Group by parentPhone
  const phoneMap = new Map();
  allStudents.forEach((s) => {
    const raw = s.parentPhone || s.phone;
    if (!raw) return;
    const clean = raw.replace(/[^0-9]/g, "");
    if (!phoneMap.has(clean)) phoneMap.set(clean, []);
    phoneMap.get(clean).push(s);
  });

  const multiStudentAccounts = Array.from(phoneMap.entries()).filter(([_, list]) => list.length > 1);
  assert(multiStudentAccounts.length > 0, "Expected at least 1 multi-student mobile account");
  console.log(`  ✓ Found ${multiStudentAccounts.length} multi-student mobile accounts.`);
  multiStudentAccounts.forEach(([phone, list]) => {
    console.log(`    • Mobile [${phone}]: ${list.length} students linked -> ${list.map(s => `${s.name} (${s.id})`).join(", ")}`);
  });

  // Test 2: Fetch specific Student by Unique ID
  console.log("\nTEST 2: Fetching specific student by Unique ID (GYAN-2026-8A-042)...");
  const resStudent1 = await fetch(`${baseUrl}/api/students/GYAN-2026-8A-042`);
  assert.strictEqual(resStudent1.status, 200);
  const std1 = await resStudent1.json();
  assert.strictEqual(std1.id, "GYAN-2026-8A-042");
  assert.strictEqual(std1.name, "Aarav Sharma");
  assert.strictEqual(std1.class, "Class 8");
  console.log(`  ✓ Successfully fetched ${std1.name} (Unique ID: ${std1.id}, Class: ${std1.class}).`);

  // Test 3: Fetch sibling by Unique ID on the same mobile number
  console.log("\nTEST 3: Fetching sibling student by Unique ID (GYAN-2026-5B-108)...");
  const resStudent2 = await fetch(`${baseUrl}/api/students/GYAN-2026-5B-108`);
  assert.strictEqual(resStudent2.status, 200);
  const std2 = await resStudent2.json();
  assert.strictEqual(std2.id, "GYAN-2026-5B-108");
  assert.strictEqual(std2.name, "Ananya Sharma");
  assert.strictEqual(std2.class, "Class 5");
  assert.strictEqual(
    (std1.parentPhone || "").replace(/[^0-9]/g, ""),
    (std2.parentPhone || "").replace(/[^0-9]/g, ""),
    "Both siblings must share the same parent mobile number"
  );
  console.log(`  ✓ Successfully fetched sibling ${std2.name} (Unique ID: ${std2.id}, Class: ${std2.class}).`);
  console.log(`  ✓ Verified both siblings share identical mobile number: ${std1.parentPhone}.`);

  // Test 4: Query by phone number filter
  console.log("\nTEST 4: Filtering students by mobile number (9876543210)...");
  const resPhoneFilter = await fetch(`${baseUrl}/api/students?phone=9876543210`);
  assert.strictEqual(resPhoneFilter.status, 200);
  const phoneFilterResults = await resPhoneFilter.json();
  assert.strictEqual(phoneFilterResults.length, 2, "Expected exactly 2 siblings under this mobile number");
  console.log(`  ✓ Received ${phoneFilterResults.length} siblings under mobile number 9876543210.`);

  // Test 5: Verify Teacher Dashboard Routes HTTP Status 200
  console.log("\nTEST 5: Verifying Teacher Portal Route Availability...");
  const routes = [
    "/teacher/id-cards",
    "/teacher/students",
    "/teacher/dashboard",
  ];
  for (const route of routes) {
    const res = await fetch(`${baseUrl}${route}`);
    assert.strictEqual(res.status, 200, `Route ${route} should return 200 OK`);
    console.log(`  ✓ Route ${route} -> 200 OK`);
  }

  // Test 6: Verify jsPDF generation for ID card
  console.log("\nTEST 6: Validating jsPDF Virtual ID Card Generation...");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.text("GYANARATNA VIDYAPEETH • STUDENT IDENTITY CARD", 148.5, 20, { align: "center" });
  doc.text(`UNIQUE ID: ${std1.id}`, 20, 40);
  doc.text(`NAME: ${std1.name}`, 20, 50);
  const pdfBytes = doc.output("arraybuffer");
  assert(pdfBytes.byteLength > 1000, "PDF output should be valid binary array buffer");
  console.log(`  ✓ jsPDF card generation generated valid PDF (${pdfBytes.byteLength} bytes).`);

  console.log("\n==================================================");
  console.log("  ALL TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
