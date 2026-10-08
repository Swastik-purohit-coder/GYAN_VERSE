import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole } from "../../../../_utils/supabase";
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

    const studentRole = await requireUserRole(userId);
    const session = await getDoubtSessionById(id, studentRole.user_id, studentRole.role);

    if (!session) {
      return NextResponse.json({ error: "Doubt session not found" }, { status: 404 });
    }

    if (session.student_id !== studentRole.user_id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot reply to another student's doubt session" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { message } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const newMsg = await addDoubtMessage(
      id,
      studentRole.user_id,
      studentRole.name || "Student",
      "student",
      message.trim()
    );

    // Broadcast SSE realtime event
    broadcast("doubt:message", {
      doubtId: id,
      message: newMsg,
    });

    return NextResponse.json(newMsg, { status: 201 });
  } catch (error) {
    console.error("[/api/student/doubts/[id]/messages POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post doubt message" },
      { status: error.statusCode || 500 }
    );
  }
}
