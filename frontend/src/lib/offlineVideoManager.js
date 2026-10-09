// Utility manager for downloading and storing lesson videos in Cache Storage for offline playback
import { getVideoType, parseYouTubeVideoId } from './videoHelpers.js';

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
  const isYouTube =
    resolvedVideoType === 'youtube' ||
    (typeof videoUrl === 'string' && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')));

  // For YouTube lessons, route through the dedicated YouTube download & stream API endpoint
  const ytId = parseYouTubeVideoId(videoUrl);
  const fetchUrl = isYouTube
    ? `/api/media/youtube/${encodeURIComponent(ytId || lessonId || 'video')}?url=${encodeURIComponent(videoUrl)}`
    : videoUrl;

  if (!fetchUrl || typeof fetchUrl !== 'string') {
    throw new Error('No valid video URL available for download.');
  }

  // Check if browser supports Cache API
  if (typeof window === 'undefined' || !('caches' in window)) {
    throw new Error('Cache Storage API is not supported in this browser environment.');
  }

  try {
    if (onProgress) onProgress(5);

    // Fetch video response with CORS
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'video/*, */*',
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
    if (isYouTube) {
      const ytId = parseYouTubeVideoId(videoUrl);
      if (ytId) {
        await cache.put(`youtube://${ytId}`, responseToCache.clone());
      }
    }
    await cache.put('/home.mp4', responseToCache);

    if (onProgress) onProgress(100);

    // Update metadata registry
    const metaMap = getLocalMetadata();
    const storageKey = lessonId || videoUrl;
    metaMap[storageKey] = {
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
      autoCached: false,
    };
    saveLocalMetadata(metaMap);

    // Notify open components of new offline content
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('offline-video-cached', {
          detail: { lessonId, videoUrl, isOfflineReady: true },
        })
      );
    }

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

    if (err.message === 'Failed to fetch' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      throw new Error("Internet connection lost. Download paused. Try again when you're online.");
    }

    throw new Error(err.message || 'Unable to download this video. Please check your internet connection and try again.');
  }
}

/**
 * Automatically caches video and optional audio in the background once played online.
 * Safe and non-blocking: never throws or crashes playback.
 */
export async function autoCacheVideoOnPlay(info = {}) {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

  const { lessonId, videoUrl, audioUrl, title, moduleTitle, studentClass, schoolId, videoType } = info;
  if (!videoUrl && !lessonId && !audioUrl) return null;

  try {
    const isAlreadyCached = await isLessonVideoDownloaded(lessonId, videoUrl);
    if (isAlreadyCached) {
      return { alreadyCached: true, isOfflineReady: true };
    }

    const resolvedVideoType = videoType || (videoUrl ? getVideoType({ video_url: videoUrl }) : 'direct');
    const isYouTube =
      resolvedVideoType === 'youtube' ||
      (typeof videoUrl === 'string' && (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')));

    const cache = await caches.open(VIDEO_CACHE_NAME);

    // 1. Process Video Asset
    if (videoUrl) {
      if (isYouTube) {
        const ytId = parseYouTubeVideoId(videoUrl);
        const ytFetchUrl = `/api/media/youtube/${encodeURIComponent(ytId || lessonId || 'video')}?url=${encodeURIComponent(videoUrl)}`;
        const companionRes = await fetch(ytFetchUrl, { cache: 'force-cache' });
        if (companionRes.ok) {
          const companionBlob = await companionRes.blob();
          const cachedResponse = new Response(companionBlob, {
            status: 200,
            headers: { 'Content-Type': 'video/mp4' },
          });

          await cache.put('/home.mp4', cachedResponse.clone());
          if (videoUrl) await cache.put(videoUrl, cachedResponse.clone());
          if (lessonId) await cache.put(`lesson://${lessonId}`, cachedResponse.clone());

          if (ytId) {
            await cache.put(`youtube://${ytId}`, cachedResponse.clone());
          }
        }
      } else {
        // Direct video (storage URL, /home.mp4, or uploaded MP4/WebM)
        const fetchTarget = videoUrl.startsWith('http') || videoUrl.startsWith('/') ? videoUrl : `/api/media/video/${encodeURIComponent(videoUrl)}`;
        const vidRes = await fetch(fetchTarget, {
          method: 'GET',
          mode: 'cors',
          headers: { Accept: 'video/*, */*' },
        });

        if (vidRes.ok) {
          const vidBlob = await vidRes.blob();
          const vidCachedResponse = new Response(vidBlob, {
            status: 200,
            headers: {
              'Content-Type': vidRes.headers.get('content-type') || 'video/mp4',
            },
          });

          await cache.put(videoUrl, vidCachedResponse.clone());
          if (lessonId) await cache.put(`lesson://${lessonId}`, vidCachedResponse.clone());

          try {
            const parsed = new URL(videoUrl, window.location.origin);
            await cache.put(parsed.pathname, vidCachedResponse.clone());
          } catch (e) {}
        }
      }
    }

    // 2. Process Audio Asset if present
    if (audioUrl) {
      try {
        const audioTarget = audioUrl.startsWith('http') || audioUrl.startsWith('/') ? audioUrl : `/api/media/audio/${encodeURIComponent(audioUrl)}`;
        const audRes = await fetch(audioTarget, {
          method: 'GET',
          mode: 'cors',
          headers: { Accept: 'audio/*, */*' },
        });

        if (audRes.ok) {
          const audBlob = await audRes.blob();
          const audCachedResponse = new Response(audBlob, {
            status: 200,
            headers: {
              'Content-Type': audRes.headers.get('content-type') || 'audio/mpeg',
            },
          });

          await cache.put(audioUrl, audCachedResponse.clone());
          if (lessonId) await cache.put(`lesson-audio://${lessonId}`, audCachedResponse.clone());
        }
      } catch (audErr) {
        console.warn('[OfflineVideoManager] Audio auto-cache notice:', audErr);
      }
    }

    // 3. Update metadata registry
    const metaMap = getLocalMetadata();
    const storageKey = lessonId || videoUrl;
    metaMap[storageKey] = {
      lessonId,
      videoUrl,
      audioUrl: audioUrl || null,
      title: title || 'Lesson Video',
      moduleTitle: moduleTitle || '',
      studentClass: studentClass || '',
      schoolId: schoolId || '',
      videoType: isYouTube ? 'youtube_companion' : 'uploaded',
      downloadedAt: new Date().toISOString(),
      isOfflineReady: true,
      autoCached: true,
    };
    saveLocalMetadata(metaMap);

    // 4. Notify open UI elements
    window.dispatchEvent(
      new CustomEvent('offline-video-cached', {
        detail: { lessonId, videoUrl, isOfflineReady: true, autoCached: true },
      })
    );

    return {
      success: true,
      lessonId,
      videoUrl,
      isOfflineReady: true,
      autoCached: true,
    };
  } catch (err) {
    // Non-blocking: fail quietly in background without breaking stream
    console.warn('[OfflineVideoManager] Auto-cache notice:', err.message);
    return null;
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
      if (lessonId) {
        await cache.delete(`lesson://${lessonId}`);
        await cache.delete(`lesson-audio://${lessonId}`);
      }
      const ytId = parseYouTubeVideoId(videoUrl);
      if (ytId) {
        await cache.delete(`youtube://${ytId}`);
      }
    }
  } catch (e) {
    console.warn('Error deleting video from cache:', e);
  }

  const metaMap = getLocalMetadata();
  if (lessonId && metaMap[lessonId]) {
    delete metaMap[lessonId];
    saveLocalMetadata(metaMap);
  } else if (videoUrl && metaMap[videoUrl]) {
    delete metaMap[videoUrl];
    saveLocalMetadata(metaMap);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('offline-video-cached', {
        detail: { lessonId, videoUrl, isOfflineReady: false },
      })
    );
  }

  return { success: true };
}

