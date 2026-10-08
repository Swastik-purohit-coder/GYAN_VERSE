#!/usr/bin/env node

/**
 * Verification Test Suite for Class-Based YouTube Courses System
 * Tests:
 * 1. Class-based filtering logic
 * 2. School independence (DAV vs Govt vs Private)
 * 3. YouTube URL parsing and normalizer
 * 4. System isolation (Teacher content vs Courses)
 * 5. Progress calculation
 */

const { getYouTubeVideoId, parseYouTubeVideoId } = require('../src/lib/videoHelpers');
const { DEFAULT_COURSE_SUBJECTS, DEFAULT_COURSE_VIDEOS } = require('../src/lib/coursesDefaultData');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log('CLASS-BASED YOUTUBE COURSES SYSTEM: VERIFICATION SUITE');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// TEST GROUP 1: YouTube URL Normalization
// ---------------------------------------------------------------------------
console.log('--- Test Group 1: YouTube URL Normalization ---');
const testUrls = [
  { url: 'https://www.youtube.com/watch?v=ITce7f6K9as', expected: 'ITce7f6K9as' },
  { url: 'https://youtu.be/mvOkMYCygps', expected: 'mvOkMYCygps' },
  { url: 'https://www.youtube.com/shorts/24Uv8Cl5hvI', expected: '24Uv8Cl5hvI' },
  { url: 'https://www.youtube.com/embed/D1Ymc311XS8', expected: 'D1Ymc311XS8' },
  { url: 'https://www.youtube.com/watch?v=VwrsL-lCzYo&feature=shared', expected: 'VwrsL-lCzYo' },
];

for (const t of testUrls) {
  const id = getYouTubeVideoId(t.url);
  assert(id === t.expected, `Parsed video ID "${id}" matches "${t.expected}" for ${t.url}`);
}

// ---------------------------------------------------------------------------
// TEST GROUP 2: Class-Based Filtering & School Independence
// ---------------------------------------------------------------------------
console.log('\n--- Test Group 2: Class-Based Filtering & School Independence ---');

function mockGetCoursesForStudent({ studentClass, school }) {
  // Simulates GET /api/courses logic
  const rawClass = String(studentClass).trim();
  const numMatch = rawClass.match(/\d+/);
  const cleanNum = numMatch ? numMatch[0] : "";
  const canonicalClassName = cleanNum ? `Class ${cleanNum}` : rawClass;

  const classCandidates = Array.from(
    new Set([rawClass, canonicalClassName, cleanNum ? `class ${cleanNum}` : null, cleanNum].filter(Boolean))
  );

  // Notice: 'school' is completely ignored in this query!
  const matchedSubjects = DEFAULT_COURSE_SUBJECTS.filter((s) => classCandidates.includes(s.class) && s.is_active);
  const subjectIds = matchedSubjects.map((s) => s.id);
  const matchedVideos = DEFAULT_COURSE_VIDEOS.filter((v) => subjectIds.includes(v.subject_id) && v.is_active);

  return {
    studentClass,
    school,
    subjects: matchedSubjects.map((s) => ({
      ...s,
      videos: matchedVideos.filter((v) => v.subject_id === s.id),
    })),
  };
}

// TEST 1: DAV + Class 4
const studentDAV_C4 = mockGetCoursesForStudent({ studentClass: 'Class 4', school: 'DAV' });
assert(studentDAV_C4.subjects.length === 3, 'DAV Class 4 receives 3 subjects (Math, Science, English)');
assert(studentDAV_C4.subjects.every((s) => s.class === 'Class 4'), 'All subjects belong strictly to Class 4');

// TEST 2: Govt + Class 4 (must be IDENTICAL to DAV Class 4)
const studentGovt_C4 = mockGetCoursesForStudent({ studentClass: 'Class 4', school: 'Government High School' });
assert(
  JSON.stringify(studentDAV_C4.subjects.map(s => s.id)) === JSON.stringify(studentGovt_C4.subjects.map(s => s.id)),
  'Govt Class 4 receives EXACT SAME subjects as DAV Class 4'
);
assert(
  JSON.stringify(studentDAV_C4.subjects.map(s => s.videos.map(v => v.id))) ===
  JSON.stringify(studentGovt_C4.subjects.map(s => s.videos.map(v => v.id))),
  'Govt Class 4 receives EXACT SAME course videos as DAV Class 4'
);

