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
        supabase
          .from("user_roles")
          .select("user_id, role, name, email, phone, parent_email, parent_phone, school_id, class, metadata, created_at")
          .eq("user_id", targetUserId)
          .maybeSingle()
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

    // Extract contact columns
    const effectiveEmail =
      body.email ||
      extraProfile.email ||
      existing?.email ||
      null;

    const effectivePhone =
      body.studentPhone ||
      body.phone ||
      extraProfile.studentPhone ||
      extraProfile.phone ||
      existing?.phone ||
      null;

    const effectiveParentEmail =
      body.parentEmail ||
      body.parent_email ||
      extraProfile.parentEmail ||
      extraProfile.parent_email ||
      existing?.parent_email ||
      null;

    const effectiveParentPhone =
      body.parentPhone ||
      body.parent_phone ||
      extraProfile.parentPhone ||
      extraProfile.parent_phone ||
      existing?.parent_phone ||
      null;

    // Build comprehensive, clean metadata JSONB containing all extended student and faculty parameters
    const existingMeta =
      existing?.metadata && typeof existing.metadata === "object"
        ? existing.metadata
        : {};

    const submittedExtra = {
      ...(extraProfile.metadata && typeof extraProfile.metadata === "object" ? extraProfile.metadata : {}),
      ...extraProfile,
    };
    delete submittedExtra.userId;
    delete submittedExtra.user_id;
    delete submittedExtra.targetUserId;
    delete submittedExtra.role;
    delete submittedExtra.name;
    delete submittedExtra.schoolId;
    delete submittedExtra.school_id;
    delete submittedExtra.class;
    delete submittedExtra.metadata;

    const cleanMetadata = {
      ...existingMeta,
      ...submittedExtra,
      dob: body.dob ?? extraProfile.dob ?? existingMeta.dob ?? null,
      fatherName: body.fatherName ?? extraProfile.fatherName ?? existingMeta.fatherName ?? null,
      parentPhone: effectiveParentPhone,
      parentEmail: effectiveParentEmail,
      studentPhone: effectivePhone,
      address: body.address ?? extraProfile.address ?? existingMeta.address ?? null,
      mediumLanguage: body.mediumLanguage ?? extraProfile.mediumLanguage ?? existingMeta.mediumLanguage ?? "English",
      section: body.section ?? extraProfile.section ?? existingMeta.section ?? null,
      rollNumber: body.rollNumber ?? extraProfile.rollNumber ?? existingMeta.rollNumber ?? null,
      selectedInterests:
        body.selectedInterests ??
        extraProfile.selectedInterests ??
        existingMeta.selectedInterests ??
        [],
      primaryGoal:
        body.primaryGoal ?? extraProfile.primaryGoal ?? existingMeta.primaryGoal ?? null,
      parentalControl:
        body.parentalControl ??
        extraProfile.parentalControl ??
        existingMeta.parentalControl ?? {
          weeklyReports: true,
          dailyStudyLimit: "2 Hours / Day",
          safetyMode: true,
          quizAlerts: true,
          quietHours: false,
        },
    };

    const dbPayload = {
      user_id: targetUserId,
      role: dbRole,
      provisional: false,
      name: name ?? existing?.name ?? null,
      email: effectiveEmail,
      phone: effectivePhone,
      parent_email: effectiveParentEmail,
      parent_phone: effectiveParentPhone,
      school_id: schoolId || existing?.school_id || null,
      class: dbClass ?? existing?.class ?? null,
      metadata: cleanMetadata,
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
      userId: targetUserId,
      role,
      name: name ?? existing?.name ?? null,
      email: effectiveEmail,
      phone: effectivePhone,
      parent_email: effectiveParentEmail,
      parentEmail: effectiveParentEmail,
      parent_phone: effectiveParentPhone,
      parentPhone: effectiveParentPhone,
      school_id: schoolId || existing?.school_id || null,
      schoolId: schoolId || existing?.school_id || null,
      class: klass ?? null,
      provisional: false,
      metadata: cleanMetadata,
      ...cleanMetadata,
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
