import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";

export function useCourses() {
  const [data, setData] = useState({
    studentClass: null,
    canonicalClassName: null,
    subjects: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.getCourses();
      setData({
        studentClass: res.studentClass || null,
        canonicalClassName: res.canonicalClassName || res.studentClass || null,
        subjects: Array.isArray(res.subjects) ? res.subjects : [],
        message: res.message || null,
      });
    } catch (err) {
      console.error("useCourses fetch error:", err);
      setError(err?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const updateVideoProgress = useCallback(
    async ({ videoId, lastPosition = 0, duration = 0, completed = false }) => {
      // Optimistic update in local state
      setData((prev) => {
        if (!prev?.subjects) return prev;

        const updatedSubjects = prev.subjects.map((subj) => {
          let hasVideo = false;
          const updatedVideos = (subj.videos || []).map((v) => {
            if (v.id === videoId) {
              hasVideo = true;
              const pos = Math.max(0, Math.round(Number(lastPosition) || 0));
              const dur = Math.max(0, Math.round(Number(duration) || v.duration || 0));
              const isComp = Boolean(completed || (dur > 0 && pos >= dur * 0.9));
              const pct = isComp ? 100 : dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;

              return {
                ...v,
                progress: {
                  ...v.progress,
                  lastPosition: pos,
                  completionPct: pct,
                  completed: isComp,
                },
              };
            }
            return v;
          });

          if (!hasVideo) return subj;

          const totalVideos = updatedVideos.length;
          const completedVideos = updatedVideos.filter((v) => v.progress?.completed).length;
          const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

          return {
            ...subj,
            videos: updatedVideos,
            completedVideos,
            progressPercent,
          };
        });

        return { ...prev, subjects: updatedSubjects };
      });

      // Background network sync
      try {
        await apiClient.saveCourseVideoProgress({
          videoId,
          lastPosition,
          duration,
          completed,
        });
      } catch (err) {
        console.warn("Failed to persist course video progress:", err);
      }
    },
    []
  );

  return {
    studentClass: data.studentClass,
    canonicalClassName: data.canonicalClassName,
    subjects: data.subjects,
    message: data.message,
    loading,
    error,
    refetch: fetchCourses,
    updateVideoProgress,
  };
}