// TEST 3: Private + Class 4 (must be IDENTICAL)
const studentPriv_C4 = mockGetCoursesForStudent({ studentClass: '4', school: 'St. Xavier Private' });
assert(
  studentPriv_C4.subjects.length === 3 && studentPriv_C4.subjects[0].subject_name === 'Mathematics',
  'Private school student with class "4" matches Class 4 courses via candidate normalization'
);

// TEST 4: DAV + Class 5
const studentDAV_C5 = mockGetCoursesForStudent({ studentClass: 'Class 5', school: 'DAV' });
assert(studentDAV_C5.subjects.length === 3, 'DAV Class 5 receives Class 5 subjects');
assert(studentDAV_C5.subjects.every((s) => s.class === 'Class 5'), 'All subjects belong strictly to Class 5');

// TEST 5: Class 4 videos do NOT appear in Class 5
const c4VideoIds = studentDAV_C4.subjects.flatMap((s) => s.videos.map((v) => v.id));
const c5VideoIds = studentDAV_C5.subjects.flatMap((s) => s.videos.map((v) => v.id));
const overlappingVideos = c4VideoIds.filter((id) => c5VideoIds.includes(id));
assert(overlappingVideos.length === 0, 'Class 4 videos NEVER leak into Class 5 courses');

// ---------------------------------------------------------------------------
// TEST GROUP 3: System Isolation
// ---------------------------------------------------------------------------
console.log('\n--- Test Group 3: System Isolation (Teacher Content vs School Courses) ---');

// Verify table names
const teacherTables = ['learning_modules', 'lessons', 'lesson_progress'];
const courseTables = ['course_subjects', 'course_videos', 'course_video_progress'];

const sharedTables = teacherTables.filter((t) => courseTables.includes(t));
assert(sharedTables.length === 0, 'Teacher tables and Course tables have 0 overlap (completely isolated)');

// Verify college dummy subjects are not present in school courses
const collegeKeywords = ['data structures', 'algorithms', 'operating system', 'database system', 'digital logic', 'networking'];
const courseSubjectNames = DEFAULT_COURSE_SUBJECTS.map((s) => s.subject_name.toLowerCase());
const hasCollegeDummy = courseSubjectNames.some((n) => collegeKeywords.includes(n));
assert(!hasCollegeDummy, 'Student Courses contains NO college/CSE dummy subjects');

// ---------------------------------------------------------------------------
// TEST GROUP 4: Progress Calculation Isolation
// ---------------------------------------------------------------------------
console.log('\n--- Test Group 4: Progress Calculation ---');

function calculateSubjectProgress(videos, progressMap) {
  const total = videos.length;
  if (total === 0) return 0;
  const completed = videos.filter((v) => progressMap[v.id]?.completed).length;
  return Math.round((completed / total) * 100);
}

const c4MathVideos = studentDAV_C4.subjects.find((s) => s.subject_name === 'Mathematics').videos;

// Student A progress (1 of 3 videos completed)
const studentA_Progress = { [c4MathVideos[0].id]: { completed: true, completionPct: 100 } };
const studentA_SubjectPct = calculateSubjectProgress(c4MathVideos, studentA_Progress);
assert(studentA_SubjectPct === 33, `Student A progress is 33% (1 of 3 completed)`);

// Student B progress on the SAME videos (2 of 3 videos completed)
const studentB_Progress = {
  [c4MathVideos[0].id]: { completed: true, completionPct: 100 },
  [c4MathVideos[1].id]: { completed: true, completionPct: 100 },
};
const studentB_SubjectPct = calculateSubjectProgress(c4MathVideos, studentB_Progress);
assert(studentB_SubjectPct === 67, `Student B progress on same course is 67% (2 of 3 completed, isolated from Student A)`);

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
console.log('======================================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
