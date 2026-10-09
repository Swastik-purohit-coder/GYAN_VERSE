import apiClient from "@/lib/api";
import {
  db,
  cacheApiResponse,
  getCachedApiResponse,
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
  getLocalProgressMap,
} from "@/lib/offlineDb";

/**
 * Offline Repository - Local-First Data Abstraction Layer
 *
 * Implements Stale-While-Revalidate with IndexedDB persistence:
 * 1. Returns fresh data from network when online and updates IndexedDB cache.
 * 2. Seamlessly serves cached data when offline without throwing unhandled exceptions.
 * 3. Enriches offline data with locally stored pending progress and quiz attempts.
 */

export const DEFAULT_OFFLINE_SUBJECTS = [
  { id: "subject:math", name: "Mathematics", description: "Arithmetic, Algebra, Geometry, and Problem Solving", class: "all", icon: "🔢", color: "#10b981" },
  { id: "subject:science", name: "Science", description: "Physics, Chemistry, Biology, and Natural Sciences", class: "all", icon: "🔬", color: "#3b82f6" },
  { id: "subject:social", name: "Social Science", description: "History, Geography, Civics, and Social Studies", class: "all", icon: "🌍", color: "#8b5cf6" },
  { id: "subject:english", name: "English", description: "Grammar, Reading Comprehension, and Literature", class: "all", icon: "📚", color: "#f59e0b" },
  { id: "subject:hindi", name: "Hindi / Local Language", description: "Language skills, literature, and regional studies", class: "all", icon: "✍️", color: "#ec4899" },
  { id: "subject:cs", name: "Digital Literacy & Computer", description: "Computer basics, internet safety, and software tools", class: "all", icon: "💻", color: "#06b6d4" },
  { id: "subject:evs", name: "Environmental Studies (EVS)", description: "Environment, ecology, health, and sustainability", class: "all", icon: "🌱", color: "#22c55e" },
];

