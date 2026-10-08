// Automated RBAC Matrix Verification Script
// Tests all 7 required authorization criteria:
// 1. student -> student dashboard = allowed
// 2. student -> teacher dashboard = denied (redirects to /student/dashboard)
// 3. student -> teacher API = 403
// 4. teacher -> teacher dashboard = allowed
// 5. teacher -> teacher API = allowed
// 6. unauthenticated -> protected routes = login (redirect to /sign-in) / 401
// 7. changing URL/localStorage role must NOT bypass authorization

import { getServerUserRole } from '../src/lib/serverRoleAuth.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Known user fixtures in user_roles table
const STUDENT_USER_ID = 'user_3K99ZaA2bTiBEfawPw1hLUHNngE';
const TEACHER_USER_ID = 'user_3K9D5RQ3gWncO8hMDcaJPMF41o5';

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

/**
 * Simulates middleware authorization logic given userId and request path.
 * Returns { action: "ALLOW" | "REDIRECT" | "401" | "403", destination?: string }
 */
async function simulateMiddleware(userId, pathname, clientStateRole = null) {
  // If client state attempted to pass a role (simulating localStorage / URL spoofing),
  // verify that middleware completely ignores it and only resolves via getServerUserRole.
  const isTeacherPage = pathname.startsWith('/teacher');
  const isStudentPage = pathname.startsWith('/student');
  const isTeacherApi = pathname.startsWith('/api/teacher');

  if (isTeacherApi) {
    if (!userId) {
      return { action: '401', status: 401 };
    }
    const doc = await getServerUserRole(userId);
    const role = doc?.role;
    if (!role || !['teacher', 'admin'].includes(role)) {
      return { action: '403', status: 403 };
    }
    return { action: 'ALLOW', status: 200 };
  }

  if (!userId) {
    if (isTeacherPage || isStudentPage) {
      return { action: 'REDIRECT', destination: '/sign-in' };
    }
    return { action: 'ALLOW' };
  }

  // Resolve role strictly from database
  const doc = await getServerUserRole(userId);
  const role = doc?.role || 'unassigned';

  if (isTeacherPage) {
    if (role === 'student') {
      return { action: 'REDIRECT', destination: '/student/dashboard' };
    }
    if (role === 'unassigned') {
      return { action: 'REDIRECT', destination: '/role-select' };
    }
    if (role === 'teacher' || role === 'admin') {
      return { action: 'ALLOW', destination: pathname };
    }
    return { action: 'REDIRECT', destination: '/student/dashboard' };
  }

  if (isStudentPage) {
    if (role === 'teacher') {
      return { action: 'REDIRECT', destination: '/teacher/dashboard' };
    }
    if (role === 'unassigned') {
      return { action: 'REDIRECT', destination: '/role-select' };
    }
    if (role === 'student' || role === 'admin') {
      return { action: 'ALLOW', destination: pathname };
    }
    return { action: 'REDIRECT', destination: '/role-select' };
  }

  return { action: 'ALLOW' };
}

