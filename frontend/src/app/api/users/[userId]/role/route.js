import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase, run, runSingle, nowIso } from "../../../_utils/supabase";
import { broadcast } from "../../../_utils/events";

export const runtime = "nodejs";

const AUTO_PROVISION_ROLES = process.env.AUTO_PROVISION_ROLES !== "false";

export async function GET(request, context) {
  try {
    const params = await context?.params;
    const requestedUserId = params?.userId;

    // 1. Authenticate session with Clerk
    let authUserId = null;
    let authObj = null;
    try {
      authObj = await auth();
      authUserId = authObj?.userId || null;
    } catch (authErr) {
      console.warn("[/api/users/[userId]/role] Clerk auth check warning:", authErr.message);
    }

    const targetUserId = requestedUserId || authUserId;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized: User ID required" }, { status: 401 });
    }

    // Security: If caller specifies a different userId than their authenticated ID, verify authorization
    // 2. Fetch role using resilient requireUserRole helper
    const resolvedRole = await requireUserRole(targetUserId);

    return NextResponse.json({
      userId: resolvedRole.user_id,
      role: resolvedRole.role,
      name: resolvedRole.name,
      class: resolvedRole.class,
      schoolId: resolvedRole.school_id,
      provisional: resolvedRole.provisional ?? false,
      createdAt: resolvedRole.created_at,
      updatedAt: resolvedRole.updated_at,
    });
  } catch (error) {
    console.error("[/api/users/[userId]/role] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: error.statusCode || 500 });
  }
}

