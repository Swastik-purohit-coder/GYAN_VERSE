"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/student/components/ui/badge";
import { Button } from "@/student/components/ui/button";
import { X, CheckCircle2, Circle, Loader2, Video, Headphones, Wifi, WifiOff } from "lucide-react";
import { getVideoType } from "@/lib/videoHelpers";
import { saveLocalLessonProgress } from "@/lib/offlineDb";
import LessonVideoPlayer from "@/components/media/LessonVideoPlayer";
import LessonAudioPlayer from "@/components/media/LessonAudioPlayer";

export default function VideoPlayer({
  lesson,
  module,
  initialMode = "video",
  offlineBlobUrl,
  onClose,
  onComplete,
  updatingLessonId,
  downloadState,
}) {
  const [dataSaver, setDataSaver] = useState(false);
  const [networkType, setNetworkType] = useState("unknown");
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if (typeof navigator !== "undefined" && navigator.connection) {
        const type = navigator.connection.effectiveType;
        if (type === "slow-2g" || type === "2g") {
          setNetworkType("poor");
          setDataSaver(true);
        } else if (type === "3g") {
          setNetworkType("moderate");
        } else if (type === "4g") {
          setNetworkType("good");
        } else {
          setNetworkType("unknown");
        }
      }
    };

    updateNetworkInfo();
    if (typeof navigator !== "undefined" && navigator.connection) {
      navigator.connection.addEventListener("change", updateNetworkInfo);
      return () => navigator.connection.removeEventListener("change", updateNetworkInfo);
    }
  }, []);

  if (!lesson) return null;

  const rawVideo = offlineBlobUrl || lesson.video_url || lesson.video_path || lesson.videoUrl;
  const rawAudio = lesson.audio_url || lesson.audio_path || lesson.audioUrl;
  const hasVideo = Boolean(rawVideo);
  const hasAudio = Boolean(rawAudio);

  const [mediaMode, setMediaMode] = useState(
    initialMode === "audio" && hasAudio ? "audio" : hasVideo ? "video" : hasAudio ? "audio" : "video"
  );

  const vType = getVideoType(rawVideo);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const resolvedStreamUrl = offlineBlobUrl
    ? offlineBlobUrl
    : isOffline
    ? "/home.mp4"
    : vType === "youtube"
    ? rawVideo
    : rawVideo && rawVideo.startsWith("http")
    ? rawVideo
    : `/api/media/video/${encodeURIComponent(lesson.id || rawVideo)}`;

  const resolvedAudioUrl = rawAudio && rawAudio.startsWith("http")
    ? rawAudio
    : rawAudio
    ? `/api/media/audio/${encodeURIComponent(lesson.id || rawAudio)}`
    : null;

  const posterUrl = lesson.thumbnail_url || `/api/media/thumbnail/${encodeURIComponent(lesson.id)}`;

  const handleProgressUpdate = (prog) => {
    if (!lesson.id) return;
    saveLocalLessonProgress({
      lessonId: lesson.id,
      completed: prog.completed,
      lastPosition: prog.lastPosition,
      action: prog.completed ? "complete" : "progress",
    }).catch((e) => console.warn("Background progress save:", e));
  };

  const handleLessonAutoCompleted = () => {
    if (!lesson.progress?.completed && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden text-white flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0 gap-3">
          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-indigo-600 text-white text-[10px]">
                {module?.title || "Module"}
              </Badge>
              <span className="text-xs text-slate-400">
                Lesson {lesson.order_index || 1}
              </span>
              {downloadState?.isDownloaded && (
                <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Offline Ready
                </Badge>
              )}
              {isOffline && (
                <Badge className="bg-amber-500 text-white text-[10px] flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline Mode
                </Badge>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              {lesson.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Media Switcher when both Video & Audio exist */}
            {hasVideo && hasAudio && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setMediaMode("video")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    mediaMode === "video"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaMode("audio")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    mediaMode === "audio"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Audio Track</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Close media player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Player Area: Video or Audio */}
        {mediaMode === "video" ? (
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            {!resolvedStreamUrl ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Video className="w-12 h-12 mx-auto text-slate-600" />
                <p>Video content is currently processing or unavailable.</p>
                {hasAudio && (
                  <Button
                    size="sm"
                    onClick={() => setMediaMode("audio")}
                    className="bg-violet-600 hover:bg-violet-700 text-white text-xs mt-2"
                  >
                    <Headphones className="w-3.5 h-3.5 mr-1" /> Listen to Audio Version
                  </Button>
                )}
              </div>
            ) : (
              <LessonVideoPlayer
                src={resolvedStreamUrl}
                lessonId={lesson.id}
                videoId={lesson.id}
                title={lesson.title}
                poster={posterUrl}
                initialPosition={lesson.progress?.lastPosition || 0}
                duration={lesson.duration || 0}
                autoPlay={!dataSaver}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleLessonAutoCompleted}
                offlineBlobUrl={offlineBlobUrl}
                className="w-full h-full"
              />
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full max-w-xl">
              <LessonAudioPlayer
                src={resolvedAudioUrl || rawAudio}
                lessonId={lesson.id}
                audioId={lesson.id}
                title={lesson.title}
                duration={lesson.duration || 0}
                initialPosition={lesson.progress?.lastPosition || 0}
                onProgressUpdate={handleProgressUpdate}
                onComplete={handleLessonAutoCompleted}
                autoPlay={true}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Lower Controls & Info */}
        <div className="p-3 sm:p-4 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 border-t border-slate-800/80">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-1">
                  {networkType === "poor" ? (
                    <WifiOff className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  Network:
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-bold uppercase ${
                    networkType === "good"
                      ? "text-emerald-400"
                      : networkType === "moderate"
                      ? "text-yellow-400"
                      : networkType === "poor"
                      ? "text-red-400"
                      : "text-slate-400"
                  }`}
                >
                  {networkType}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs sm:text-sm text-slate-300 font-medium">Data Saver</label>
                <button
                  onClick={() => setDataSaver(!dataSaver)}
                  className={`relative inline-flex h-4.5 w-8.5 items-center rounded-full transition-colors ${
                    dataSaver ? "bg-indigo-500" : "bg-slate-600"
                  }`}
                  aria-label="Toggle data saver"
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      dataSaver ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 text-left underline underline-offset-2"
            >
              {showDebug ? "Hide Stream Diagnostics" : "Show Stream Diagnostics"}
            </button>

            {showDebug && (
              <div className="bg-slate-950 p-2 rounded-md text-[11px] text-slate-400 font-mono mt-1 w-full max-w-sm border border-slate-800">
                <div>Type: {vType.toUpperCase()}</div>
                <div>Protocol: HTTP Range 206 Stream</div>
                <div>Endpoint: {resolvedStreamUrl}</div>
                <div>Low RAM Mode: Active (preload=metadata)</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-auto w-full sm:w-auto justify-end">
            <Button
              onClick={(e) => onComplete(e)}
              disabled={updatingLessonId === lesson.id}
              className={
                lesson.progress?.completed
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium"
              }
            >
              {updatingLessonId === lesson.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : lesson.progress?.completed ? (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              ) : (
                <Circle className="w-4 h-4 mr-1.5" />
              )}
              {lesson.progress?.completed ? "Completed" : "Mark as Complete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

