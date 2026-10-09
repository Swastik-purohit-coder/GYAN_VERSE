import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  nowIso,
  checkSupabaseConfigured,
} from "../../_utils/supabase";

export const runtime = "nodejs";

// In-memory fallback for local/offline environments
let inMemoryEnrollments = [];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get("studentId");

    if (!studentId) {
      try {
        const authObj = await auth();
        studentId = authObj?.userId;
      } catch (_) {}
    }

    if (!studentId) {
      return NextResponse.json({ enrollments: [] });
    }

    if (checkSupabaseConfigured()) {
      try {
        const dbEnrollments = await run(
          supabase
            .from("skill_enrollments")
            .select("*")
            .eq("student_id", studentId)
        );
        if (dbEnrollments && dbEnrollments.length > 0) {
          return NextResponse.json({ enrollments: dbEnrollments });
        }
      } catch (err) {
        console.warn("[GET /api/skills/enroll] Supabase error:", err.message);
      }
    }

    const filtered = inMemoryEnrollments.filter((e) => e.student_id === studentId);
    return NextResponse.json({ enrollments: filtered });
  } catch (err) {
    return NextResponse.json({ enrollments: [] });
  }
}

export async function POST(request) {
  try {
    let authUserId = null;
    try {
      const authObj = await auth();
      authUserId = authObj?.userId;
    } catch (_) {}

    const body = await request.json();
    const {
      courseId,
      studentId: reqStudentId,
      studentName = "Student",
      progressPercent = 0,
      completed = false,
      certificateId,
    } = body;

    const studentId = authUserId || reqStudentId;
    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: "courseId and studentId are required" },
        { status: 400 }
      );
    }

    const enrollmentId = `enr:${courseId}:${studentId}`;
    const now = nowIso();

    const enrollmentDoc = {
      id: enrollmentId,
      course_id: courseId,
      student_id: studentId,
      student_name: studentName,
      progress_percent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
      completed: Boolean(completed),
      completed_at: completed ? now : null,
      certificate_id: certificateId || (completed ? `cert_${Date.now()}` : null),
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const saved = await run(
          supabase
            .from("skill_enrollments")
            .upsert(enrollmentDoc, { onConflict: "id" })
            .select()
            .maybeSingle()
        );
        if (saved && typeof saved === "object" && !Array.isArray(saved) && saved.id) {
          return NextResponse.json({ success: true, enrollment: saved });
        }
      } catch (err) {
        console.warn("[POST /api/skills/enroll] Supabase upsert error:", err.message);
      }
    }

    // In-memory fallback
    const existingIndex = inMemoryEnrollments.findIndex((e) => e.id === enrollmentId);
    if (existingIndex > -1) {
      inMemoryEnrollments[existingIndex] = {
        ...inMemoryEnrollments[existingIndex],
        ...enrollmentDoc,
      };
    } else {
      inMemoryEnrollments.push({
        ...enrollmentDoc,
        enrolled_at: now,
      });
    }

    return NextResponse.json({ success: true, enrollment: enrollmentDoc });
  } catch (err) {
    console.error("[POST /api/skills/enroll] Error:", err);
    return NextResponse.json(
      { error: "Failed to record skill enrollment", details: err.message },
      { status: 500 }
    );
  }
}
