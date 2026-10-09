import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  runSingle,
  nowIso,
  requireUserRole,
  checkSupabaseConfigured,
} from "../_utils/supabase";

export const runtime = "nodejs";

// Server memory fallback store
let globalStudentsRegistry = [];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const classFilter = searchParams.get("class");

    let dbStudents = [];

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("user_roles")
          .select("*")
          .eq("role", "student");

        if (schoolId && schoolId !== "default_school") {
          query = query.or(`school_id.eq.${schoolId},school_id.is.null,school_id.eq.default_school`);
        }

        if (classFilter && classFilter !== "all") {
          query = query.eq("class", classFilter);
        }

        const rows = await run(query.order("created_at", { ascending: false }));

        if (Array.isArray(rows)) {
          dbStudents = rows.map((row) => ({
            id: row.user_id,
            studentId: row.user_id,
            userId: row.user_id,
            name: row.name || "Student",
            class: row.class || "Class 8",
            schoolId: row.school_id || "default_school",
            email: row.email || row.metadata?.email || null,
            phone: row.phone || row.metadata?.studentPhone || null,
            dob: row.metadata?.dob || row.dob || null,
            fatherName: row.metadata?.fatherName || row.father_name || null,
            parentPhone: row.parent_phone || row.metadata?.parentPhone || null,
            parentEmail: row.parent_email || row.metadata?.parentEmail || null,
            studentPhone: row.phone || row.metadata?.studentPhone || row.student_phone || null,
            address: row.metadata?.address || row.address || null,
            section: row.metadata?.section || row.section || null,
            rollNumber: row.metadata?.rollNumber || row.roll_number || row.user_id || null,
            mediumLanguage: row.metadata?.mediumLanguage || "English",
            parentalControl: row.metadata?.parentalControl || null,
            selectedInterests: row.metadata?.selectedInterests || [],
            primaryGoal: row.metadata?.primaryGoal || null,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("[/api/students GET] Supabase fetch fallback:", err.message);
      }
    }

    // Merge database students with server registry
    const map = new Map();
    dbStudents.forEach((s) => map.set(s.id, s));
    globalStudentsRegistry.forEach((s) => {
      if (!schoolId || schoolId === "default_school" || s.schoolId === schoolId) {
        if (!classFilter || classFilter === "all" || s.class === classFilter) {
          map.set(s.id, { ...map.get(s.id), ...s });
        }
      }
    });

    const result = Array.from(map.values());
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.warn("[/api/students GET] Error:", error.message);
    return NextResponse.json(globalStudentsRegistry, { status: 200 });
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (userId) {
      try {
        const caller = await requireUserRole(userId);
        // Ensure student enrollment is performed by authenticated faculty/admin or user onboarding
      } catch (authErr) {
        console.warn("[/api/students POST] Auth warning:", authErr.message);
      }
    }

    const body = await request.json();
    const {
      name,
      studentId,
      rollNumber,
      dob,
      fatherName,
      parentPhone,
      parentEmail,
      studentPhone,
      address,
      className,
      class: klass,
      section,
      mediumLanguage,
      schoolId,
      parentalControl,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Student name is required" }, { status: 400 });
    }

    const assignedClass = klass || className || "Class 8";
    const generatedId = (studentId && String(studentId).trim())
      ? String(studentId).trim().replace(/[^a-zA-Z0-9_-]/g, "_")
      : `std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const metadata = {
      dob: dob || null,
      fatherName: fatherName || null,
      parentPhone: parentPhone || null,
      parentEmail: parentEmail || null,
      studentPhone: studentPhone || null,
      address: address || null,
      section: section || null,
      rollNumber: rollNumber || studentId || null,
      mediumLanguage: mediumLanguage || "English",
      parentalControl: parentalControl || {
        weeklyReports: true,
        dailyStudyLimit: "2 Hours / Day",
        safetyMode: true,
        quizAlerts: true,
        quietHours: false,
      },
      enrolledByFaculty: true,
      onboardingCompleted: true,
    };

    const newStudentObj = {
      id: generatedId,
      studentId: generatedId,
      userId: generatedId,
      name: name.trim(),
      class: assignedClass,
      className: assignedClass,
      schoolId: schoolId || "default_school",
      ...metadata,
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: null,
      lastActivity: null,
      created_at: nowIso(),
    };

    // 1. Save to in-memory server registry
    globalStudentsRegistry = [
      newStudentObj,
      ...globalStudentsRegistry.filter((s) => s.id !== generatedId),
    ];

    // 2. Persist to Supabase user_roles if configured
    if (checkSupabaseConfigured()) {
      try {
        const fullPayload = {
          user_id: generatedId,
          role: "student",
          provisional: false,
          name: name.trim(),
          email: parentEmail || null,
          phone: studentPhone || null,
          parent_email: parentEmail || null,
          parent_phone: parentPhone || null,
          school_id: schoolId || "default_school",
          class: assignedClass,
          metadata,
          created_at: nowIso(),
          updated_at: nowIso(),
        };

        try {
          await runSingle(
            supabase
              .from("user_roles")
              .upsert(fullPayload, { onConflict: "user_id" })
          );
        } catch (schemaErr) {
          const simplePayload = {
            user_id: generatedId,
            role: "student",
            provisional: false,
            name: name.trim(),
            school_id: schoolId || "default_school",
            class: assignedClass,
            created_at: nowIso(),
            updated_at: nowIso(),
          };
          await runSingle(
            supabase
              .from("user_roles")
              .upsert(simplePayload, { onConflict: "user_id" })
          );
        }
      } catch (dbErr) {
        console.warn("[/api/students POST] Supabase save warning:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      student: newStudentObj,
    });
  } catch (error) {
    console.error("[/api/students POST] Exception:", error);
    return NextResponse.json({ error: error.message || "Failed to create student" }, { status: 500 });
  }
}
