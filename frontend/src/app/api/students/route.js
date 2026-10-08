<<<<<<< Updated upstream
import { NextResponse } from "next/server";
import { supabase, run, runSingle, nowIso, checkSupabaseConfigured } from "../_utils/supabase";
=======
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase, runSingle } from "../_utils/supabase";
>>>>>>> Stashed changes

export const runtime = "nodejs";

<<<<<<< Updated upstream
// Server memory fallback store
let globalStudentsRegistry = [];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    let dbStudents = [];

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("user_roles")
          .select("*")
          .eq("role", "student");

        if (schoolId && schoolId !== "default_school") {
          query = query.eq("school_id", schoolId);
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
            dob: row.metadata?.dob || row.dob || null,
            fatherName: row.metadata?.fatherName || row.father_name || null,
            parentPhone: row.metadata?.parentPhone || row.parent_phone || null,
            parentEmail: row.metadata?.parentEmail || row.parent_email || null,
            studentPhone: row.metadata?.studentPhone || row.student_phone || null,
            address: row.metadata?.address || row.address || null,
            section: row.metadata?.section || row.section || null,
            rollNumber: row.metadata?.rollNumber || row.roll_number || row.user_id || null,
            mediumLanguage: row.metadata?.mediumLanguage || "English",
            parentalControl: row.metadata?.parentalControl || null,
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
        map.set(s.id, { ...map.get(s.id), ...s });
      }
    });

    const result = Array.from(map.values());
    return NextResponse.json(result);
  } catch (error) {
    console.warn("[/api/students GET] Error:", error.message);
    return NextResponse.json(globalStudentsRegistry, { status: 200 });
  }
}

export async function POST(request) {
  try {
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
      ? String(studentId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_")
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
        // Try upserting full payload with metadata
        const fullPayload = {
          user_id: generatedId,
          role: "student",
          provisional: false,
          name: name.trim(),
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
          // If metadata column is missing, upsert without metadata column
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
=======
// Get all students
export async function GET() {
  const authObj = await auth();
  const userId = authObj?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await runSingle(
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle()
  );
  if (!caller || !["teacher", "admin"].includes(caller.role)) {
    return NextResponse.json(
      { error: "Forbidden: Teacher privileges required" },
      { status: 403 }
    );
  }
  return NextResponse.json(students);
}

// Add a new student
export async function POST(req) {
  const authObj = await auth();
  const userId = authObj?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const caller = await runSingle(
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle()
  );
  if (!caller || !["teacher", "admin"].includes(caller.role)) {
    return NextResponse.json(
      { error: "Forbidden: Teacher privileges required" },
      { status: 403 }
    );
  }
  const data = await req.json();
  const newStudent = { id: Date.now(), ...data };
  students.push(newStudent);
  return NextResponse.json(newStudent);
>>>>>>> Stashed changes
}
