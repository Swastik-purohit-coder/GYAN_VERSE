import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "../_utils/supabase";
import { getYouTubeVideoId } from "@/lib/videoHelpers";
import { DEFAULT_COURSE_SUBJECTS, DEFAULT_COURSE_VIDEOS } from "@/lib/coursesDefaultData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/courses
 *
 * Fetches class-specific YouTube courses for the authenticated student.
 * System 2: Independent from teacher learning_modules.
 *
 * Rules:
 * 1. Authenticate student via Clerk.
 * 2. Look up student's class from user_roles (server-side only, no client trust).
 * 3. Filter course_subjects strictly by student.class (school_id is NOT used).
 * 4. Fetch active course_videos for those subjects.
 * 5. Fetch student's course_video_progress to calculate completion percentage.
 */
export async function GET() {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    // 1. Fetch Student Profile from user_roles
    let roleDoc = null;
    let roleErr = null;
    try {
      const { data: rData, error: rError } = await supabase
        .from("user_roles")
        .select("user_id, role, name, class, school_id")
        .eq("user_id", userId)
        .maybeSingle();
      roleDoc = rData;
      roleErr = rError;
    } catch (e) {
      console.warn("[/api/courses] user_roles query failed:", e.message);
      roleErr = e;
    }

    const studentClass = roleDoc?.class || null;

    if (!studentClass) {
      return NextResponse.json({
        studentClass: null,
        subjects: [],
        message: "Student class must be set in your profile to view courses.",
      });
    }

    const rawClass = String(studentClass).trim();
    const numMatch = rawClass.match(/\d+/);
    const cleanNum = numMatch ? numMatch[0] : "";
    const canonicalClassName = cleanNum ? `Class ${cleanNum}` : rawClass;

    const classCandidates = Array.from(
      new Set([rawClass, canonicalClassName, cleanNum ? `class ${cleanNum}` : null, cleanNum].filter(Boolean))
    );

    // 2. Fetch Course Subjects for the student's class
    let dbSubjects = [];
    let isTableMissing = false;

    try {
      const { data: subData, error: sErr } = await supabase
        .from("course_subjects")
        .select("id, class, subject_name, display_order, icon, is_active, created_at, updated_at")
        .in("class", classCandidates)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (sErr) {
        if (sErr.code === "PGRST205" || sErr.message?.includes("does not exist") || sErr.message?.includes("schema cache")) {
          isTableMissing = true;
        } else {
          console.warn("[/api/courses] course_subjects query error:", sErr.message);
        }
      } else if (subData) {
        dbSubjects = subData;
      }
    } catch (e) {
      console.warn("[/api/courses] course_subjects fetch exception:", e.message);
      isTableMissing = true;
    }

    // Resilient fallback to curated defaults if DB table is not yet provisioned
    let subjects = dbSubjects;
    let usingFallback = false;

    if (isTableMissing || (subjects.length === 0 && DEFAULT_COURSE_SUBJECTS.some((s) => classCandidates.includes(s.class)))) {
      const fallbackSubs = DEFAULT_COURSE_SUBJECTS.filter((s) => classCandidates.includes(s.class) && s.is_active);
      if (fallbackSubs.length > 0) {
        subjects = fallbackSubs;
        usingFallback = true;
      }
    }

    if (subjects.length === 0) {
      return NextResponse.json({
        studentClass,
        canonicalClassName,
        subjects: [],
        message: `No course videos are available for ${canonicalClassName} yet.`,
      });
    }

    const subjectIds = subjects.map((s) => s.id);

    // 3. Fetch Course Videos for these subjects
    let videos = [];
    if (!usingFallback) {
      try {
        const { data: vidData, error: vErr } = await supabase
          .from("course_videos")
          .select("id, subject_id, title, description, youtube_url, thumbnail_url, duration, display_order, is_active")
          .in("subject_id", subjectIds)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!vErr && vidData) {
          videos = vidData;
        }
      } catch (e) {
        console.warn("[/api/courses] course_videos query error:", e.message);
      }
    }

    if (usingFallback || videos.length === 0) {
      videos = DEFAULT_COURSE_VIDEOS.filter((v) => subjectIds.includes(v.subject_id) && v.is_active);
    }

    // 4. Fetch Student Progress for these videos
    const videoIds = videos.map((v) => v.id);
    let progressMap = {};

    if (videoIds.length > 0) {
      try {
        const { data: progData, error: pErr } = await supabase
          .from("course_video_progress")
          .select("video_id, last_position, duration, completion_pct, completed, completed_at, updated_at")
          .eq("student_id", userId)
          .in("video_id", videoIds);

        if (!pErr && progData) {
          progData.forEach((p) => {
            progressMap[p.video_id] = p;
          });
        }
      } catch (e) {
        console.warn("[/api/courses] course_video_progress query error:", e.message);
      }
    }

    // Group videos by subject
    const videosBySubject = {};
    videos.forEach((vid) => {
      if (!videosBySubject[vid.subject_id]) {
        videosBySubject[vid.subject_id] = [];
      }

      const videoId = getYouTubeVideoId(vid.youtube_url);
      const thumbnail =
        vid.thumbnail_url ||
        (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

      const prog = progressMap[vid.id] || null;

      videosBySubject[vid.subject_id].push({
        id: vid.id,
        subjectId: vid.subject_id,
        title: vid.title,
        description: vid.description,
        youtubeUrl: vid.youtube_url,
        videoId,
        thumbnailUrl: thumbnail,
        duration: vid.duration || 0,
        displayOrder: vid.display_order || 1,
        progress: {
          completed: Boolean(prog?.completed),
          lastPosition: prog?.last_position || 0,
          completionPct: prog?.completion_pct || (prog?.completed ? 100 : 0),
          completedAt: prog?.completed_at || null,
        },
      });
    });

    // 5. Assemble enriched subjects
    const enrichedSubjects = subjects.map((subj) => {
      const subjectVideos = (videosBySubject[subj.id] || []).sort(
        (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
      );

      const totalVideos = subjectVideos.length;
      const completedVideos = subjectVideos.filter((v) => v.progress.completed).length;
      const progressPercent =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        id: subj.id,
        class: subj.class,
        subjectName: subj.subject_name || subj.name,
        displayOrder: subj.display_order || 1,
        icon: subj.icon || "BookOpen",
        totalVideos,
        completedVideos,
        progressPercent,
        videos: subjectVideos,
      };
    });

    return NextResponse.json(
      {
        studentClass,
        canonicalClassName,
        subjects: enrichedSubjects,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[/api/courses] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch class courses" },
      { status: 500 }
    );
  }
}
