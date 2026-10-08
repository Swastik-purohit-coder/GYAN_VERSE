import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole, ensureTeacher } from "../../../../_utils/supabase";
import {
  getDoubtSessionById,
  addDoubtMessage,
} from "../../../../_utils/communication";
import { broadcast } from "../../../../_utils/events";

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

export async function POST(request, context) {
  try {
    const params = await context?.params;
    const id = params?.id;
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherRole = await requireUserRole(userId);
    ensureTeacher(teacherRole);

    const session = await getDoubtSessionById(id, teacherRole.user_id, teacherRole.role);
    if (!session) {
      return NextResponse.json({ error: "Doubt session not found" }, { status: 404 });
    }

    const body = await request.json();
    const { message } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Reply message cannot be empty" }, { status: 400 });
    }

    const newMsg = await addDoubtMessage(
      id,
      teacherRole.user_id,
      teacherRole.name || "Faculty Mentor",
      "teacher",
      message.trim()
    );

    // Broadcast SSE realtime event for the new reply
    broadcast("doubt:message", {
      doubtId: id,
      message: newMsg,
    });

    return NextResponse.json(newMsg, { status: 201 });
  } catch (error) {
    console.error("[/api/teacher/doubts/[id]/messages POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post teacher reply" },
      { status: error.statusCode || 500 }
    );
  }
}
