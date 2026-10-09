import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole, ensureTeacher } from "../../_utils/supabase";
import { getTeacherDoubts } from "../../_utils/communication";

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

    const teacherRole = await requireUserRole(userId);
    // Enforce teacher authorization - student calling this gets 403!
    ensureTeacher(teacherRole);

    const doubts = await getTeacherDoubts(teacherRole.user_id);
    const unreadCount = doubts.filter((d) => d.unread_by_teacher || d.status === "open").length;

    return NextResponse.json({
      doubts,
      unreadCount,
    });
  } catch (error) {
    console.error("[/api/teacher/doubts GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch teacher doubts" },
      { status: error.statusCode || 500 }
    );
  }
}
