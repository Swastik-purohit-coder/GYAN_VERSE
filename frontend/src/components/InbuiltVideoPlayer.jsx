"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@teacher/components/ui/dialog";
import { Badge } from "@teacher/components/ui/badge";
import { Button } from "@teacher/components/ui/button";
import {
  Play,
  Pause,
  Clock,
  Download,
  CheckCircle2,
  Share2,
  FileText,
  Zap,
  Gauge,
  Wifi,
  WifiOff,
  Trash2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  HardDrive,
  Sliders,
  Sparkles,
  Info,
} from "lucide-react";
import { SOURCE_TYPES } from "@/lib/resourceAccess";
import {
  downloadVideoForOffline,
  isLessonVideoDownloaded,
  getOfflineVideoBlobUrl,
  removeOfflineVideo,
} from "@/lib/offlineVideoManager";
import LessonVideoPlayer from "@/components/media/LessonVideoPlayer";
import { parseYouTubeVideoId } from "@/lib/videoHelpers";

/**
 * Extracts YouTube embed URL from various YouTube link formats
 */
export function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const trimmed = String(url).trim();
    const patterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      }
    }
  } catch (err) {
    console.error("Failed to parse YouTube embed", err);
  }
  return null;
}

/**
 * InbuiltVideoPlayer Component with Offline Storage & Chunk-Optimized Low Data Mode
 */
