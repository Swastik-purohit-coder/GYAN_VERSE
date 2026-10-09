import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase, run, runSingle } from "../../../_utils/supabase";

export const runtime = "nodejs";

export async function GET(_request, context) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Sign in required" }, { status: 401 });
    }
    const caller = await runSingle(
      supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle()
    );
    if (!caller || !["teacher", "admin", "principal", "higher_body"].includes(caller.role)) {
      return NextResponse.json(
        { error: "Forbidden: Teacher or administrative privileges required" },
        { status: 403 }
      );
    }

    const { schoolId } = await context.params;
    const rows = await run(
      supabase
        .from("user_roles")
        .select("user_id, name, email, phone, parent_email, parent_phone, class, school_id, metadata, created_at")
        .eq("school_id", schoolId)
        .eq("role", "student")
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.user_id,
        userId: row.user_id,
        name: row.name,
        class: row.class,
        schoolId: row.school_id,
        email: row.email || row.metadata?.email || null,
        phone: row.phone || row.metadata?.studentPhone || null,
        studentPhone: row.phone || row.metadata?.studentPhone || null,
        parentEmail: row.parent_email || row.metadata?.parentEmail || null,
        parentPhone: row.parent_phone || row.metadata?.parentPhone || null,
        dob: row.metadata?.dob || null,
        fatherName: row.metadata?.fatherName || null,
        address: row.metadata?.address || null,
        section: row.metadata?.section || null,
        rollNumber: row.metadata?.rollNumber || null,
        mediumLanguage: row.metadata?.mediumLanguage || "English",
        selectedInterests: row.metadata?.selectedInterests || [],
        primaryGoal: row.metadata?.primaryGoal || null,
        parentalControl: row.metadata?.parentalControl || null,
        createdAt: row.created_at,
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
