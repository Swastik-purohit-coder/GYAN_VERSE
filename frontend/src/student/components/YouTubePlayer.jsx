"use client";

import { useEffect, useRef, useState } from "react";
import { getYouTubeVideoId } from "@/lib/videoHelpers";
import { saveLocalLessonProgress } from "@/lib/offlineDb";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const videoId = getYouTubeVideoId(url);

  useEffect(() => {
    if (!videoId) return;

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
    };

    const initPlayer = () => {
      if (playerRef.current) return;

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
    };

    loadYouTubeAPI();

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, autoPlay, dataSaver, courseVideoId, onProgress, onEnded]);

  // Track playback position periodically
  useEffect(() => {
    if (!isPlaying || !playerReady) return;

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
  }, [isPlaying, playerReady, lessonId, courseVideoId, onProgress]);

  if (!videoId) {
    return <div className="p-4 text-white">Invalid YouTube URL</div>;
  }

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
