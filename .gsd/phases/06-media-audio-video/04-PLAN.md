---
phase: 6
plan: 4
wave: 4
---

# Plan 6.4: Verification, Integration Testing & End-to-End Validation

## Objective
Verify the end-to-end flow of the dual Video & Audio feature: API route responses, teacher creation of audio and video lessons, student playback in both modes, and ensure no console errors or build regressions occur.

## Context
- `frontend/scripts/test-dual-media-lessons.mjs`
- `frontend/src/app/teacher/modules/page.js`
- `frontend/src/student/components/StudentLearningModules.jsx`
- `frontend/src/student/components/VideoPlayer.jsx`

## Tasks

<task type="auto">
  <name>Create Integration Test Script for Dual Media Lesson APIs</name>
  <files>frontend/scripts/test-dual-media-lessons.mjs</files>
  <action>
    - Test upload-url endpoint with audio MIME type.
    - Test lesson creation payload with audioUrl and videoUrl.
    - Test student modules lesson extraction ensuring both media fields are mapped correctly.
    - Run test script with node/mjs.
  </action>
  <verify>node frontend/scripts/test-dual-media-lessons.mjs passes with exit code 0</verify>
  <done>All API test cases pass successfully</done>
</task>

<task type="auto">
  <name>Browser Smoke Test on Teacher and Student Pages</name>
  <files>
    frontend/src/app/teacher/modules/page.js
    frontend/src/student/components/StudentLearningModules.jsx
  </files>
  <action>
    - Navigate to teacher modules page and check lesson form controls for audio and video.
    - Check student dashboard / learning modules page to ensure audio and video badges and play buttons render properly.
    - Verify that no Next.js hydration or runtime errors occur.
  </action>
  <verify>Inspect browser DOM and ensure zero errors in console logs</verify>
  <done>Smooth user experience verified on both teacher and student interfaces</done>
</task>

## Success Criteria
- [ ] Integration test script passes all checks
- [ ] No regression in existing video lessons
- [ ] Audio playback works seamlessly across devices
