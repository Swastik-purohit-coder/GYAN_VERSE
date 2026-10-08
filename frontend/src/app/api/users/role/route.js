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
        supabase.from("user_roles").select("*").eq("user_id", targetUserId).maybeSingle()
      );
    } catch (err) {
      console.warn("[/api/users/role] Existing user fetch warning:", err.message);
    }

    const mergedMetadata = {
      ...(existing?.metadata || {}),
      ...extraProfile,
    };

    const finalPayload = {
      user_id: targetUserId,
      role,
      provisional: false,
      name: name ?? existing?.name ?? null,
      school_id: schoolId || existing?.school_id || null,
      class: klass ?? existing?.class ?? null,
      metadata: mergedMetadata,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };

    let saved = null;
    try {
      saved = await runSingle(
        supabase.from("user_roles").upsert(finalPayload, { onConflict: "user_id" }).select().maybeSingle()
      );
    } catch (upsertErr) {
      const fallbackPayload = {
        user_id: targetUserId,
        role,
        provisional: false,
        name: name ?? existing?.name ?? null,
        school_id: schoolId || existing?.school_id || null,
        class: klass ?? existing?.class ?? null,
        created_at: existing?.created_at ?? nowIso(),
        updated_at: nowIso(),
      };
      try {
        saved = await runSingle(
          supabase.from("user_roles").upsert(fallbackPayload, { onConflict: "user_id" }).select().maybeSingle()
        );
      } catch (e) {
        console.warn("[/api/users/role] Supabase fallback upsert warning:", e.message);
      }
    }

    return NextResponse.json({ success: true, user: saved ?? finalPayload });
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
    return NextResponse.json({ success: true, user: fallbackPayload, fallback: true });
  }
}