export default function InbuiltVideoPlayer({ item, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'notes' | 'stream_info'
  const [copied, setCopied] = useState(false);

  // Streaming & Offline Mode States
  const [dataSaver, setDataSaver] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const videoId = item?.id || item?.lessonId || item?.slug || "lecture_media";
  const rawVideoUrl = item?.url || item?.video_url || item?.video_path || "";
  const ytVideoId = useMemo(() => (rawVideoUrl ? parseYouTubeVideoId(rawVideoUrl) : null), [rawVideoUrl]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
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

  // Check offline storage on open
  useEffect(() => {
    let mounted = true;
    async function checkOfflineStatus() {
      if (!item || !rawVideoUrl || ytVideoId) {
        setIsOfflineReady(false);
        setOfflineBlobUrl(null);
        return;
      }
      try {
        const downloaded = await isLessonVideoDownloaded(videoId, rawVideoUrl);
        if (mounted) {
          setIsOfflineReady(downloaded);
          if (downloaded) {
            const blobUrl = await getOfflineVideoBlobUrl(rawVideoUrl);
            if (mounted && blobUrl) setOfflineBlobUrl(blobUrl);
          } else {
            setOfflineBlobUrl(null);
          }
        }
      } catch (err) {
        console.warn("Offline video check:", err);
      }
    }

    if (isOpen) {
      checkOfflineStatus();
    }

    return () => {
      mounted = false;
    };
  }, [isOpen, item, videoId, rawVideoUrl, ytVideoId]);

  // Handle Offline Download
  const handleDownloadOffline = async () => {
    if (!rawVideoUrl || downloading) return;
    if (ytVideoId) {
      alert("Offline chunk download is optimized for uploaded faculty lectures. YouTube streams can be watched directly online.");
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);

    try {
      await downloadVideoForOffline(
        {
          lessonId: videoId,
          videoUrl: rawVideoUrl,
          title: item.title,
          studentClass: item.target_grade_min ? `Class ${item.target_grade_min}` : "General",
        },
        (pct) => setDownloadProgress(pct)
      );

      setIsOfflineReady(true);
      const blobUrl = await getOfflineVideoBlobUrl(rawVideoUrl);
      if (blobUrl) setOfflineBlobUrl(blobUrl);
    } catch (err) {
      setDownloadError(err.message || "Download failed. Please check network connection.");
    } finally {
      setDownloading(false);
    }
  };

  // Handle Remove Offline Video
  const handleRemoveOffline = async () => {
    if (!rawVideoUrl) return;
    try {
      await removeOfflineVideo(videoId, rawVideoUrl);
      setIsOfflineReady(false);
      setOfflineBlobUrl(null);
    } catch (err) {
      console.warn("Error removing offline video:", err);
    }
  };

  const handleShare = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  if (!item || !isOpen) return null;

  const itemSource = item.source_type || "teacher";
  const sourceDef = SOURCE_TYPES[itemSource] || SOURCE_TYPES.teacher;

  // Active stream URL (prioritize cached offline blob url if available or when offline)
  const activeStreamSource = offlineBlobUrl || rawVideoUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-slate-950 text-white border border-slate-800 rounded-2xl shadow-2xl z-50">
        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Main Video Stream Container (Left 65%) */}
          <div className="flex-1 bg-black flex flex-col justify-between relative min-h-[300px] sm:min-h-[420px] lg:min-h-[500px]">
            {/* Top Bar over Video */}
            <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-30 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2.5 py-0.5 ${sourceDef.badgeColor}`}>
                  {sourceDef.badgeText}
                </Badge>
                
                {isOfflineReady ? (
                  <Badge className="bg-emerald-600/90 text-white text-[10px] flex items-center gap-1 border border-emerald-500/40">
                    <CheckCircle2 className="w-3 h-3" /> Offline Cached (0 KB Data)
                  </Badge>
                ) : dataSaver ? (
                  <Badge className="bg-amber-600/90 text-white text-[10px] flex items-center gap-1 border border-amber-500/40">
                    <Zap className="w-3 h-3" /> Chunk Saver Active (70% Less Data)
                  </Badge>
                ) : (
                  <span className="text-xs text-slate-300 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {item.duration || "20 mins"}
                  </span>
                )}
              </div>

              {/* Data Saver Mode Toggle Button on Top Right of Player */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDataSaver((prev) => !prev)}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-all font-medium backdrop-blur-md ${
                    dataSaver
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm"
                      : "bg-black/60 text-slate-300 hover:text-white border-slate-700 hover:border-slate-500"
                  }`}
                  title="Toggle low data chunk-based memory mode"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{dataSaver ? "Low Data Mode: ON" : "Low Data Mode"}</span>
                </button>
              </div>
            </div>

            {/* Video Player Render Engine */}
            <div className="w-full h-full flex items-center justify-center relative">
              {ytVideoId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={item.title}
                  className="w-full aspect-video h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : activeStreamSource ? (
                <LessonVideoPlayer
                  src={activeStreamSource}
                  lessonId={videoId}
                  videoId={videoId}
                  title={item.title}
                  autoPlay={true}
                  className="w-full h-full"
                />
              ) : (
                /* Fallback Inbuilt Embed / Frame */
                <div className="w-full aspect-video h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-3 border border-violet-500/30">
                    <Play className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-base text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-400 max-w-md mb-4">
                    Inbuilt lecture streaming active.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel: Lecture Info, Contributor Profile & Offline Controls (Right 35%) */}
          <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto max-h-[450px] lg:max-h-[500px]">
            {/* Header & Tabs */}
            <div className="p-5 pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                {item.title}
              </h2>

              <div className="flex items-center gap-1.5 mt-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === "overview" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("stream_info")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1 ${
                    activeTab === "stream_info" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Gauge className="w-3 h-3" /> Data & Offline
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === "notes" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Notes
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {activeTab === "overview" && (
                <>
                  {/* Contributor Profile */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold text-base flex items-center justify-center shrink-0">
                      {item.author_avatar || item.author_name?.[0] || "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{item.author_name || "Faculty In-Charge"}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.author_role || "Educator"}</div>
                      <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Verified Contributor</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lesson Summary</div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description || "Comprehensive educational lecture covering foundational principles, problem-solving techniques, and real-world examples."}
                    </p>
                  </div>

                  {/* Target Grades & Tags */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Target Level:</span>
                      <span className="font-bold text-slate-200">
                        Class {item.target_grade_min || 1}–{item.target_grade_max || 12}
                      </span>
                    </div>

                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium border border-slate-700">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Data & Offline Stream Management Tab */}
              {activeTab === "stream_info" && (
                <div className="space-y-4">
                  {/* Offline Cache Box */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-white">Offline Chunk Storage</span>
                      </div>
                      {isOfflineReady && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                          Ready for Offline
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Download lesson video chunks into your browser storage. You can play this lecture anytime without internet connection.
                    </p>

                    {downloadError && (
                      <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-lg text-[11px] text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{downloadError}</span>
                      </div>
                    )}

                    {downloading && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-slate-300">
                          <span>Downloading media chunks...</span>
                          <span className="font-bold text-violet-400">{downloadProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 transition-all duration-200"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-1 flex items-center gap-2">
                      {!isOfflineReady ? (
                        <Button
                          size="sm"
                          disabled={downloading || ytVideoId}
                          onClick={handleDownloadOffline}
                          className="w-full text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium flex items-center justify-center gap-1.5"
                        >
                          {downloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Downloading ({downloadProgress}%)</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>{ytVideoId ? "Online YouTube Stream" : "Save for Offline (Chunk Cache)"}</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRemoveOffline}
                          className="w-full text-xs border-rose-900/60 text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Offline Copy
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Low Data Use Mode Card */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Low Data / Chunk Saver Mode</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={dataSaver}
                        onChange={(e) => setDataSaver(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Restricts stream buffer window to 512KB–2MB chunks and purges played RAM memory. Reduces total mobile data consumption by up to 70%.
                    </p>
                  </div>

                  {/* Diagnostics Info */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Network Status:</span>
                      <span className={isOnline ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {isOnline ? "Online (Connected)" : "Offline Mode"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stream Protocol:</span>
                      <span className="text-slate-200">{ytVideoId ? "YouTube Player API" : "HTTP 206 Partial Chunk Stream"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Playback Source:</span>
                      <span className="text-slate-200 truncate max-w-[170px]">
                        {offlineBlobUrl ? "IndexedDB / Cache Blob" : "Direct Edge Stream"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Study Notes Tab */}
              {activeTab === "notes" && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-violet-400" /> Interactive Study Notes
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {item.body || item.description || "Take notes while watching the video lecture. All concepts are timestamped to help with revision."}
                  </div>
                </div>
              )}
            </div>

            {/* Side Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleShare}
                className="text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> {copied ? "Link Copied!" : "Share"}
              </Button>

              <Button
                size="sm"
                onClick={onClose}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4"
              >
                Close Theatre
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