export async function getOfflineLearningModules(options = {}) {
  const cacheKey = "student_learning_modules";

  // 1. If online, fetch from network and update cache
  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const networkData = await apiClient.getStudentModules(options);
      if (networkData && Array.isArray(networkData.modules) && networkData.modules.length > 0) {
        await cacheApiResponse(cacheKey, networkData);
        return networkData;
      }
    } catch (err) {
      console.warn("[OfflineRepo] Network fetch failed, falling back to local cache:", err.message);
    }
  }

  // 2. Read from IndexedDB cachedApi
  const cached = await getCachedApiResponse(cacheKey);
  if (cached && Array.isArray(cached.modules) && cached.modules.length > 0) {
    // Merge local lesson progress from IndexedDB
    const localProgressMap = await getLocalProgressMap();
    const enrichedModules = cached.modules.map((mod) => {
      const enrichedLessons = (mod.lessons || []).map((les) => {
        const localProg = localProgressMap[les.id];
        if (localProg) {
          return {
            ...les,
            progress: {
              completed: Boolean(localProg.completed),
              lastPosition: localProg.lastPosition || 0,
              completedAt: localProg.completedAt || null,
            },
          };
        }
        return les;
      });

      const totalLessons = enrichedLessons.length;
      const completedLessons = enrichedLessons.filter((l) => l.progress?.completed).length;

      return {
        ...mod,
        lessons: enrichedLessons,
        stats: {
          totalLessons,
          completedLessons,
          isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        },
      };
    });

    return {
      ...cached,
      modules: enrichedModules,
      isOfflineFallback: true,
    };
  }

  // 3. Fallback default offline modules so students always have access offline
  const rawTargetClass = options?.class || (typeof window !== "undefined" ? localStorage.getItem("studentClass") : null) || "Class 8";
  const numMatch = String(rawTargetClass).match(/\d+/);
  const canonicalNum = numMatch ? numMatch[0] : "8";
  const targetClass = `Class ${canonicalNum}`;
  const localProgressMap = await getLocalProgressMap();

  try {
    const { DEFAULT_COURSE_SUBJECTS, DEFAULT_COURSE_VIDEOS } = await import("@/lib/coursesDefaultData");
    const classSubjects = DEFAULT_COURSE_SUBJECTS.filter((s) => s.class === targetClass);

    if (classSubjects.length > 0) {
      const builtModules = classSubjects.map((subj) => {
        const subjVideos = DEFAULT_COURSE_VIDEOS.filter((v) => v.subject_id === subj.id);
        const enrichedLessons = (subjVideos.length > 0 ? subjVideos : []).map((v, idx) => ({
          id: v.id,
          module_id: subj.id,
          title: v.title,
          description: v.description,
          video_url: v.youtube_url || "/home.mp4",
          video_type: "youtube",
          duration: v.duration || 480,
          order_index: v.display_order || idx + 1,
          is_required: true,
          progress: {
            completed: Boolean(localProgressMap[v.id]?.completed),
            lastPosition: localProgressMap[v.id]?.lastPosition || 0,
          },
        }));

        const totalLessons = enrichedLessons.length;
        const completedLessons = enrichedLessons.filter((l) => l.progress?.completed).length;

        return {
          id: subj.id,
          title: `${subj.subject_name} (${targetClass})`,
          description: `Core curriculum lessons and interactive modules for ${targetClass} ${subj.subject_name}.`,
          class: targetClass,
          subject: { id: subj.id, name: subj.subject_name },
          lessons: enrichedLessons,
          stats: {
            totalLessons,
            completedLessons,
            isCompleted: totalLessons > 0 && completedLessons === totalLessons,
          },
        };
      });

      return {
        modules: builtModules,
        studentClass: targetClass,
        isOfflineFallback: true,
      };
    }
  } catch (err) {
    console.warn("[OfflineRepo] Failed to build default modules from coursesDefaultData:", err);
  }

  const defaultLessons = [
    {
      id: "les_off_1",
      title: "Foundational Motion & Energy",
      order_index: 1,
      duration: 360,
      is_required: true,
      video_url: "/home.mp4",
      progress: {
        completed: Boolean(localProgressMap["les_off_1"]?.completed),
        lastPosition: localProgressMap["les_off_1"]?.lastPosition || 0,
      },
    },
    {
      id: "les_off_2",
      title: "Fractions, Decimals & Proportions",
      order_index: 2,
      duration: 420,
      is_required: true,
      video_url: "/home.mp4",
      progress: {
        completed: Boolean(localProgressMap["les_off_2"]?.completed),
        lastPosition: localProgressMap["les_off_2"]?.lastPosition || 0,
      },
    },
  ];

  const totalLessons = defaultLessons.length;
  const completedLessons = defaultLessons.filter((l) => l.progress?.completed).length;

  return {
    modules: [
      {
        id: "mod_offline_foundations",
        title: `Curriculum Essentials (${targetClass})`,
        description: "Core STEM foundations & interactive practice available offline.",
        class: targetClass,
        lessons: defaultLessons,
        stats: {
          totalLessons,
          completedLessons,
          isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        },
      },
    ],
    studentClass: targetClass,
    isOfflineFallback: true,
  };
}

export async function getOfflineSubjects(filter = {}) {
  const classVal = filter.class || filter.classFilter || "all";
  const cacheKey = `subjects_${classVal}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getSubjects(filter);
      if (Array.isArray(data) && data.length > 0) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Subjects network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  return DEFAULT_OFFLINE_SUBJECTS;
}

export async function getOfflineQuizzes(filters = {}) {
  const cacheKey = `quizzes_${JSON.stringify(filters)}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getQuizzes(filters);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Quizzes network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // Fallback default quizzes for student's class
  try {
    const { DEFAULT_OFFLINE_QUIZZES } = await import("@/lib/offline/offlineQuizData");
    const rawClass = String(filters.class || (typeof window !== "undefined" ? localStorage.getItem("studentClass") : "") || "Class 10").trim();
    const numMatch = rawClass.match(/\d+/);
    const cleanNum = numMatch ? numMatch[0] : "";
    const canonicalName = cleanNum ? `Class ${cleanNum}` : rawClass;

    const filtered = DEFAULT_OFFLINE_QUIZZES.filter((q) => {
      const qNumMatch = String(q.className || "").match(/\d+/);
      const qCleanNum = qNumMatch ? qNumMatch[0] : "";
      return qCleanNum === cleanNum || q.className === canonicalName || q.className === rawClass;
    });

    return filtered.length > 0 ? filtered : DEFAULT_OFFLINE_QUIZZES;
  } catch (err) {
    console.warn("[OfflineRepo] Failed to load default offline quizzes:", err);
    return [];
  }
}

