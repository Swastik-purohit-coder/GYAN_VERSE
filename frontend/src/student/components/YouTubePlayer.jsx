"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getYouTubeVideoId } from "@/lib/videoHelpers";
import { saveLocalLessonProgress } from "@/lib/offlineDb";
import {
  autoCacheVideoOnPlay,
  getOfflineVideoBlobUrl,
  isLessonVideoDownloaded,
} from "@/lib/offlineVideoManager";
import { WifiOff, Play, Pause, RotateCcw, CheckCircle2, Zap } from "lucide-react";

export default function YouTubePlayer({
  url,
  lessonId,
  courseVideoId,
  onProgress,
  onEnded,
  autoPlay = false,
  dataSaver = false,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const videoElemRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const [offlineVideoSrc, setOfflineVideoSrc] = useState("/home.mp4");
  const [isStoredOffline, setIsStoredOffline] = useState(false);

  const videoId = getYouTubeVideoId(url);
  const effectiveId = lessonId || courseVideoId;

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  // Check offline storage and resolve cached blob URL
  useEffect(() => {
    let active = true;

    async function checkOfflineAvailability() {
      try {
        const stored = await isLessonVideoDownloaded(effectiveId, url);
        if (active) setIsStoredOffline(Boolean(stored));

        if (isOffline || stored) {
          const blobUrl = await getOfflineVideoBlobUrl(effectiveId, url);
          if (active && blobUrl) {
            setOfflineVideoSrc(blobUrl);
          }
        }
      } catch (e) {
        console.warn("[YouTubePlayer] Offline check notice:", e);
      }
    }

    checkOfflineAvailability();

    const handleCachedEvent = (e) => {
      if (e.detail?.lessonId === effectiveId || e.detail?.videoUrl === url) {
        setIsStoredOffline(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("offline-video-cached", handleCachedEvent);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("offline-video-cached", handleCachedEvent);
      }
    };
  }, [effectiveId, url, isOffline]);

  // Auto-cache offline companion video in background when playing online
  useEffect(() => {
    if (isOffline || !url) return;

    // Trigger auto-cache once online player is engaged
    autoCacheVideoOnPlay({
      lessonId: effectiveId,
      videoUrl: url,
      title: "Lesson Video",
      videoType: "youtube",
    }).then((res) => {
      if (res?.isOfflineReady) {
        setIsStoredOffline(true);
      }
    }).catch(() => {});
  }, [effectiveId, url, isOffline]);

  useEffect(() => {
    if (!videoId || isOffline) return;

    let timeoutId = null;

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }

      // Check if script is already injected
      if (!document.getElementById("youtube-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };

      // Fallback if script fails or takes too long
      timeoutId = setTimeout(() => {
        if (!playerRef.current) {
          console.warn("[YouTubePlayer] YouTube API failed to load or timed out, enabling offline video.");
          setIsOffline(true);
        }
      }, 5000);
    };

    const initPlayer = () => {
      if (playerRef.current || !containerRef.current) return;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: autoPlay && !dataSaver ? 1 : 0,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              setPlayerReady(true);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                // Also trigger background auto-cache when user begins playback
                autoCacheVideoOnPlay({
                  lessonId: effectiveId,
                  videoUrl: url,
                  title: "Lesson Video",
                  videoType: "youtube",
                }).then((r) => {
                  if (r?.isOfflineReady) setIsStoredOffline(true);
                });
              } else {
                setIsPlaying(false);
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                if (onEnded) onEnded();
                if (courseVideoId && onProgress && playerRef.current?.getDuration) {
                  const dur = playerRef.current.getDuration() || 0;
                  onProgress({
                    videoId: courseVideoId,
                    currentTime: dur,
                    duration: dur,
                    completed: true,
                  });
                }
              }
            },
          },
        });
      } catch (err) {
        console.warn("[YouTubePlayer] Init failed:", err);
        setIsOffline(true);
      }
    };

    loadYouTubeAPI();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, autoPlay, dataSaver, effectiveId, courseVideoId, onProgress, onEnded, isOffline, url]);

  // Track playback position periodically when online with YouTube player
  useEffect(() => {
    if (!isPlaying || !playerReady || isOffline) return;

    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration ? playerRef.current.getDuration() : 0;

        // System 1: Teacher lesson progress (offlineDb)
        if (lessonId) {
          saveLocalLessonProgress({
            lessonId,
            completed: false,
            lastPosition: currentTime,
            action: "progress",
          }).catch((e) => console.warn("Failed to save background progress:", e));
        }

        // System 2: School course YouTube video progress
        if (courseVideoId && onProgress) {
          onProgress({
            videoId: courseVideoId,
            currentTime,
            duration,
            completed: duration > 0 && currentTime >= duration * 0.9,
          });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, playerReady, lessonId, courseVideoId, onProgress, isOffline]);

  // Offline video time update handler
  const handleOfflineTimeUpdate = () => {
    const video = videoElemRef.current;
    if (!video) return;

    const cur = Math.floor(video.currentTime);
    const dur = Math.floor(video.duration || 0);

    if (lessonId && cur % 5 === 0) {
      saveLocalLessonProgress({
        lessonId,
        completed: dur > 0 && cur >= dur * 0.9,
        lastPosition: cur,
        action: "progress",
      }).catch(() => {});
    }

    if (courseVideoId && onProgress && cur % 5 === 0) {
      onProgress({
        videoId: courseVideoId,
        currentTime: cur,
        duration: dur,
        completed: dur > 0 && cur >= dur * 0.9,
      });
    }
  };

  const handleOfflineEnded = () => {
    if (onEnded) onEnded();
    const dur = videoElemRef.current?.duration || 0;
    if (courseVideoId && onProgress) {
      onProgress({
        videoId: courseVideoId,
        currentTime: dur,
        duration: dur,
        completed: true,
      });
    }
  };

  if (!videoId) {
    return <div className="p-4 text-white">Invalid YouTube URL</div>;
  }

  // Offline HTML5 Player Fallback (Cached video playback without internet)
  if (isOffline) {
    return (
      <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center">
        <video
          ref={videoElemRef}
          src={offlineVideoSrc}
          controls
          autoPlay={autoPlay}
          playsInline
          onTimeUpdate={handleOfflineTimeUpdate}
          onEnded={handleOfflineEnded}
          className="w-full h-full object-contain"
        />
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/95 text-white text-xs font-semibold backdrop-blur-md shadow-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode • Playing Stored Lesson Video (No Internet Needed)</span>
          <button
            onClick={() => setIsOffline(false)}
            className="ml-2 text-[10px] underline hover:text-white"
          >
            Try Online
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {/* Offline Stored Badge when Online */}
      {isStoredOffline && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 text-emerald-400 text-[11px] font-medium backdrop-blur-md border border-slate-700 shadow-md">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Stored for Offline Replay</span>
          <button
            onClick={() => setIsOffline(true)}
            className="ml-1 text-[10px] text-slate-300 hover:text-white underline"
            title="Preview offline replay mode"
          >
            Play Offline
          </button>
        </div>
      )}
    </div>
  );
}
