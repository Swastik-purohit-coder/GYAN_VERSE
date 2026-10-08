"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RefreshCw,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { parseYouTubeVideoId } from "@/lib/videoHelpers";

const POS_STORAGE_PREFIX = "gyan_vid_pos_";

/**
 * Optimized Lesson Video Player designed for low-RAM mobile devices & slow networks.
 *
 * Key Optimizations:
 * 1. preload="metadata" — never buffers full file in advance.
 * 2. Zero Blob storage in memory — uses native HTML5 streaming or low-buffer HLS.
 * 3. Range-request friendly streaming.
 * 4. Debounced progress reporting (every 10-15s, pause, and exit).
 * 5. Automatic error recovery and resume from last watched position.
 */
export default function LessonVideoPlayer({
  src,
  videoId,
  lessonId,
  title,
  poster,
  initialPosition = 0,
  duration: propDuration = 0,
  onProgressUpdate,
  onComplete,
  className = "",
  autoPlay = false,
}) {
  const effectiveId = lessonId || videoId || "default";
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  // Core player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [networkStatus, setNetworkStatus] = useState("online");

  const lastSavedPositionRef = useRef(0);
  const progressTimerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const completedTriggeredRef = useRef(false);

  // Check if src is a YouTube URL
  const ytVideoId = src ? parseYouTubeVideoId(src) : null;

  // Determine media URL
  const mediaUrl = React.useMemo(() => {
    if (!src && videoId) {
      return `/api/media/video/${encodeURIComponent(videoId)}`;
    }
    if (src && !src.startsWith("http") && !src.startsWith("/") && !ytVideoId) {
      return `/api/media/video/${encodeURIComponent(src)}`;
    }
    return src;
  }, [src, videoId, ytVideoId]);

  // Read saved local position on initial mount
  const getSavedPosition = useCallback(() => {
    if (typeof window === "undefined") return initialPosition || 0;
    try {
      const saved = localStorage.getItem(`${POS_STORAGE_PREFIX}${effectiveId}`);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {}
    return initialPosition || 0;
  }, [effectiveId, initialPosition]);

  // Save progress helper (debounced or on event)
  const saveProgress = useCallback(
    (pos, forceCompleted = false) => {
      if (typeof window === "undefined" || !effectiveId) return;

      const curPos = typeof pos === "number" ? Math.floor(pos) : Math.floor(currentTime);
      const totalDur = duration || propDuration || 0;
      const pct = totalDur > 0 ? (curPos / totalDur) * 100 : 0;
      const isComplete = forceCompleted || pct >= 90;

      // 1. Save locally
      try {
        localStorage.setItem(`${POS_STORAGE_PREFIX}${effectiveId}`, String(curPos));
      } catch (e) {}

      // 2. Report to backend callback if provided
      if (onProgressUpdate) {
        onProgressUpdate({
          lessonId: effectiveId,
          lastPosition: curPos,
          duration: totalDur,
          percentage: pct,
          completed: isComplete,
        });
      }

      // 3. Trigger completion event once
      if (isComplete && !completedTriggeredRef.current && onComplete) {
        completedTriggeredRef.current = true;
        onComplete({ lessonId: effectiveId, lastPosition: curPos, duration: totalDur });
      }

      lastSavedPositionRef.current = curPos;
    },
    [effectiveId, currentTime, duration, propDuration, onProgressUpdate, onComplete]
  );

  // Online / offline network monitoring
  useEffect(() => {
    const handleOnline = () => setNetworkStatus("online");
    const handleOffline = () => setNetworkStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize Video & HLS (Low memory configuration)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !mediaUrl || ytVideoId) return;

    setError(null);
    setIsLoading(true);

    const isHlsSource = mediaUrl.includes(".m3u8");

    if (isHlsSource && Hls.isSupported()) {
      // Memory-optimized HLS configuration for 3GB/4GB Android devices
      const hls = new Hls({
        maxBufferLength: 15, // buffer max 15 seconds ahead (prevents memory spikes)
        maxMaxBufferLength: 30,
        maxBufferSize: 15 * 1024 * 1024, // max 15MB buffer limit
        startLevel: -1, // Auto adaptive bitrate
        enableWorker: true,
      });

      hlsRef.current = hls;
      hls.loadSource(mediaUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        const startPos = getSavedPosition();
        if (startPos > 0 && video.duration && startPos < video.duration - 5) {
          video.currentTime = startPos;
        }
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setIsBuffering(true);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Playback failed. Please click Retry.");
              hls.destroy();
              break;
          }
        }
      });
    } else {
      // Native HTML5 Video Stream (HTTP Range Request powered)
      video.src = mediaUrl;
      video.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [mediaUrl, ytVideoId, autoPlay, getSavedPosition]);

  // Periodic debounced progress timer (every 10-15 seconds)
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        const cur = video.currentTime;
        if (Math.abs(cur - lastSavedPositionRef.current) >= 5) {
          saveProgress(cur);
        }
      }
    }, 10000); // 10 seconds

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, saveProgress]);

  // Save on component unmount or page exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      const video = videoRef.current;
      if (video) {
        saveProgress(video.currentTime);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const video = videoRef.current;
      if (video) {
        saveProgress(video.currentTime);
      }
    };
  }, [saveProgress]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || propDuration || 0);
    setIsLoading(false);

    // Resume saved playback position
    const saved = getSavedPosition();
    if (saved > 0 && video.duration && saved < video.duration - 5) {
      video.currentTime = saved;
      setCurrentTime(saved);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // Compute buffered percentage for smooth UI indicator
    if (video.buffered && video.buffered.length > 0) {
      try {
        const end = video.buffered.end(video.buffered.length - 1);
        setBufferedEnd(end);
      } catch (e) {}
    }

    // Check completion threshold (90%)
    if (video.duration > 0) {
      const pct = (video.currentTime / video.duration) * 100;
      if (pct >= 90 && !completedTriggeredRef.current) {
        saveProgress(video.currentTime, true);
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsBuffering(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      saveProgress(video.currentTime);
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setIsBuffering(false);
    setError("Unable to stream video. Please check your connection.");
  };

  // Playback control actions
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => {
        console.warn("Play interrupted:", err);
      });
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const targetTime = parseFloat(e.target.value);
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const skipTime = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const next = Math.max(0, Math.min(duration || 0, video.currentTime + seconds));
    video.currentTime = next;
    setCurrentTime(next);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 1;
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (e) {}
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (e) {}
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    const video = videoRef.current;
    if (video) {
      const savedPos = currentTime || getSavedPosition();
      video.src = mediaUrl;
      video.load();
      video.currentTime = savedPos;
      video.play().catch(() => {});
    }
  };

  const handleUserActivity = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // YouTube Fallback Render
  if (ytVideoId) {
    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg ${className}`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
          title={title || "Lesson Video"}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const bufferedPercentage = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0;
  const currentPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      className={`group relative w-full aspect-video bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl select-none flex items-center justify-center ${className}`}
    >
      {/* Native HTML5 Video Element */}
      <video
        ref={videoRef}
        preload="metadata"
        playsInline
        poster={poster || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleError}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Network / Offline Banner */}
      {networkStatus === "offline" && (
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-semibold backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline - Reconnecting...</span>
        </div>
      )}

      {/* Loading / Buffering Spinner */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-400 drop-shadow-md" />
          <span className="mt-2 text-xs font-medium text-slate-200 tracking-wide">
            {isLoading ? "Streaming Lesson..." : "Buffering..."}
          </span>
        </div>
      )}

      {/* Error Overlay with Retry */}
      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
          <p className="text-sm font-semibold text-white max-w-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Streaming</span>
          </button>
        </div>
      )}

      {/* Big Center Play/Pause Button on Pause */}
      {!isPlaying && !isLoading && !error && (
        <button
          onClick={togglePlay}
          className="absolute z-20 w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-2xl backdrop-blur-sm"
          aria-label="Play video"
        >
          <Play className="w-8 h-8 fill-current ml-1" />
        </button>
      )}

      {/* Custom Sleek Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress / Seek Bar with Buffered Range Indicator */}
        <div className="relative w-full h-3 flex items-center mb-3 group/bar cursor-pointer">
          {/* Background Bar */}
          <div className="absolute inset-x-0 h-1 group-hover/bar:h-2 bg-slate-700/70 rounded-full transition-all" />
          {/* Buffered Stream Bar */}
          <div
            className="absolute left-0 h-1 group-hover/bar:h-2 bg-slate-500/60 rounded-full transition-all pointer-events-none"
            style={{ width: `${bufferedPercentage}%` }}
          />
          {/* Played Bar */}
          <div
            className="absolute left-0 h-1 group-hover/bar:h-2 bg-indigo-500 rounded-full transition-all pointer-events-none"
            style={{ width: `${currentPercentage}%` }}
          />
          {/* Native Slider Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seek video progress"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-3 text-slate-200">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:text-white transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 hover:text-white transition-colors"
              title="Rewind 10s"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-1.5 hover:text-white transition-colors"
              title="Forward 10s"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="hidden sm:flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:text-white transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 accent-indigo-500 cursor-pointer bg-slate-700 rounded-full"
                aria-label="Volume slider"
              />
            </div>

            {/* Timestamp */}
            <span className="text-xs font-mono text-slate-300 ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Selector Button */}
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              aria-label="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Speed Popover Menu */}
            {showSpeedMenu && (
              <div className="absolute right-8 bottom-10 bg-slate-900 border border-slate-700 rounded-lg py-1 shadow-2xl z-40 text-xs flex flex-col min-w-[70px]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-3 py-1.5 text-left hover:bg-indigo-600/30 transition-colors ${
                      playbackRate === s ? "text-indigo-400 font-bold" : "text-slate-300"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:text-white transition-colors"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
