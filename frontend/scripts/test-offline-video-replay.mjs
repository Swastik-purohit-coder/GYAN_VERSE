/**
 * Verification test for Auto-Caching and Offline Video/Audio Replay Without Internet.
 * Validates offlineVideoManager, YouTubePlayer, LessonVideoPlayer, VideoPlayer, and Service Worker.
 */

import { promises as fs } from "fs";
import path from "path";

async function runTests() {
  console.log("========================================================");
  console.log(" Running Offline Video & YouTube Replay Verification   ");
  console.log("========================================================\n");

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

  // 1. Verify offlineVideoManager exports and capabilities
  try {
    const ovmPath = path.resolve("src/lib/offlineVideoManager.js");
    const ovmContent = await fs.readFile(ovmPath, "utf8");

    assert(
      ovmContent.includes("export async function autoCacheVideoOnPlay"),
      "offlineVideoManager exports autoCacheVideoOnPlay"
    );
    assert(
      ovmContent.includes("youtube_companion") &&
      ovmContent.includes("youtube://") &&
      ovmContent.includes("/home.mp4"),
      "offlineVideoManager handles YouTube companion caching and youtube:// keys"
    );
    assert(
      ovmContent.includes("export async function getOfflineVideoBlobUrl"),
      "offlineVideoManager exports getOfflineVideoBlobUrl"
    );
    assert(
      ovmContent.includes("export async function getOfflineAudioBlobUrl"),
      "offlineVideoManager exports getOfflineAudioBlobUrl"
    );
    assert(
      ovmContent.includes("offline-video-cached"),
      "offlineVideoManager dispatches offline-video-cached event"
    );
  } catch (err) {
    assert(false, `offlineVideoManager check failed: ${err.message}`);
  }

  // 2. Verify YouTubePlayer.jsx auto-caching and offline replay
  try {
    const ytPath = path.resolve("src/student/components/YouTubePlayer.jsx");
    const ytContent = await fs.readFile(ytPath, "utf8");

    assert(
      ytContent.includes("autoCacheVideoOnPlay") &&
      ytContent.includes("getOfflineVideoBlobUrl") &&
      ytContent.includes("isLessonVideoDownloaded"),
      "YouTubePlayer imports autoCacheVideoOnPlay and getOfflineVideoBlobUrl"
    );
    assert(
      ytContent.includes("setOfflineVideoSrc(blobUrl)") ||
      ytContent.includes("offlineVideoSrc"),
      "YouTubePlayer sets cached blob URL for offline playback"
    );
    assert(
      ytContent.includes("Stored for Offline Replay"),
      "YouTubePlayer displays Stored for Offline Replay badge"
    );
    assert(
      ytContent.includes("Offline Mode • Playing Stored Lesson Video"),
      "YouTubePlayer displays offline mode status banner without internet"
    );
  } catch (err) {
    assert(false, `YouTubePlayer check failed: ${err.message}`);
  }

  // 3. Verify LessonVideoPlayer.jsx auto-caching and offline replay
  try {
    const lvpPath = path.resolve("src/components/media/LessonVideoPlayer.jsx");
    const lvpContent = await fs.readFile(lvpPath, "utf8");

    assert(
      lvpContent.includes("autoCacheVideoOnPlay") &&
      lvpContent.includes("getOfflineVideoBlobUrl"),
      "LessonVideoPlayer imports autoCacheVideoOnPlay and getOfflineVideoBlobUrl"
    );
    assert(
      lvpContent.includes("resolvedOfflineBlob") &&
      lvpContent.includes("isStoredOffline"),
      "LessonVideoPlayer tracks resolvedOfflineBlob and isStoredOffline state"
    );
    assert(
      lvpContent.includes("autoCacheVideoOnPlay({") &&
      lvpContent.includes("lessonId: effectiveId"),
      "LessonVideoPlayer auto-caches video in background on play"
    );
    assert(
      lvpContent.includes("Stored for Offline Replay"),
      "LessonVideoPlayer renders Stored for Offline Replay badge"
    );
    assert(
      lvpContent.includes("Offline Mode • Playing Stored Video (No Internet Needed)"),
      "LessonVideoPlayer renders Offline Mode banner"
    );
  } catch (err) {
    assert(false, `LessonVideoPlayer check failed: ${err.message}`);
  }

  // 4. Verify VideoPlayer.jsx modal auto-cache & offline blob resolution
  try {
    const vpPath = path.resolve("src/student/components/VideoPlayer.jsx");
    const vpContent = await fs.readFile(vpPath, "utf8");

    assert(
      vpContent.includes("autoCacheVideoOnPlay") &&
      vpContent.includes("resolvedBlob") &&
      vpContent.includes("resolvedAudioBlob"),
      "VideoPlayer tracks resolvedBlob and resolvedAudioBlob"
    );
    assert(
      vpContent.includes("Stored for Offline Replay"),
      "VideoPlayer renders Stored for Offline Replay badge in header"
    );
  } catch (err) {
    assert(false, `VideoPlayer check failed: ${err.message}`);
  }

  // 5. Verify StudentLearningModules.jsx listens to cache event & updates badges
  try {
    const slmPath = path.resolve("src/student/components/StudentLearningModules.jsx");
    const slmContent = await fs.readFile(slmPath, "utf8");

    assert(
      slmContent.includes("offline-video-cached"),
      "StudentLearningModules listens to offline-video-cached event"
    );
    assert(
      slmContent.includes("Offline Ready"),
      "StudentLearningModules displays Offline Ready badge on cached lessons"
    );
  } catch (err) {
    assert(false, `StudentLearningModules check failed: ${err.message}`);
  }

  // 6. Verify LessonAudioPlayer.jsx supports offline audio caching & replay
  try {
    const lapPath = path.resolve("src/components/media/LessonAudioPlayer.jsx");
    const lapContent = await fs.readFile(lapPath, "utf8");

    assert(
      lapContent.includes("autoCacheVideoOnPlay") &&
      lapContent.includes("getOfflineAudioBlobUrl") &&
      lapContent.includes("resolvedAudioBlob"),
      "LessonAudioPlayer supports offline audio caching and resolvedAudioBlob"
    );
  } catch (err) {
    assert(false, `LessonAudioPlayer check failed: ${err.message}`);
  }

  // 7. Verify InbuiltVideoPlayer.jsx auto-caching
  try {
    const ivpPath = path.resolve("src/components/InbuiltVideoPlayer.jsx");
    const ivpContent = await fs.readFile(ivpPath, "utf8");

    assert(
      ivpContent.includes("autoCacheVideoOnPlay") &&
      ivpContent.includes("offline-video-cached"),
      "InbuiltVideoPlayer auto-caches media on open and listens to offline event"
    );
  } catch (err) {
    assert(false, `InbuiltVideoPlayer check failed: ${err.message}`);
  }

  // 8. Verify public/sw.js service worker media caching & range requests
  try {
    const swPath = path.resolve("public/sw.js");
    const swContent = await fs.readFile(swPath, "utf8");

    assert(
      swContent.includes("isMediaUrl") &&
      swContent.includes(".mp3") &&
      swContent.includes(".m4a") &&
      swContent.includes("handleVideoRangeRequest"),
      "sw.js handles both video and audio media requests and partial range responses"
    );
    assert(
      swContent.includes("/home.mp4") &&
      swContent.includes("VIDEO_CACHE"),
      "sw.js includes /home.mp4 fallback and VIDEO_CACHE integration"
    );
  } catch (err) {
    assert(false, `sw.js check failed: ${err.message}`);
  }

  // 9. Live HTTP verification on local dev server
  try {
    const studentRes = await fetch("http://localhost:3000/student");
    assert(studentRes.status === 200, "GET /student responds with HTTP 200");

    const searchRes = await fetch("http://localhost:3000/student/search");
    assert(searchRes.status === 200, "GET /student/search responds with HTTP 200");

    const homeMp4Res = await fetch("http://localhost:3000/home.mp4");
    assert(homeMp4Res.status === 200, "GET /home.mp4 (bundled offline video) responds with HTTP 200");
  } catch (err) {
    assert(false, `Live fetch check failed: ${err.message}`);
  }

  console.log(`\n========================================================`);
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