export async function getOfflineQuizQuestions(params = {}) {
  const cacheKey = `quiz_questions_${params.quizId || "all"}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getQuizQuestions(params);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Quiz questions network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // Fallback questions for this quiz
  try {
    const { DEFAULT_OFFLINE_QUESTIONS } = await import("@/lib/offline/offlineQuizData");
    if (params.quizId && DEFAULT_OFFLINE_QUESTIONS[params.quizId]) {
      return DEFAULT_OFFLINE_QUESTIONS[params.quizId];
    }
    // Return first available questions array if generic match
    const firstKey = Object.keys(DEFAULT_OFFLINE_QUESTIONS)[0];
    return firstKey ? DEFAULT_OFFLINE_QUESTIONS[firstKey] : [];
  } catch (err) {
    console.warn("[OfflineRepo] Failed to load default offline questions:", err);
    return [];
  }
}

export async function getOfflineStreak(userId) {
  const cacheKey = `streak_${userId}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getStreak(userId);
      if (data) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.warn("[OfflineRepo] Streak network fetch failed, using cache:", e.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  return (
    cached || {
      userId,
      currentStreak: 0,
      lastCompletionDate: null,
      isOffline: true,
    }
  );
}

/**
 * Offline-first Courses fetching with fallback to DEFAULT_COURSE_SUBJECTS/VIDEOS
 */
export async function getOfflineCourses(studentClass = null) {
  const cacheKey = "courses_data";

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const networkData = await apiClient.getCourses();
      if (networkData && Array.isArray(networkData.subjects)) {
        await cacheApiResponse(cacheKey, networkData);
        return networkData;
      }
    } catch (err) {
      console.warn("[OfflineRepo] Courses network fetch failed, using cache/defaults:", err.message);
    }
  }

  // Check cache
  const cached = await getCachedApiResponse(cacheKey);
  if (cached && Array.isArray(cached.subjects) && cached.subjects.length > 0) {
    return {
      ...cached,
      isOfflineFallback: true,
    };
  }

  // Construct default offline curriculum from coursesDefaultData
  try {
    const { DEFAULT_COURSE_SUBJECTS, DEFAULT_COURSE_VIDEOS } = await import("@/lib/coursesDefaultData");
    const targetClass = studentClass || (typeof window !== "undefined" ? localStorage.getItem("studentClass") : null) || "Class 6";
    const numMatch = String(targetClass).match(/\d+/);
    const cleanNum = numMatch ? numMatch[0] : "6";
    const canonicalName = `Class ${cleanNum}`;

    let matchingSubjects = DEFAULT_COURSE_SUBJECTS.filter((s) => s.class === canonicalName || s.class === targetClass);
    if (!matchingSubjects.length) {
      matchingSubjects = DEFAULT_COURSE_SUBJECTS.slice(0, 3);
    }

    const localProgressMap = await getLocalProgressMap();

    const enrichedSubjects = matchingSubjects.map((subj) => {
      const vids = DEFAULT_COURSE_VIDEOS.filter((v) => v.subject_id === subj.id);
      const enrichedVideos = vids.map((v) => {
        const prog = localProgressMap[v.id];
        const isComp = Boolean(prog?.completed);
        const pos = prog?.lastPosition || 0;
        const dur = v.duration || 300;
        const pct = isComp ? 100 : dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
        return {
          ...v,
          youtubeUrl: v.youtube_url,
          displayOrder: v.display_order,
          progress: {
            lastPosition: pos,
            duration: dur,
            completed: isComp,
            completionPct: pct,
          },
        };
      });

      const totalVideos = enrichedVideos.length;
      const completedVideos = enrichedVideos.filter((v) => v.progress?.completed).length;
      const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        id: subj.id,
        subjectName: subj.subject_name,
        icon: subj.icon,
        class: subj.class,
        displayOrder: subj.display_order,
        videos: enrichedVideos,
        totalVideos,
        completedVideos,
        progressPercent,
      };
    });

    return {
      studentClass: canonicalName,
      canonicalClassName: canonicalName,
      subjects: enrichedSubjects,
      isOfflineFallback: true,
    };
  } catch (seedErr) {
    console.warn("[OfflineRepo] Failed to load offline courses defaults:", seedErr);
    return {
      studentClass: null,
      canonicalClassName: null,
      subjects: [],
      isOfflineFallback: true,
    };
  }
}

