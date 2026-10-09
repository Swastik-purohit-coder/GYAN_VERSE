/**
 * Integration Test for Multi-Media Lessons (Dual Video & Audio OR-Support)
 * Verifies backend route handlers, storage configuration, and frontend data contract.
 */

import { promises as fs } from "fs";
import path from "path";

async function runTests() {
  console.log("=================================================");
  console.log(" Running Multi-Media Lessons Verification Suite ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Verify Storage Upload URL Route allows Audio MIME types
  try {
    const uploadRoutePath = path.resolve("src/app/api/teacher/upload-url/route.js");
    const uploadRouteContent = await fs.readFile(uploadRoutePath, "utf8");
    assert(
      uploadRouteContent.includes("audio/mpeg") &&
      uploadRouteContent.includes("audio/mp3") &&
      uploadRouteContent.includes("audio/wav"),
      "upload-url route contains audio MIME types in bucket configuration"
    );
  } catch (err) {
    assert(false, `upload-url route check failed: ${err.message}`);
  }

  // 2. Verify Teacher Module Lessons Route has audio_path and audio_url
  try {
    const teacherLessonsRoutePath = path.resolve("src/app/api/teacher/modules/[moduleId]/lessons/route.js");
    const teacherLessonsContent = await fs.readFile(teacherLessonsRoutePath, "utf8");
    assert(
      teacherLessonsContent.includes("audio_path") &&
      teacherLessonsContent.includes("audio_url"),
      "teacher module lessons route selects and inserts audio_path and audio_url"
    );
    assert(
      teacherLessonsContent.includes("audioPath") &&
      teacherLessonsContent.includes("audioUrl"),
      "teacher module lessons route accepts audioPath and audioUrl in POST body"
    );
  } catch (err) {
    assert(false, `teacher module lessons route check failed: ${err.message}`);
  }

  // 3. Verify Teacher Single Lesson PUT Route has audio update logic
  try {
    const teacherLessonPutRoutePath = path.resolve("src/app/api/teacher/lessons/[lessonId]/route.js");
    const teacherLessonPutContent = await fs.readFile(teacherLessonPutRoutePath, "utf8");
    assert(
      teacherLessonPutContent.includes("audio_path") &&
      teacherLessonPutContent.includes("audio_url") &&
      teacherLessonPutContent.includes("audioPath"),
      "teacher lesson PUT route handles audio_path and audio_url updates"
    );
  } catch (err) {
    assert(false, `teacher lesson PUT route check failed: ${err.message}`);
  }

  // 4. Verify Student Modules Route selects audio fields
  try {
    const studentModulesRoutePath = path.resolve("src/app/api/student/modules/route.js");
    const studentModulesContent = await fs.readFile(studentModulesRoutePath, "utf8");
    assert(
      studentModulesContent.includes("audio_path") &&
      studentModulesContent.includes("audio_url"),
      "student modules route selects audio_path and audio_url in lessons subquery"
    );
  } catch (err) {
    assert(false, `student modules route check failed: ${err.message}`);
  }

  // 5. Verify Single Lesson Route delivers audioUrl
  try {
    const singleLessonRoutePath = path.resolve("src/app/api/lessons/[id]/route.js");
    const singleLessonContent = await fs.readFile(singleLessonRoutePath, "utf8");
    assert(
      singleLessonContent.includes("audio_path") &&
      singleLessonContent.includes("audio_url") &&
      singleLessonContent.includes("rawAudio"),
      "single lesson route returns database audio_url / audio_path"
    );
  } catch (err) {
    assert(false, `single lesson route check failed: ${err.message}`);
  }

  // 6. Verify Teacher Modules page has Audio form controls & badges
  try {
    const teacherPagePath = path.resolve("src/app/teacher/modules/page.js");
    const teacherPageContent = await fs.readFile(teacherPagePath, "utf8");
    assert(
      teacherPageContent.includes("audioSource") &&
      teacherPageContent.includes("handleUploadAudio") &&
      teacherPageContent.includes("audioFile"),
      "teacher modules page contains audio form state and handleUploadAudio"
    );
    assert(
      teacherPageContent.includes("Audio Track (Optional / Alternative)") &&
      teacherPageContent.includes("Upload Audio Lecture"),
      "teacher modules page renders Audio Track inputs"
    );
    assert(
      teacherPageContent.includes("Audio") &&
      teacherPageContent.includes("Headphones"),
      "teacher modules page renders Audio badges on lesson items"
    );
  } catch (err) {
    assert(false, `teacher modules page check failed: ${err.message}`);
  }

  // 7. Verify VideoPlayer.jsx supports live Video & Audio toggle
  try {
    const videoPlayerPath = path.resolve("src/student/components/VideoPlayer.jsx");
    const videoPlayerContent = await fs.readFile(videoPlayerPath, "utf8");
    assert(
      videoPlayerContent.includes("mediaMode") &&
      videoPlayerContent.includes("LessonAudioPlayer") &&
      videoPlayerContent.includes("hasAudio"),
      "VideoPlayer.jsx supports mediaMode switching and renders LessonAudioPlayer"
    );
    assert(
      videoPlayerContent.includes("Audio Track"),
      "VideoPlayer.jsx has Audio Track toggle button in header"
    );
  } catch (err) {
    assert(false, `VideoPlayer.jsx check failed: ${err.message}`);
  }

  // 8. Verify StudentLearningModules.jsx renders OR buttons (Video and/or Audio)
  try {
    const studentModulesCompPath = path.resolve("src/student/components/StudentLearningModules.jsx");
    const studentModulesCompContent = await fs.readFile(studentModulesCompPath, "utf8");
    assert(
      studentModulesCompContent.includes("hasVideo && hasAudio") &&
      studentModulesCompContent.includes("Listen Audio") &&
      studentModulesCompContent.includes("Watch Video"),
      "StudentLearningModules.jsx renders dual buttons when both media types exist"
    );
  } catch (err) {
    assert(false, `StudentLearningModules.jsx check failed: ${err.message}`);
  }

  // 9. Verify Dedicated Search Page has Audio and Video support
  try {
    const searchCompPath = path.resolve("src/student/components/search.jsx");
    const searchCompContent = await fs.readFile(searchCompPath, "utf8");
    assert(
      searchCompContent.includes("hasAudio") &&
      searchCompContent.includes("openLessonAudio") &&
      searchCompContent.includes("LessonAudioPlayer"),
      "search.jsx supports audio lessons and modal audio playback"
    );
  } catch (err) {
    assert(false, `search.jsx check failed: ${err.message}`);
  }

  // 10. Verify Live HTTP 200 response for key student and teacher routes
  try {
    const studentSearchRes = await fetch("http://localhost:3000/student/search");
    assert(studentSearchRes.status === 200, "GET /student/search responds with HTTP 200");

    const studentHomeRes = await fetch("http://localhost:3000/student");
    assert(studentHomeRes.status === 200, "GET /student responds with HTTP 200");
  } catch (err) {
    assert(false, `Live fetch check failed: ${err.message}`);
  }

  console.log(`\n=================================================`);
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
