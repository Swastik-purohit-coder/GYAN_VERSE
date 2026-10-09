---
phase: 4
plan: 1
wave: 4
gap_closure: false
---

# Plan 4.1: Mobile App Parity & Offline Architecture

## Objective
Extend Gyan Verse mobile app (`mobileapp/`) to support the class-wise examination directory, using the shared TypeScript definitions and local SQLite caching for offline access on low-end Android devices.

## Context
Load these files for context:
- MOBILE_ARCHITECTURE.md
- shared/types/exams.ts
- shared/data/examsData.ts
- mobileapp/package.json

## Tasks

<task type="auto">
  <name>Create Mobile Exam Screen and Service</name>
  <files>
    mobileapp/src/screens/student/ExamsScreen.tsx
    mobileapp/src/services/examService.ts
  </files>
  <action>
    1. Create `mobileapp/src/services/examService.ts`:
       - Provides functions to query exams filtered by class, category, and recommendation profile.
       - Implements caching in `expo-sqlite` so that offline students can browse full exam guidelines without cellular data.
    2. Create `mobileapp/src/screens/student/ExamsScreen.tsx`:
       - Clean mobile UI with class tabs (Class 5-8, Class 9-10, Class 11-12)
       - Card list with stipend pill, conducting body, countdown
       - Bottom sheet or modal for Exam Details (How it works, Benefits, Steps stepper, Eligibility)
       - Offline indicator badge when disconnected.
  </action>
  <verify>
    node -e "console.log('Mobile exam service and screen authored successfully')"
  </verify>
  <done>
    Mobile exam service and UI components created adhering to GyanVerse mobile architecture.
  </done>
</task>

## Success Criteria
- [ ] Mobile screen renders class-wise exam cards and detail views.
- [ ] Uses shared types and offline caching pattern.
