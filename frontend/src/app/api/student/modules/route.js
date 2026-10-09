import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase, run, runSingle } from "../../_utils/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const url = new URL(request.url);
    const paramClass = url.searchParams.get("class");
    const paramSchoolId = url.searchParams.get("schoolId");

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
      console.warn("[/api/student/modules] user_roles query failed:", e.message);
      roleErr = e;
    }

    let studentClass = roleDoc?.class || paramClass || null;
    const schoolId = roleDoc?.school_id || paramSchoolId || null;

    if (!studentClass) {
      try {
        const { currentUser } = await import("@clerk/nextjs/server");
        const clerkUser = await currentUser();
        studentClass = clerkUser?.unsafeMetadata?.class || clerkUser?.publicMetadata?.class || null;
      } catch {}
    }

    if (!studentClass) {
      return NextResponse.json({
        modules: [],
        studentClass: null,
        schoolId,
        message: "Student class must be set in your profile to view learning modules.",
      });
    }

    const rawClass = String(studentClass).trim();
    const numMatch = rawClass.match(/\d+/);
    const cleanNum = numMatch ? numMatch[0] : "";
    const classCandidates = Array.from(
      new Set([rawClass, cleanNum ? `Class ${cleanNum}` : null, cleanNum ? `class ${cleanNum}` : null, cleanNum].filter(Boolean))
    );

    // 2. Fetch published learning modules for student's class (all schools shared)
    let modules = [];
    let modErr = null;
    try {
      const res = await supabase
        .from("learning_modules")
        .select(`
          id,
          school_id,
          class,
          subject_id,
          title,
          description,
          thumbnail_url,
          published,
          created_at,
          updated_at
        `)
        .eq("published", true)
        .in("class", classCandidates)
        .order("created_at", { ascending: false });

      modErr = res.error;
      modules = res.data || [];
    } catch (e) {
      console.warn("[/api/student/modules] learning_modules query failed:", e.message);
      modErr = e;
    }

    if (modules.length === 0) {
      return NextResponse.json({
        modules: [],
        studentClass,
        schoolId,
      });
    }

    // 3. Concurrently fetch Subjects, Lessons, Progress & Quizzes in parallel for maximum speed
    const subjectIds = Array.from(new Set(modules.map((m) => m.subject_id).filter(Boolean)));
    const moduleIds = modules.map((m) => m.id);

    let subjectsMap = {};
    let lessonsMap = {};
    let progressMap = {};
    let quizzesMap = {};

    try {
      const [subjectsRes, lessonsRes, progressRes, quizzesRes] = await Promise.all([
        // Subquery A: Subjects
        subjectIds.length > 0
          ? supabase.from("subjects").select("id, name, code, icon, color").in("id", subjectIds)
          : Promise.resolve({ data: [] }),

        // Subquery B: Lessons (with video_type resiliency)
        supabase
          .from("lessons")
          .select(`
            id,
            module_id,
            title,
            description,
            video_path,
            video_url,
            video_type,
            duration,
            order_index,
            is_required,
            published,
            created_at
          `)
          .in("module_id", moduleIds)
          .or("published.eq.true,published.is.null")
          .order("order_index", { ascending: true })
          .then(async (lRes) => {
            if (lRes.error && (lRes.error.code === "42703" || lRes.error.message?.includes("video_type"))) {
              const fallback = await supabase
                .from("lessons")
                .select(`
                  id,
                  module_id,
                  title,
                  description,
                  video_path,
                  video_url,
                  duration,
                  order_index,
                  is_required,
                  published,
                  created_at
                `)
                .in("module_id", moduleIds)
                .or("published.eq.true,published.is.null")
                .order("order_index", { ascending: true });
              if (fallback.data) {
                return {
                  data: fallback.data.map((l) => ({
                    ...l,
                    video_type: l.video_url && (l.video_url.includes("youtube") || l.video_url.includes("youtu.be")) ? "youtube" : "uploaded",
                  })),
                  error: null,
                };
              }
            }
            return lRes;
          }),

        // Subquery C: Lesson Progress for this student
        supabase
          .from("lesson_progress")
          .select("lesson_id, completed, last_position, completed_at, updated_at")
          .eq("student_id", userId),

        // Subquery D: Quizzes linked to modules
        supabase
          .from("quizzes")
          .select("id, module_id, title, description, difficulty, time_limit, is_published")
          .in("module_id", moduleIds),
      ]);

      if (subjectsRes?.data) {
        subjectsRes.data.forEach((s) => {
          subjectsMap[s.id] = s;
        });
      }

      if (lessonsRes?.data) {
        lessonsRes.data.forEach((l) => {
          if (!lessonsMap[l.module_id]) {
            lessonsMap[l.module_id] = [];
          }
          lessonsMap[l.module_id].push(l);
        });
      }

      if (progressRes?.data) {
        progressRes.data.forEach((p) => {
          progressMap[p.lesson_id] = p;
        });
      }

      if (quizzesRes?.data) {
        quizzesRes.data.forEach((q) => {
          if (q.module_id) {
            quizzesMap[q.module_id] = q;
          }
        });
      }
    } catch (parallelErr) {
      console.warn("[/api/student/modules] parallel subqueries error:", parallelErr.message);
    }

    // 6. Assemble complete response object
    const enrichedModules = modules.map((mod) => {
      const modLessons = (lessonsMap[mod.id] || []).map((l) => {
        const prog = progressMap[l.id] || null;
        return {
          ...l,
          progress: {
            completed: Boolean(prog?.completed),
            lastPosition: prog?.last_position || 0,
            completedAt: prog?.completed_at || null,
          },
        };
      });

      const totalLessons = modLessons.length;
      const completedLessons = modLessons.filter((l) => l.progress.completed).length;

      // Quiz unlock state calculation
      const moduleQuiz = quizzesMap[mod.id] || null;
      let quizObject = null;

      if (moduleQuiz) {
        const isModuleComplete = totalLessons > 0 && completedLessons === totalLessons;

        let state = "UNLOCKED";
        let unlocked = true;
        let message = null;

        if (totalLessons === 0) {
          state = "NO_LESSONS";
          unlocked = false;
          message = "No lessons published for this module yet.";
        } else if (!isModuleComplete) {
          state = "LESSONS_INCOMPLETE";
          unlocked = false;
          message = `Complete all ${totalLessons} lessons to unlock the quiz.`;
        } else if (!moduleQuiz.is_published) {
          state = "NOT_RELEASED";
          unlocked = false;
          message = "Your teacher has not released the quiz yet.";
        }

        quizObject = {
          id: moduleQuiz.id,
          title: moduleQuiz.title,
          description: moduleQuiz.description,
          difficulty: moduleQuiz.difficulty,
          timeLimit: moduleQuiz.time_limit,
          isPublished: Boolean(moduleQuiz.is_published),
          unlocked,
          state,
          message,
        };
      }

      return {
        ...mod,
        subject: subjectsMap[mod.subject_id] || { id: mod.subject_id, name: "General" },
        lessons: modLessons,
        quiz: quizObject,
        stats: {
          totalLessons,
          completedLessons,
          isCompleted: totalLessons > 0 && completedLessons === totalLessons,
        },
      };
    });

    return NextResponse.json({
      modules: enrichedModules,
      studentClass,
      schoolId,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[/api/student/modules] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch student modules" },
      { status: error.statusCode || 500 }
    );
  }
}