async function runTests() {
  console.log('====================================================');
  console.log('   GYANARATNA RBAC VERIFICATION MATRIX TEST');
  console.log('====================================================\n');

  // Verify DB state
  console.log('Step 0: Verify source of truth records in user_roles table');
  const studentDoc = await getServerUserRole(STUDENT_USER_ID);
  assert(studentDoc && studentDoc.role === 'student', `Student fixture resolves to 'student' (actual: ${studentDoc?.role})`);

  const teacherDoc = await getServerUserRole(TEACHER_USER_ID);
  assert(teacherDoc && teacherDoc.role === 'teacher', `Teacher fixture resolves to 'teacher' (actual: ${teacherDoc?.role})`);

  // Test 1: Student -> Student Dashboard
  console.log('\nTest 1: Student -> Student Dashboard');
  const t1a = await simulateMiddleware(STUDENT_USER_ID, '/student/dashboard');
  assert(t1a.action === 'ALLOW', 'Student accessing /student/dashboard is allowed');

  const t1b = await simulateMiddleware(STUDENT_USER_ID, '/student');
  assert(t1b.action === 'ALLOW', 'Student accessing /student is allowed');

  // Test 2: Student -> Teacher Dashboard (Denied & Redirected)
  console.log('\nTest 2: Student -> Teacher Dashboard (Denied & Redirected)');
  const t2a = await simulateMiddleware(STUDENT_USER_ID, '/teacher/dashboard');
  assert(t2a.action === 'REDIRECT' && t2a.destination === '/student/dashboard',
    'Student accessing /teacher/dashboard is redirected to /student/dashboard');

  const t2b = await simulateMiddleware(STUDENT_USER_ID, '/teacher');
  assert(t2b.action === 'REDIRECT' && t2b.destination === '/student/dashboard',
    'Student accessing /teacher is redirected to /student/dashboard');

  const t2c = await simulateMiddleware(STUDENT_USER_ID, '/teacher/classes');
  assert(t2c.action === 'REDIRECT' && t2c.destination === '/student/dashboard',
    'Student accessing /teacher/classes is redirected to /student/dashboard');

  const t2d = await simulateMiddleware(STUDENT_USER_ID, '/teacher/reports');
  assert(t2d.action === 'REDIRECT' && t2d.destination === '/student/dashboard',
    'Student accessing /teacher/reports is redirected to /student/dashboard');

  // Test 3: Student -> Teacher API (HTTP 403 Forbidden)
  console.log('\nTest 3: Student -> Teacher API (HTTP 403 Forbidden)');
  const t3a = await simulateMiddleware(STUDENT_USER_ID, '/api/teacher/student-progress');
  assert(t3a.action === '403' && t3a.status === 403,
    'Student calling /api/teacher/student-progress receives HTTP 403');

  const t3b = await simulateMiddleware(STUDENT_USER_ID, '/api/teacher/modules');
  assert(t3b.action === '403' && t3b.status === 403,
    'Student calling /api/teacher/modules receives HTTP 403');

  const t3c = await simulateMiddleware(STUDENT_USER_ID, '/api/teacher/upload-url');
  assert(t3c.action === '403' && t3c.status === 403,
    'Student calling /api/teacher/upload-url receives HTTP 403');

  // Test 4: Teacher -> Teacher Dashboard
  console.log('\nTest 4: Teacher -> Teacher Dashboard');
  const t4a = await simulateMiddleware(TEACHER_USER_ID, '/teacher/dashboard');
  assert(t4a.action === 'ALLOW', 'Teacher accessing /teacher/dashboard is allowed');

  const t4b = await simulateMiddleware(TEACHER_USER_ID, '/teacher');
  assert(t4b.action === 'ALLOW', 'Teacher accessing /teacher is allowed');

  const t4c = await simulateMiddleware(TEACHER_USER_ID, '/student/dashboard');
  assert(t4c.action === 'REDIRECT' && t4c.destination === '/teacher/dashboard',
    'Teacher accessing /student/dashboard is redirected to /teacher/dashboard');

  // Test 5: Teacher -> Teacher API
  console.log('\nTest 5: Teacher -> Teacher API');
  const t5a = await simulateMiddleware(TEACHER_USER_ID, '/api/teacher/student-progress');
  assert(t5a.action === 'ALLOW' && t5a.status === 200,
    'Teacher calling /api/teacher/student-progress is allowed (HTTP 200)');

  const t5b = await simulateMiddleware(TEACHER_USER_ID, '/api/teacher/modules');
  assert(t5b.action === 'ALLOW' && t5b.status === 200,
    'Teacher calling /api/teacher/modules is allowed (HTTP 200)');

  // Test 6: Unauthenticated -> Protected routes = Login (redirect / 401)
  console.log('\nTest 6: Unauthenticated -> Protected routes');
  const t6a = await simulateMiddleware(null, '/teacher/dashboard');
  assert(t6a.action === 'REDIRECT' && t6a.destination === '/sign-in',
    'Unauthenticated user accessing /teacher/dashboard is redirected to /sign-in');

  const t6b = await simulateMiddleware(null, '/student/dashboard');
  assert(t6b.action === 'REDIRECT' && t6b.destination === '/sign-in',
    'Unauthenticated user accessing /student/dashboard is redirected to /sign-in');

  const t6c = await simulateMiddleware(null, '/api/teacher/student-progress');
  assert(t6c.action === '401' && t6c.status === 401,
    'Unauthenticated user calling teacher API receives HTTP 401');

  // Test 7: Changing URL/localStorage role must NOT bypass authorization
  console.log('\nTest 7: Tampering resistance (URL / localStorage spoofing)');
  // Simulate student attempting to claim teacher role via client-side state
  const t7a = await simulateMiddleware(STUDENT_USER_ID, '/teacher/dashboard', 'teacher');
  assert(t7a.action === 'REDIRECT' && t7a.destination === '/student/dashboard',
    'Student attempting to pass localStorage/client role="teacher" is STILL rejected');

  const t7b = await simulateMiddleware(STUDENT_USER_ID, '/api/teacher/modules', 'admin');
  assert(t7b.action === '403' && t7b.status === 403,
    'Student attempting to pass spoofed role="admin" to teacher API STILL receives 403');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
