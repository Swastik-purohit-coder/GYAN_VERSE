import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole } from "../../../_utils/supabase";
import {
  getDoubtSessionById,
  updateDoubtStatus,
} from "../../../_utils/communication";
import { broadcast } from "../../../_utils/events";

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

export async function GET(request, context) {
  try {
    const params = await context?.params;
    const id = params?.id;
    console.log("[/api/student/doubts/[id] GET] called with id:", id);
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentRole = await requireUserRole(userId);
    const session = await getDoubtSessionById(id, studentRole.user_id, studentRole.role);

    if (!session) {
      return NextResponse.json({ error: "Doubt session not found" }, { status: 404 });
    }

    // Verify ownership: student cannot access another student's doubt session
    const isOwner = session.student_id === studentRole.user_id;
    const isPrivileged = ["admin", "teacher", "principal", "higher_body"].includes(studentRole.role);

    if (!isOwner && !isPrivileged) {
      return NextResponse.json(
        { error: "Forbidden: You cannot access another student's doubt session" },
        { status: 403 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("[/api/student/doubts/[id] GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch doubt session" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(request, context) {
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
        { error: "Forbidden: You cannot modify another student's doubt session" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body || {};

    if (!["open", "answered", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Allowed values: open, answered, closed" },
        { status: 400 }
      );
    }

    const updated = await updateDoubtStatus(id, status, studentRole.role);
    broadcast("doubt:status", {
      doubtId: id,
      status,
      updatedBy: studentRole.user_id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[/api/student/doubts/[id] PATCH] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update doubt session" },
      { status: error.statusCode || 500 }
    );
  }
}
