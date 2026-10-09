import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole } from "../../_utils/supabase";
import {
  getStudentDoubts,
  createDoubtSession,
  getStudentMentor,
} from "../../_utils/communication";
import { broadcast } from "../../_utils/events";

export const runtime = "nodejs";

async function resolveUserId(request) {
  try {
    const authObj = await auth();
    if (authObj?.userId) return authObj.userId;
  } catch (err) {}
  if (process.env.NODE_ENV !== "production") {
    const headerId = request.headers.get("x-user-id") || request.headers.get("x-clerk-user-id");
    if (headerId) return headerId;
  }
  return null;
}

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentRole = await requireUserRole(userId);
    const doubts = await getStudentDoubts(studentRole.user_id);

    const unreadCount = doubts.filter((d) => d.unread_by_student).length;

    return NextResponse.json({
      doubts,
      unreadCount,
    });
  } catch (error) {
    console.error("[/api/student/doubts GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch student doubts" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentRole = await requireUserRole(userId);
    const body = await request.json();

    const { subject, title, description } = body || {};

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Doubt title / question is required" },
        { status: 400 }
      );
    }

    // Automatically resolve student's mentor to assign doubt to
    const mentor = await getStudentMentor(
      studentRole.user_id,
      studentRole.school_id,
      studentRole.class
    );

    const newDoubt = await createDoubtSession({
      student_id: studentRole.user_id,
      student_name: studentRole.name || "Student",
      student_class: studentRole.class || "Class 8",
      teacher_id: mentor?.id || "teacher_faculty_math",
      teacher_name: mentor?.name || "Prof. Arvind Sharma",
      subject: subject || mentor?.subject || "General",
      title: title.trim(),
      description: description ? description.trim() : "",
    });

    // Realtime notification broadcast to teacher & student subscribers
    broadcast("doubt:created", {
      doubtId: newDoubt.id,
      doubt: newDoubt,
      teacherId: newDoubt.teacher_id,
      studentId: newDoubt.student_id,
    });

    return NextResponse.json(newDoubt, { status: 201 });
  } catch (error) {
    console.error("[/api/student/doubts POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create doubt session" },
      { status: error.statusCode || 500 }
    );
  }
}
