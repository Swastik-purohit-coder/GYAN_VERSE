import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole } from "../../_utils/supabase";
import { getOrCreateClassGroup } from "../../_utils/communication";

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

    // Derive student identity and authenticated class strictly from server-side database
    const studentRole = await requireUserRole(userId);
    const studentClass = studentRole.class || "Class 8";
    const schoolId = studentRole.school_id || "default_school";

    const group = await getOrCreateClassGroup(studentClass, schoolId);

    return NextResponse.json({
      group,
      student: {
        id: studentRole.user_id,
        name: studentRole.name,
        class: studentClass,
        school: schoolId,
      },
      onlineCount: 24, // Simulated active peer count for classroom cohort
    });
  } catch (error) {
    console.error("[/api/student/group GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch student group" },
      { status: error.statusCode || 500 }
    );
  }
}
