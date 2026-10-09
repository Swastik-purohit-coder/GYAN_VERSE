import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  runSingle,
  nowIso,
  checkSupabaseConfigured,
} from "../../_utils/supabase";

export const runtime = "nodejs";

export async function POST(request) {
  let targetUserId = null;
  let role = "student";
  let name = null;
  let schoolId = null;
  let klass = null;

  try {
    let authUserId = null;
    try {
      const authObj = await auth();
      authUserId = authObj?.userId || null;
    } catch (authErr) {
      console.warn("[/api/users/role] Clerk auth warning:", authErr.message);
    }

    const body = await request.json();
    const {
      userId,
      role: bodyRole,
      name: bodyName,
      schoolId: bodySchoolId,
      class: bodyClass,
      ...extraProfile
    } = body;

    targetUserId = authUserId || userId;
    role = bodyRole || "student";
    name = bodyName;
    schoolId = bodySchoolId;
    klass = bodyClass;

    if (!targetUserId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    const payload = {
      user_id: targetUserId,
      role,
      provisional: false,
      name: name ?? null,
      school_id: schoolId || null,
      class: klass ?? null,
      metadata: extraProfile || {},
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    if (!checkSupabaseConfigured()) {
      console.warn("[/api/users/role] Supabase not configured, returning local payload");
      return NextResponse.json({ success: true, user: payload, fallback: true });
    }

    // Security check: If authenticated user tries to update another user's role, verify admin status
    if (authUserId && userId && String(authUserId).trim() !== String(userId).trim()) {
      try {
        const callerRoleDoc = await runSingle(
          supabase.from("user_roles").select("role").eq("user_id", authUserId).maybeSingle()
        );
        if (callerRoleDoc?.role !== "admin") {
          return NextResponse.json({ error: "Forbidden: Cannot update role of another user" }, { status: 403 });
        }
      } catch (err) {
        console.warn("[/api/users/role] Role check warning:", err.message);
      }
    }

    let existing = null;
    try {
      existing = await runSingle(
        supabase.from("user_roles").select("user_id, role, name, school_id, class").eq("user_id", targetUserId).maybeSingle()
      );
    } catch (err) {
      console.warn("[/api/users/role] Existing user fetch warning:", err.message);
    }

    // Map role to valid DB check constraint column values
    let dbRole = role;
    let dbClass = klass;
    if (["principal", "higher_body", "admin"].includes(role)) {
      dbRole = "teacher";
      dbClass = `role:${role}`;
    }

    const dbPayload = {
      user_id: targetUserId,
      role: dbRole,
      provisional: false,
      name: name ?? existing?.name ?? null,
      school_id: schoolId || existing?.school_id || null,
      class: dbClass ?? existing?.class ?? null,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };

    let saved = null;
    try {
      saved = await runSingle(
        supabase.from("user_roles").upsert(dbPayload, { onConflict: "user_id" }).select().maybeSingle()
      );
    } catch (upsertErr) {
      console.warn("[/api/users/role] Supabase upsert error:", upsertErr.message);
    }

    try {
      const { invalidateServerUserRoleCache } = await import("@/lib/serverRoleAuth");
      invalidateServerUserRoleCache(targetUserId);
    } catch {}

    const returnUser = {
      user_id: targetUserId,
      role,
      name: name ?? existing?.name ?? null,
      school_id: schoolId || existing?.school_id || null,
      class: klass ?? null,
      provisional: false,
      ...extraProfile,
    };

    const response = NextResponse.json({ success: true, user: returnUser });
    response.cookies.set("gyan_user_role", role, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.warn("[/api/users/role] Error caught, gracefully falling back:", error.message);
    const fallbackPayload = {
      user_id: targetUserId || "user_local",
      role: role || "student",
      provisional: false,
      name: name || null,
      school_id: schoolId || null,
      class: klass || null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    const response = NextResponse.json({ success: true, user: fallbackPayload, fallback: true });
    response.cookies.set("gyan_user_role", role || "student", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  }
}