/**
 * Offline-first Student Dashboard with Dexie caching and synthetic offline stats
 */
export async function getOfflineStudentDashboard(studentId) {
  if (!studentId) return null;
  const cacheKey = `student_dashboard_${studentId}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getStudentDashboard(studentId);
      if (data) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn("[OfflineRepo] Student dashboard network fetch failed, using cache:", err.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (cached) {
    return {
      ...cached,
      isOfflineFallback: true,
    };
  }

  // Synthetic fallback when offline with no prior cache
  try {
    const localProgressMap = await getLocalProgressMap();
    const completedCount = Object.values(localProgressMap).filter((p) => p.completed).length;
    const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : "student";
    const localName = typeof window !== "undefined" ? localStorage.getItem("userName") : "Student";
    const localClass = typeof window !== "undefined" ? (localStorage.getItem("studentClass") || localStorage.getItem("student_class")) : "Class 8";
    const localSchoolId = typeof window !== "undefined" ? localStorage.getItem("schoolId") : "School";

    return {
      student: {
        id: studentId,
        role: localRole || "student",
        name: localName || "Student",
        class: localClass || "Class 8",
        schoolId: localSchoolId || "School",
      },
      stats: {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        lessonsCompleted: completedCount,
      },
      recentActivity: [],
      isOfflineFallback: true,
    };
  } catch {
    return null;
  }
}

/**
 * Offline-first Student Progress with local IndexedDB quiz attempts
 */
export async function getOfflineStudentProgress(studentId) {
  if (!studentId) return null;
  const cacheKey = `student_progress_${studentId}`;

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getStudentProgress(studentId);
      if (data) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn("[OfflineRepo] Student progress network fetch failed, using cache:", err.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (cached) {
    return {
      ...cached,
      isOfflineFallback: true,
    };
  }

  // Build progress from local Dexie IndexedDB
  try {
    const localProgressMap = await getLocalProgressMap();
    const attempts = await db.quizAttempts.where("studentId").equals(studentId).toArray().catch(() => []);

    const totalQuizzes = attempts.length;
    const totalScore = attempts.reduce((acc, a) => acc + (Number(a.score) || 0), 0);
    const averageScore = totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0;
    const bestScore = attempts.reduce((max, a) => Math.max(max, Number(a.score) || 0), 0);

    return {
      summary: {
        totalQuizzes,
        averageScore,
        bestScore,
        lessonsCompleted: Object.values(localProgressMap).filter((p) => p.completed).length,
      },
      recentActivity: attempts.slice(-5).map((a) => ({
        quizId: a.quizId,
        subject: a.subject || "General",
        score: a.score,
        timeSpent: a.timeSpent || 0,
        submittedAt: a.completedAt,
      })),
      isOfflineFallback: true,
    };
  } catch {
    return {
      summary: { totalQuizzes: 0, averageScore: 0, bestScore: 0, lessonsCompleted: 0 },
      recentActivity: [],
      isOfflineFallback: true,
    };
  }
}

/**
 * Offline-first School Content with fallback to SEED_EDUCATIONAL_MATERIALS
 */
export async function getOfflineSchoolContent(schoolId, options = {}) {
  const cacheKey = `school_content_${schoolId || "all"}_${JSON.stringify(options)}`;

  if (schoolId && typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const data = await apiClient.getSchoolContent(schoolId, options);
      if (Array.isArray(data)) {
        await cacheApiResponse(cacheKey, data);
        return data;
      }
    } catch (err) {
      console.warn("[OfflineRepo] School content network fetch failed, using cache:", err.message);
    }
  }

  const cached = await getCachedApiResponse(cacheKey);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  try {
    const { SEED_EDUCATIONAL_MATERIALS } = await import("@/lib/resourceAccess");
    return SEED_EDUCATIONAL_MATERIALS;
  } catch {
    return [];
  }
}

export {
  saveLocalLessonProgress,
  saveOfflineQuizAttempt,
};

