---
phase: 6
plan: 3
wave: 3
---

# Plan 6.3: Student Experience & Unified Media Player (Live Switcher & OR-Play)

## Objective
Update student-facing components (`VideoPlayer.jsx`, `StudentLearningModules.jsx`, and `InbuiltVideoPlayer.jsx`) to handle the OR operation seamlessly: allow students to watch video OR listen to audio, toggle dynamically between video and audio modes in the player modal when both are present, and report lesson completion progress regardless of which mode was used.

## Context
- `frontend/src/student/components/VideoPlayer.jsx`
- `frontend/src/student/components/StudentLearningModules.jsx`
- `frontend/src/components/media/LessonAudioPlayer.jsx`
- `frontend/src/components/media/LessonVideoPlayer.jsx`
- `frontend/src/components/InbuiltVideoPlayer.jsx`

## Tasks

<task type="auto">
  <name>Build Dual-Mode Switcher in VideoPlayer Modal</name>
  <files>frontend/src/student/components/VideoPlayer.jsx</files>
  <action>
    - Add `mediaMode` state ('video' | 'audio'), defaulting to 'video' if video exists, or 'audio' if only audio exists.
    - If lesson has BOTH video and audio (`hasVideo && hasAudio`), display a sleek pill toggle in the modal header:
      `[ 📹 Watch Video ]  [ 🎧 Listen Audio ]`
    - When `mediaMode === 'video'`: render `LessonVideoPlayer` with poster and stream URL.
    - When `mediaMode === 'audio'`: render `LessonAudioPlayer` with audio scrub bar, speed menu, volume, and playback controls.
    - Ensure progress updates from both players link to `saveLocalLessonProgress` and `onComplete`.
  </action>
  <verify>Open a lesson with both media types and verify seamless toggling between video and audio without modal closing or unhandled errors</verify>
  <done>Player supports both video and audio playback with live switching</done>
</task>

<task type="auto">
  <name>Update StudentLearningModules Lesson Card Actions & Badges</name>
  <files>frontend/src/student/components/StudentLearningModules.jsx</files>
  <action>
    - Check lesson media availability:
      `const hasVideo = Boolean(lesson.video_url || lesson.video_path);`
      `const hasAudio = Boolean(lesson.audio_url || lesson.audio_path);`
    - In lesson list row:
      - Display badges: `📹 Video` if hasVideo, `🎧 Audio` if hasAudio.
      - If hasVideo AND hasAudio:
        Show "Watch Video" primary button AND "Listen Audio" outline button, or unified action that opens player with that tab active.
      - If hasAudio ONLY:
        Primary button is "🎧 Listen Audio" (opens player directly in audio mode).
      - If hasVideo ONLY:
        Primary button is "📹 Watch Video" (opens player in video mode).
    - Clicking lesson title opens in primary available mode.
  </action>
  <verify>Check lesson row rendering for audio-only, video-only, and dual-media lessons</verify>
  <done>Student sees clear choices and actions based on available media</done>
</task>

<task type="auto">
  <name>Update InbuiltVideoPlayer Resource Player for Audio Support</name>
  <files>frontend/src/components/InbuiltVideoPlayer.jsx</files>
  <action>
    - Check if item has `audio_url`, `audioUrl`, or `audio_path`.
    - If resource has audio, provide an Audio player view or tab in the theatre mode alongside Video.
  </action>
  <verify>Verify InbuiltVideoPlayer handles audio links without crashing</verify>
  <done>Inbuilt resource player supports audio playback</done>
</task>

## Success Criteria
- [ ] Student can toggle between Video and Audio when both are available
- [ ] Audio-only lessons play directly in high-quality audio player
- [ ] Progress and completion are tracked for both audio and video playback
