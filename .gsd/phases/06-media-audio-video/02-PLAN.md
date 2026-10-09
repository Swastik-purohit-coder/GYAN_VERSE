---
phase: 6
plan: 2
wave: 2
---

# Plan 6.2: Teacher Module Management (Video & Audio Authoring)

## Objective
Enhance the teacher module lesson creation and editing interface in `frontend/src/app/teacher/modules/page.js` to allow teachers to configure Video, Audio, or BOTH media types for each lesson. Support audio URL input, audio file upload with progress reporting, and clear media status badges in the lesson list.

## Context
- `frontend/src/app/teacher/modules/page.js`
- `frontend/src/lib/api.js`

## Tasks

<task type="auto">
  <name>Extend Teacher Lesson Form State & Upload Handler</name>
  <files>frontend/src/app/teacher/modules/page.js</files>
  <action>
    - Extend `defaultLessonForm()` to include:
      `audioSource` ('none' | 'url' | 'upload'), `audioFile`, `audioPath`, `audioUrl`.
    - Implement `handleUploadAudio` (or generic `handleUploadMedia`) using `apiClient.getSignedVideoUploadUrl` to upload audio files (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`) to Supabase storage with live upload progress.
    - In `handleSaveLesson`, upload audio if `lessonForm.audioFile` is provided, and include `audioUrl` and `audioPath` in the API payload.
    - In `startEditLesson`, populate `audioUrl`, `audioPath`, and appropriate `audioSource` from the existing lesson data.
  </action>
  <verify>Check that lessonForm state tracks audio properties and uploads audio file correctly</verify>
  <done>Teacher can configure and save both video and audio assets for a lesson</done>
</task>

<task type="auto">
  <name>Add Video & Audio Media Controls to Teacher Lesson Form UI</name>
  <files>frontend/src/app/teacher/modules/page.js</files>
  <action>
    - Add a distinct "Audio Lecture (Optional / Alternative)" section in the lesson form.
    - Provide a pill switcher for Audio: "None", "Audio URL", or "Upload Audio File".
    - If "Audio URL": text input for MP3/podcast/lecture audio link with validation.
    - If "Upload Audio File": drag-and-drop or file picker accepting `audio/*` (.mp3, .wav, .m4a, .aac) with upload progress bar.
    - Add explanatory badge: "Lessons can have Video, Audio, or Both. Students can choose to watch or listen."
    - Ensure validation permits either Video OR Audio OR both (at least one media source or summary).
  </action>
  <verify>Open Teacher Modules page in browser and test form rendering and input transitions</verify>
  <done>Clean UI with intuitive dual-media inputs matching GyanVerse styling</done>
</task>

<task type="auto">
  <name>Display Media Badges in Teacher Lessons List</name>
  <files>frontend/src/app/teacher/modules/page.js</files>
  <action>
    - In the lesson list item footer, show badges reflecting media presence:
      - 📹 Video badge (YouTube or Direct Video) if video is present.
      - 🎧 Audio badge (Audio Lecture) if audio is present.
      - 📹+🎧 Dual Media badge if both video and audio are attached.
  </action>
  <verify>Inspect rendered lesson cards to confirm appropriate badges display for each media combination</verify>
  <done>Teacher can immediately see which lessons have video, audio, or both</done>
</task>

## Success Criteria
- [ ] Teacher can add or edit lessons with Video only, Audio only, or Both
- [ ] Direct file upload works for audio as well as video
- [ ] Lesson list badges accurately indicate attached media types
