// Utility manager for downloading and storing lesson videos in Cache Storage for offline playback
import { getVideoType } from './videoHelpers';

const VIDEO_CACHE_NAME = 'glp-videos-v1';
const META_KEY = 'gyanaratna_offline_video_meta';

function getLocalMetadata() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to read offline video metadata:', e);
    return {};
  }
}

function saveLocalMetadata(metaMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(META_KEY, JSON.stringify(metaMap));
  } catch (e) {
    console.warn('Failed to save offline video metadata:', e);
  }
}

/**
 * Downloads an uploaded lesson video or YouTube companion video into Cache Storage with progress tracking.
 */
export async function downloadVideoForOffline(info, onProgress) {
  const { lessonId, videoUrl, title, moduleTitle, studentClass, schoolId, videoType } = info;

  const resolvedVideoType = videoType || getVideoType({ video_url: videoUrl });
  const isYouTube = resolvedVideoType === 'youtube' || (typeof videoUrl === 'string' && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')));

  // For YouTube lessons, cache the bundled offline companion lesson video so it is playable offline
  const fetchUrl = isYouTube ? '/home.mp4' : videoUrl;

  if (!fetchUrl || typeof fetchUrl !== 'string') {
    throw new Error('No valid video URL available for download.');
  }

  // Check if browser supports Cache API
  if (!('caches' in window)) {
    throw new Error('Cache Storage API is not supported in this browser environment.');
  }

  try {
    if (onProgress) onProgress(5);

    // Fetch video response with CORS
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'video/*, */*',
      },
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 403 || response.status === 404) {
        throw new Error('This video is currently unavailable for offline download.');
      }
      throw new Error('Unable to download this video. Please check your internet connection and try again.');
    }

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Read response body stream to calculate download percentage
    let receivedBytes = 0;
    let reader = null;
    let chunks = [];

    if (response.body && contentLength > 0) {
      reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;
        if (onProgress && contentLength > 0) {
          const pct = Math.min(95, Math.round((receivedBytes / contentLength) * 90) + 5);
          onProgress(pct);
        }
      }
    }

    // Reconstruct response object to store in Cache Storage
    let responseToCache;
    if (chunks.length > 0) {
      const blob = new Blob(chunks, { type: contentType || 'video/mp4' });
      responseToCache = new Response(blob, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } else {
      responseToCache = response.clone();
    }

    // Save to Cache Storage under videoUrl, lessonId, and /home.mp4
    const cache = await caches.open(VIDEO_CACHE_NAME);
    if (videoUrl) {
      await cache.put(videoUrl, responseToCache.clone());
    }
    if (lessonId) {
      await cache.put(`lesson://${lessonId}`, responseToCache.clone());
    }
    await cache.put('/home.mp4', responseToCache);

    if (onProgress) onProgress(100);

    // Update metadata registry
    const metaMap = getLocalMetadata();
    metaMap[lessonId] = {
      lessonId,
      videoUrl,
      title: title || 'Lesson Video',
      moduleTitle: moduleTitle || '',
      studentClass: studentClass || '',
      schoolId: schoolId || '',
      videoType: isYouTube ? 'youtube_companion' : 'uploaded',
      downloadedAt: new Date().toISOString(),
      sizeBytes: receivedBytes || contentLength || 0,
      isOfflineReady: true,
    };
    saveLocalMetadata(metaMap);

    return {
      success: true,
      lessonId,
      videoUrl,
    };
  } catch (err) {
    console.error('Offline video download error:', err);

    // Clean up partial cache on failure
    try {
      const cache = await caches.open(VIDEO_CACHE_NAME);
      if (videoUrl) await cache.delete(videoUrl);
      if (lessonId) await cache.delete(`lesson://${lessonId}`);
    } catch (e) {}

    if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
      throw new Error('Insufficient storage space on device for offline video.');
    }

    if (err.message === 'Failed to fetch' || !navigator.onLine) {
      throw new Error('Internet connection lost. Download paused. Try again when you\'re online.');
    }

    throw new Error(err.message || 'Unable to download this video. Please check your internet connection and try again.');
  }
}

/**
 * Removes a downloaded lesson video from Cache Storage and metadata.
 */
export async function removeOfflineVideo(lessonId, videoUrl) {
  try {
    if ('caches' in window) {
      const cache = await caches.open(VIDEO_CACHE_NAME);
      if (videoUrl) await cache.delete(videoUrl);
      if (lessonId) await cache.delete(`lesson://${lessonId}`);
    }
  } catch (e) {
    console.warn('Error deleting video from cache:', e);
  }

  const metaMap = getLocalMetadata();
  if (metaMap[lessonId]) {
    delete metaMap[lessonId];
    saveLocalMetadata(metaMap);
  }

  return { success: true };
}

/**
 * Checks if a lesson video is available offline in Cache Storage.
 */
export async function isLessonVideoDownloaded(lessonId, videoUrl) {
  const metaMap = getLocalMetadata();
  if (lessonId && metaMap[lessonId]) return true;

  if (!('caches' in window)) return false;

  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    if (videoUrl) {
      const match = await cache.match(videoUrl);
      if (match) return true;
    }
    if (lessonId) {
      const matchLesson = await cache.match(`lesson://${lessonId}`);
      if (matchLesson) return true;
    }
    return false;
  } catch (e) {
    return Boolean(lessonId && metaMap[lessonId]);
  }
}

/**
 * Gets a local Object URL for an offline cached video so it plays without internet.
 * Falls back to /home.mp4 when offline.
 */
export async function getOfflineVideoBlobUrl(lessonIdOrUrl, videoUrl = null) {
  if (typeof window === 'undefined') return null;

  const urlToCheck = videoUrl || (typeof lessonIdOrUrl === 'string' && lessonIdOrUrl.includes('/') ? lessonIdOrUrl : null);
  const idToCheck = typeof lessonIdOrUrl === 'string' && !lessonIdOrUrl.includes('/') ? lessonIdOrUrl : null;

  if ('caches' in window) {
    try {
      const cache = await caches.open(VIDEO_CACHE_NAME);
      if (urlToCheck) {
        const match = await cache.match(urlToCheck);
        if (match) {
          const blob = await match.blob();
          return URL.createObjectURL(blob);
        }
      }
      if (idToCheck) {
        const matchId = await cache.match(`lesson://${idToCheck}`);
        if (matchId) {
          const blob = await matchId.blob();
          return URL.createObjectURL(blob);
        }
      }
      const matchHome = await cache.match('/home.mp4');
      if (matchHome) {
        const blob = await matchHome.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('Failed to retrieve offline video blob from cache:', e);
    }
  }

  // If offline or disconnected, return local bundled video /home.mp4 as direct fallback
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return '/home.mp4';
  }

  return null;
}

/**
 * Retrieves list of all offline downloaded lessons.
 */
export function getAllOfflineVideosMetadata() {
  return getLocalMetadata();
}