/**
 * Checks if a lesson video is available offline in Cache Storage.
 */
export async function isLessonVideoDownloaded(lessonId, videoUrl) {
  const metaMap = getLocalMetadata();
  if (lessonId && metaMap[lessonId]?.isOfflineReady) return true;
  if (videoUrl && metaMap[videoUrl]?.isOfflineReady) return true;

  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    if (videoUrl) {
      const match = await cache.match(videoUrl);
      if (match) return true;
      const ytId = parseYouTubeVideoId(videoUrl);
      if (ytId) {
        const matchYt = await cache.match(`youtube://${ytId}`);
        if (matchYt) return true;
      }
    }
    if (lessonId) {
      const matchLesson = await cache.match(`lesson://${lessonId}`);
      if (matchLesson) return true;
    }
    return false;
  } catch (e) {
    return Boolean((lessonId && metaMap[lessonId]) || (videoUrl && metaMap[videoUrl]));
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

        const ytId = parseYouTubeVideoId(urlToCheck);
        if (ytId) {
          const matchYt = await cache.match(`youtube://${ytId}`);
          if (matchYt) {
            const blob = await matchYt.blob();
            return URL.createObjectURL(blob);
          }
        }
      }

      if (idToCheck) {
        const matchId = await cache.match(`lesson://${idToCheck}`);
        if (matchId) {
          const blob = await matchId.blob();
          return URL.createObjectURL(blob);
        }
      }

      // Check bundled /home.mp4 in cache
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
 * Gets a local Object URL for an offline cached audio track so it plays without internet.
 */
export async function getOfflineAudioBlobUrl(lessonId, audioUrl = null) {
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    if (audioUrl) {
      const match = await cache.match(audioUrl);
      if (match) {
        const blob = await match.blob();
        return URL.createObjectURL(blob);
      }
    }
    if (lessonId) {
      const matchLesson = await cache.match(`lesson-audio://${lessonId}`);
      if (matchLesson) {
        const blob = await matchLesson.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch (e) {
    console.warn('Failed to retrieve offline audio blob from cache:', e);
  }

  return null;
}

/**
 * Retrieves list of all offline downloaded lessons.
 */
export function getAllOfflineVideosMetadata() {
  return getLocalMetadata();
}

/**
 * Returns a direct browser download URL for students to save a YouTube lesson MP4 to their device.
 */
export function getYouTubeDownloadUrl(videoUrl, lessonId = '', forceDownload = true) {
  const ytId = parseYouTubeVideoId(videoUrl);
  const targetId = ytId || lessonId || 'video';
  const query = new URLSearchParams();
  if (videoUrl) query.set('url', videoUrl);
  if (forceDownload) query.set('download', '1');
  return `/api/media/youtube/${encodeURIComponent(targetId)}?${query.toString()}`;
}

