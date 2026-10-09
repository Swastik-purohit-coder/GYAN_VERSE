---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: Backend APIs & Storage Engine for Dual Video & Audio

## Objective
Update backend lesson endpoints and upload ticket generation to accept, store, and stream both video and audio assets (`audio_url`, `audio_path`, `video_url`, `video_path`), maintaining schema-resilient queries so existing databases without manual migrations continue to function seamlessly.

## Context
- `frontend/src/app/api/teacher/upload-url/route.js`
- `frontend/src/app/api/teacher/modules/[moduleId]/lessons/route.js`
- `frontend/src/app/api/teacher/lessons/[lessonId]/route.js`
- `frontend/src/app/api/student/modules/route.js`
- `frontend/src/app/api/lessons/[id]/route.js`

## Tasks

<task type="auto">
  <name>Enable Audio MIME Types in Storage Upload Endpoint</name>
  <files>frontend/src/app/api/teacher/upload-url/route.js</files>
  <action>
    Update ensureBucketExists to include audio MIME types in allowedMimeTypes:
    audio/mpeg, audio/mp3, audio/wav, audio/ogg, audio/aac, audio/m4a, audio/webm, audio/x-m4a.
    Ensure filename sanitization and storage path generation work cleanly for both video and audio file extensions.
  </action>
  <verify>Call /api/teacher/upload-url with audio/mpeg and audio/mp3 payload to ensure valid storage path and signed upload response</verify>
  <done>Returns signed upload URL and storage path for audio files</done>
</task>

<task type="auto">
  <name>Update Teacher Lessons CRUD Endpoints for Audio Fields</name>
  <files>
    frontend/src/app/api/teacher/modules/[moduleId]/lessons/route.js
    frontend/src/app/api/teacher/lessons/[lessonId]/route.js
  </files>
  <action>
    In GET /api/teacher/modules/[moduleId]/lessons:
    - Select audio_path and audio_url alongside video fields.
    - Provide fallback if audio columns do not exist in PostgreSQL (error code 42703).
    In POST /api/teacher/modules/[moduleId]/lessons:
    - Parse audioUrl and audioPath from request body.
    - Persist audio_url and audio_path to lessons table with fallback on error 42703.
    In PUT /api/teacher/lessons/[lessonId]:
    - Accept audioUrl and audioPath and update them accordingly.
  </action>
  <verify>Execute test script simulating GET, POST, and PUT operations with audioUrl and audioPath</verify>
  <done>Audio fields correctly saved and retrieved without breaking existing video fields</done>
</task>

<task type="auto">
  <name>Update Student Modules & Single Lesson API for Audio Delivery</name>
  <files>
    frontend/src/app/api/student/modules/route.js
    frontend/src/app/api/lessons/[id]/route.js
  </files>
  <action>
    In GET /api/student/modules:
    - Select audio_url and audio_path in lessons subquery with PostgreSQL column resiliency.
    - Map audio_url and audio_path onto returned lesson objects.
    In GET /api/lessons/[id]:
    - Read dbLesson.audio_url || dbLesson.audio_path when constructing response.
  </action>
  <verify>Inspect JSON output of /api/student/modules ensuring audio_url and audio_path are present</verify>
  <done>Student endpoints include audio fields for lessons</done>
</task>

## Success Criteria
- [ ] Upload URL endpoint accepts audio and video files
- [ ] Teacher lesson creation & updates support audio fields
- [ ] Student module list and single lesson routes return audio metadata
