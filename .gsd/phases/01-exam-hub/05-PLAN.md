---
phase: 5
plan: 1
wave: 5
gap_closure: false
---

# Plan 5.1: Final End-to-End Verification & Milestone Documentation

## Objective
Resolve the route loading blocker where unauthenticated visitors were redirected to `/sign-in`, execute full end-to-end verification suites, confirm production compilation, and document the complete Class-Wise Examination Information & Recommendation System milestone.

## Context
Load these files for context:
- .gsd/SPEC.md
- frontend/src/middleware.js
- frontend/src/components/OfflineSafeAuthGuard.jsx
- frontend/src/app/student/exams/page.js
- frontend/src/app/exams/page.js
- frontend/test-recommendations.mjs
- frontend/test-offline-webapp.mjs

## Tasks

<task type="auto">
  <name>Resolve Route Loading Blocker & Add Public Access</name>
  <files>
    frontend/src/middleware.js
    frontend/src/components/OfflineSafeAuthGuard.jsx
    frontend/src/app/exams/page.js
    frontend/src/components/Header.js
  </files>
  <action>
    1. Update `frontend/src/middleware.js`:
       - Allow unauthenticated access to `/student/exams` and `/exams` so students, parents, and visitors are not redirected to `/sign-in`.
    2. Update `frontend/src/components/OfflineSafeAuthGuard.jsx`:
       - Render children directly when on `/student/exams` without triggering the sign-in bounce.
    3. Create `frontend/src/app/exams/page.js`:
       - Public route rendering the Exams Hub directly at `/exams`.
    4. Update `frontend/src/components/Header.js`:
       - Add direct navigation link to "Exams & Scholarships".
  </action>
  <verify>
    node -e "fetch('http://localhost:3000/student/exams', { redirect: 'manual' }).then(r => console.log('STATUS:', r.status))"
  </verify>
  <done>
    Route returns HTTP 200 directly without 307 redirect to /sign-in.
  </done>
</task>

<task type="auto">
  <name>Run Full Verification Suites & Production Build</name>
  <files>
    frontend/test-recommendations.mjs
    frontend/test-offline-webapp.mjs
  </files>
  <action>
    1. Run recommendation personas test suite: `node frontend/test-recommendations.mjs`
    2. Run webapp offline architecture test suite: `node frontend/test-offline-webapp.mjs`
    3. Run full Next.js production build: `npm run build --prefix frontend`
  </action>
  <verify>
    powershell -Command "node frontend/test-recommendations.mjs; node frontend/test-offline-webapp.mjs"
  </verify>
  <done>
    All 31 assertions pass with 0 errors, and Next.js builds cleanly with exit code 0.
  </done>
</task>

## Success Criteria
- [ ] `/student/exams` and `/exams` load with HTTP 200 and render visually without authentication redirects.
- [ ] Recommendation engine test suite passes 100%.
- [ ] Webapp offline test suite passes 100%.
- [ ] Next.js production build passes.
- [ ] Milestone documentation and verification logs finalized.
