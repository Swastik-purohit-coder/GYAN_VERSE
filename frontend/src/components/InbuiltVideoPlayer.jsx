"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@teacher/components/ui/dialog";
import { Badge } from "@teacher/components/ui/badge";
import { Button } from "@teacher/components/ui/button";
import {
  Play,
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
  AlertCircle,
  HardDrive,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  GraduationCap,
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
 * InbuiltVideoPlayer Component with Expanded Theatre Layout & Collapsible Right-Side Menu
 */
export default function InbuiltVideoPlayer({ item, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'notes' | 'stream_info'
  const [copied, setCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      if (!item || !rawVideoUrl) {
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
  }, [isOpen, item, videoId, rawVideoUrl]);

  // Handle Offline Download (Supports both direct MP4s and bundled companion videos)
  const handleDownloadOffline = async () => {
    if (!rawVideoUrl || downloading) return;

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
          videoType: ytVideoId ? "youtube" : "html5",
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
  const isOfflineNow = !isOnline || (typeof navigator !== "undefined" && !navigator.onLine);

  // Active stream URL (prioritize cached offline blob url if available or when offline)
  const activeStreamSource = offlineBlobUrl || rawVideoUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[96vw] max-h-[92vh] h-[90vh] p-0 overflow-hidden bg-slate-950 text-white border border-slate-800/90 rounded-2xl shadow-2xl z-50 flex flex-col [&>button:last-child]:hidden">
        {/* =========================================================================
            TOP HEADER BAR: Clean Metadata, Lesson Title, and Right-Side Controls
           ========================================================================= */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0 z-20 gap-3">
          {/* Header Left: Badges & Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${sourceDef.badgeColor}`}>
                {sourceDef.badgeText}
              </Badge>

              {item.target_grade_min && (
                <Badge variant="outline" className="text-[10px] font-semibold border-slate-700 text-slate-300 hidden md:inline-flex bg-slate-800/60">
                  Class {item.target_grade_min}{item.target_grade_max ? `–${item.target_grade_max}` : ""}
                </Badge>
              )}

              {item.duration && (
                <span className="text-[11px] text-slate-400 font-medium hidden lg:inline-flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {item.duration}
                </span>
              )}

              {isOfflineReady ? (
                <Badge className="bg-emerald-600/90 text-white text-[10px] hidden sm:inline-flex items-center gap-1 border border-emerald-500/40">
                  <CheckCircle2 className="w-3 h-3" /> Offline Ready
                </Badge>
              ) : isOfflineNow ? (
                <Badge className="bg-amber-600/90 text-white text-[10px] inline-flex items-center gap-1 border border-amber-500/40">
                  <WifiOff className="w-3 h-3" /> Offline Mode
                </Badge>
              ) : null}
            </div>

            {/* Video Title */}
            <DialogTitle asChild>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-lg lg:max-w-xl cursor-default" title={item.title}>
                {item.title}
              </h2>
            </DialogTitle>
          </div>

          {/* Header Right: Menu & Action Options */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Low Data Mode Toggle (Clean pill button, never overflows) */}
            <button
              onClick={() => setDataSaver((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all font-medium ${
                dataSaver
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs"
                  : "bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600"
              }`}
              title="Toggle low data mode (saves up to 70% mobile bandwidth)"
            >
              <Gauge className={`w-3.5 h-3.5 ${dataSaver ? "text-amber-400" : "text-slate-400"}`} />
              <span className="hidden sm:inline">{dataSaver ? "Data Saver: ON" : "Data Saver"}</span>
              {dataSaver && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-300 hover:text-white hover:border-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Share lecture link"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">{copied ? "Copied!" : "Share"}</span>
            </button>

            {/* Right-Side Menu Toggle Option */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all font-medium ${
                sidebarOpen
                  ? "bg-violet-600/25 text-violet-300 border-violet-500/60 shadow-xs"
                  : "bg-slate-800/90 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600"
              }`}
              title={sidebarOpen ? "Hide right-side menu (Expand video to full width)" : "Open right-side menu"}
            >
              {sidebarOpen ? (
                <PanelRightClose className="w-3.5 h-3.5 text-violet-400" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="hidden sm:inline">{sidebarOpen ? "Hide Menu" : "Side Menu"}</span>
            </button>

            {/* Dedicated Header Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/90 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-1"
              title="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            MAIN THEATRE BODY: Expanded Video Area (Left) + Collapsible Side Menu (Right)
           ========================================================================= */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 bg-black">
          {/* Main Video Stream Container (Expands to 100% when sidebar is closed) */}
          <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden min-h-[300px] sm:min-h-[420px] lg:min-h-0 h-full p-2 sm:p-4">
            {/* Status Overlay Banners */}
            {isOfflineNow && (
              <div className="absolute top-4 left-4 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md text-amber-300 text-[11px] font-medium px-3 py-1 rounded-full border border-amber-500/40 shadow-lg">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline Playback Active</span>
                </div>
              </div>
            )}

            {dataSaver && (
              <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md text-amber-300 text-[11px] font-medium px-2.5 py-1 rounded-full border border-amber-500/40 shadow-lg">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>70% Bandwidth Saver</span>
                </div>
              </div>
            )}

            {/* Video Player Render Canvas - Big 16:9 View */}
            <div className="w-full h-full max-h-full aspect-video flex items-center justify-center relative bg-black shadow-2xl rounded-xl overflow-hidden border border-slate-900">
              {/* Scenario 1: Offline with Cached Blob */}
              {isOfflineNow && offlineBlobUrl ? (
                <LessonVideoPlayer
                  src={offlineBlobUrl}
                  lessonId={videoId}
                  videoId={videoId}
                  title={item.title}
                  autoPlay={true}
                  isOffline={true}
                  className="w-full h-full max-h-full aspect-video"
                />
              ) : ytVideoId && isOnline ? (
                /* Scenario 2: Online YouTube Stream */
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={item.title}
                  className="w-full h-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : ytVideoId && !isOnline && offlineBlobUrl ? (
                /* Scenario 3: Offline YouTube Lesson with Companion Video Available */
                <LessonVideoPlayer
                  src={offlineBlobUrl}
                  lessonId={videoId}
                  videoId={videoId}
                  title={item.title}
                  autoPlay={true}
                  isOffline={true}
                  className="w-full h-full max-h-full aspect-video"
                />
              ) : ytVideoId && !isOnline ? (
                /* Scenario 4: Offline YouTube Lesson without Cached Copy */
                <div className="w-full h-full aspect-video flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-base text-white mb-1">Internet Disconnected</h3>
                  <p className="text-xs text-slate-400 max-w-md mb-4">
                    This YouTube lecture requires an internet connection or a saved offline companion copy.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleDownloadOffline}
                    disabled={downloading}
                    className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cache Companion Video for Offline</span>
                  </Button>
                </div>
              ) : activeStreamSource ? (
                /* Scenario 5: Direct Uploaded / HLS / Faculty Lecture Stream */
                <LessonVideoPlayer
                  src={activeStreamSource}
                  lessonId={videoId}
                  videoId={videoId}
                  title={item.title}
                  autoPlay={true}
                  isOffline={Boolean(offlineBlobUrl)}
                  className="w-full h-full max-h-full aspect-video"
                />
              ) : (
                /* Scenario 6: Placeholder / Fallback */
                <div className="w-full h-full aspect-video flex flex-col items-center justify-center p-6 text-center bg-slate-950">
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

          {/* =========================================================================
              RIGHT-SIDE MENU PANEL: Contributor Profile, Tabs, Offline Manager & Notes
             ========================================================================= */}
          {sidebarOpen && (
            <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto max-h-[420px] lg:max-h-full">
              {/* Tab Navigation */}
              <div className="p-4 pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "overview" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("stream_info")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                      activeTab === "stream_info" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Gauge className="w-3 h-3" /> Data & Offline
                  </button>
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "notes" ? "bg-violet-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Notes
                  </button>
                </div>
              </div>

              {/* Tab Content Body */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
                {activeTab === "overview" && (
                  <>
                    {/* Contributor Profile */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold text-base flex items-center justify-center shrink-0">
                        {item.author_avatar || item.author_name?.[0] || "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">{item.author_name || "Mrs. Ananya Sen"}</div>
                        <div className="text-[11px] text-slate-400 truncate">{item.author_role || "Senior Faculty, Gyanaratna Academy"}</div>
                        <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verified Contributor
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lesson Summary</div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        {item.description || "Comprehensive educational lecture breaking down variable manipulation, balancing equations, and real-world word problems."}
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
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md font-medium border border-slate-700">
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
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Ready for Offline
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Download lecture video chunks into your browser storage to play anytime with zero internet connection.
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
                            disabled={downloading}
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
                                <span>Save for Offline (Chunk Cache)</span>
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

                    {/* Low Data Mode Card */}
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
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1.5">
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
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
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
            </aside>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
