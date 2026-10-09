"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertCircle,
  Loader2,
  Headphones,
  Sparkles,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import {
  autoCacheVideoOnPlay,
  getOfflineAudioBlobUrl,
} from "@/lib/offlineVideoManager";

const AUDIO_POS_PREFIX = "gyan_aud_pos_";

/**
 * Optimized Lesson Audio Player for low-RAM mobile devices & podcast/lecture lessons.
 *
 * Key Optimizations:
 * 1. preload="metadata" — loads zero audio buffer into RAM until requested.
 * 2. Range request streaming support for seeking.
 * 3. Debounced progress reporting (10-15s, pause, exit).
 * 4. Error recovery and position preservation.
 */
export default function LessonAudioPlayer({
  src,
  audioId,
  lessonId,
  title = "Lesson Audio",
  speaker,
  initialPosition = 0,
  duration: propDuration = 0,
  onProgressUpdate,
  onComplete,
  className = "",
  autoPlay = false,
}) {
  const effectiveId = lessonId || audioId || "default_audio";
  const audioRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(propDuration || 0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [resolvedAudioBlob, setResolvedAudioBlob] = useState(null);
  const [isStoredOffline, setIsStoredOffline] = useState(false);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const lastSavedPositionRef = useRef(0);
  const progressTimerRef = useRef(null);
  const completedTriggeredRef = useRef(false);

  // Check offline cache and auto-cache in background
  useEffect(() => {
    let active = true;
    async function checkOfflineAudio() {
      try {
        const audBlob = await getOfflineAudioBlobUrl(effectiveId, src);
        if (active && audBlob) {
          setResolvedAudioBlob(audBlob);
          setIsStoredOffline(true);
        }

        if (!isOffline && (src || audioId)) {
          autoCacheVideoOnPlay({
            lessonId: effectiveId,
            audioUrl: src,
            title,
          }).then((res) => {
            if (active && res?.isOfflineReady) {
              setIsStoredOffline(true);
            }
          }).catch(() => {});
        }
      } catch (err) {}
    }

    checkOfflineAudio();
    return () => {
      active = false;
    };
  }, [effectiveId, src, audioId, title, isOffline]);

  const mediaUrl = React.useMemo(() => {
    if (resolvedAudioBlob) return resolvedAudioBlob;
    if (!src && audioId) {
      return `/api/media/audio/${encodeURIComponent(audioId)}`;
    }
    if (src && !src.startsWith("http") && !src.startsWith("/")) {
      return `/api/media/audio/${encodeURIComponent(src)}`;
    }
    return src;
  }, [src, audioId, resolvedAudioBlob]);

  const getSavedPosition = useCallback(() => {
    if (typeof window === "undefined") return initialPosition || 0;
    try {
      const saved = localStorage.getItem(`${AUDIO_POS_PREFIX}${effectiveId}`);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) {}
    return initialPosition || 0;
  }, [effectiveId, initialPosition]);

  const saveProgress = useCallback(
    (pos, forceCompleted = false) => {
      if (typeof window === "undefined" || !effectiveId) return;

      const curPos = typeof pos === "number" ? Math.floor(pos) : Math.floor(currentTime);
      const totalDur = duration || propDuration || 0;
      const pct = totalDur > 0 ? (curPos / totalDur) * 100 : 0;
      const isComplete = forceCompleted || pct >= 90;

      try {
        localStorage.setItem(`${AUDIO_POS_PREFIX}${effectiveId}`, String(curPos));
      } catch (e) {}

      if (onProgressUpdate) {
        onProgressUpdate({
          lessonId: effectiveId,
          lastPosition: curPos,
          duration: totalDur,
          percentage: pct,
          completed: isComplete,
        });
      }

      if (isComplete && !completedTriggeredRef.current && onComplete) {
        completedTriggeredRef.current = true;
        onComplete({ lessonId: effectiveId, lastPosition: curPos, duration: totalDur });
      }

      lastSavedPositionRef.current = curPos;
    },
    [effectiveId, currentTime, duration, propDuration, onProgressUpdate, onComplete]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mediaUrl) return;

    setError(null);
    setIsLoading(true);
    audio.src = mediaUrl;
    audio.load();

    if (autoPlay) {
      audio.play().catch(() => {});
    }
  }, [mediaUrl, autoPlay]);

  // Debounced progress timer
  useEffect(() => {
    if (!isPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const cur = audio.currentTime;
        if (Math.abs(cur - lastSavedPositionRef.current) >= 5) {
          saveProgress(cur);
        }
      }
    }, 10000);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, saveProgress]);

  // Save on page exit / unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      if (audio) saveProgress(audio.currentTime);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const audio = audioRef.current;
      if (audio) saveProgress(audio.currentTime);
    };
  }, [saveProgress]);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setDuration(audio.duration || propDuration || 0);
    setIsLoading(false);

    const saved = getSavedPosition();
    if (saved > 0 && audio.duration && saved < audio.duration - 5) {
      audio.currentTime = saved;
      setCurrentTime(saved);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);

    if (audio.buffered && audio.buffered.length > 0) {
      try {
        const end = audio.buffered.end(audio.buffered.length - 1);
        setBufferedEnd(end);
      } catch (e) {}
    }

    if (audio.duration > 0) {
      const pct = (audio.currentTime / audio.duration) * 100;
      if (pct >= 90 && !completedTriggeredRef.current) {
        saveProgress(audio.currentTime, true);
      }
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setIsBuffering(false);
  };

  const handlePause = () => {
    setIsPlaying(false);
    const audio = audioRef.current;
    if (audio) saveProgress(audio.currentTime);
  };

  const handleWaiting = () => setIsBuffering(true);
  const handlePlaying = () => {
    setIsBuffering(false);
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setIsBuffering(false);
    setError("Unable to stream audio. Please check your connection.");
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((err) => console.warn("Audio play prevented:", err));
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const target = parseFloat(e.target.value);
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const skipTime = (secs) => {
    const audio = audioRef.current;
    if (!audio) return;

    const next = Math.max(0, Math.min(duration || 0, audio.currentTime + secs));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      audio.volume = volume || 1;
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    const audio = audioRef.current;
    if (audio) {
      const saved = currentTime || getSavedPosition();
      audio.src = mediaUrl;
      audio.load();
      audio.currentTime = saved;
      audio.play().catch(() => {});
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const bufferedPercentage = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0;
  const currentPercentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl ${className}`}>
      {/* Hidden Native HTML5 Audio */}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleError}
      />

      {/* Header info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Headphones className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{title}</h4>
            <p className="text-xs text-slate-400 truncate">{speaker || "Audio Lesson Stream"}</p>
          </div>
        </div>

        {/* Playback speed selector */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
          >
            {playbackRate}x
          </button>
          {showSpeedMenu && (
            <div className="absolute right-0 bottom-8 bg-slate-900 border border-slate-700 rounded-lg py-1 shadow-2xl z-40 text-xs flex flex-col min-w-[70px]">
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
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRetry}
            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Seek bar */}
      <div className="relative w-full h-2 flex items-center my-3 group/bar cursor-pointer">
        <div className="absolute inset-x-0 h-1.5 group-hover/bar:h-2 bg-slate-800 rounded-full transition-all" />
        <div
          className="absolute left-0 h-1.5 group-hover/bar:h-2 bg-slate-700 rounded-full transition-all pointer-events-none"
          style={{ width: `${bufferedPercentage}%` }}
        />
        <div
          className="absolute left-0 h-1.5 group-hover/bar:h-2 bg-indigo-500 rounded-full transition-all pointer-events-none"
          style={{ width: `${currentPercentage}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Seek audio"
        />
      </div>

      {/* Timing & Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Rewind */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => skipTime(-10)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => skipTime(10)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Forward 10s"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center Play Button */}
        <button
          onClick={togglePlay}
          disabled={isLoading && !isPlaying}
          className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform hover:scale-105 shadow-lg shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading || isBuffering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
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
            className="w-14 h-1 accent-indigo-500 cursor-pointer bg-slate-700 rounded-full hidden sm:block"
            aria-label="Audio volume"
          />
        </div>
      </div>
    </div>
  );
}
