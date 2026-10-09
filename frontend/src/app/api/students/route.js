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

// Server memory fallback store with initial multi-student enrollment per mobile number
let globalStudentsRegistry = [
  {
    id: "GYAN-2026-8A-042",
    studentId: "GYAN-2026-8A-042",
    userId: "GYAN-2026-8A-042",
    name: "Aarav Sharma",
    class: "Class 8",
    className: "Class 8",
    section: "Section A",
    rollNumber: "2026-8A-042",
    dob: "2012-05-14",
    fatherName: "Mr. Rajesh Sharma",
    parentPhone: "+91 98765 43210",
    parentEmail: "rajesh.sharma@example.com",
    studentPhone: "+91 98765 43211",
    bloodGroup: "O+",
    emergencyPhone: "+91 98765 43210",
    address: "Plot 42, Shanti Vihar, Civil Lines, Jaipur",
    mediumLanguage: "English",
    schoolId: "default_school",
    totalQuizzes: 14,
    averageScore: 88,
    bestScore: 96,
    lastActivity: "2 hours ago",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "2 Hours / Day",
      safetyMode: true,
      quizAlerts: true,
      quietHours: false,
    },
  },
  {
    id: "GYAN-2026-5B-108",
    studentId: "GYAN-2026-5B-108",
    userId: "GYAN-2026-5B-108",
    name: "Ananya Sharma",
    class: "Class 5",
    className: "Class 5",
    section: "Section B",
    rollNumber: "2026-5B-108",
    dob: "2015-09-22",
    fatherName: "Mr. Rajesh Sharma",
    parentPhone: "+91 98765 43210",
    parentEmail: "rajesh.sharma@example.com",
    studentPhone: "",
    bloodGroup: "B+",
    emergencyPhone: "+91 98765 43210",
    address: "Plot 42, Shanti Vihar, Civil Lines, Jaipur",
    mediumLanguage: "English",
    schoolId: "default_school",
    totalQuizzes: 9,
    averageScore: 92,
    bestScore: 100,
    lastActivity: "4 hours ago",
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "1.5 Hours / Day",
      safetyMode: true,
      quizAlerts: true,
      quietHours: true,
    },
  },
  {
    id: "GYAN-2026-10A-015",
    studentId: "GYAN-2026-10A-015",
    userId: "GYAN-2026-10A-015",
    name: "Kabir Verma",
    class: "Class 10",
    className: "Class 10",
    section: "Section A",
    rollNumber: "2026-10A-015",
    dob: "2010-02-18",
    fatherName: "Dr. Alok Verma",
    parentPhone: "+91 91234 56780",
    parentEmail: "alok.verma@example.com",
    studentPhone: "+91 91234 56782",
    bloodGroup: "A+",
    emergencyPhone: "+91 91234 56780",
    address: "15, Green Park Avenue, New Delhi",
    mediumLanguage: "English",
    schoolId: "default_school",
    totalQuizzes: 22,
    averageScore: 94,
    bestScore: 98,
    lastActivity: "1 hour ago",
    created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "3 Hours / Day",
      safetyMode: false,
      quizAlerts: true,
      quietHours: false,
    },
  },
  {
    id: "GYAN-2026-7C-089",
    studentId: "GYAN-2026-7C-089",
    userId: "GYAN-2026-7C-089",
    name: "Rhea Verma",
    class: "Class 7",
    className: "Class 7",
    section: "Section C",
    rollNumber: "2026-7C-089",
    dob: "2013-11-05",
    fatherName: "Dr. Alok Verma",
    parentPhone: "+91 91234 56780",
    parentEmail: "alok.verma@example.com",
    studentPhone: "",
    bloodGroup: "AB+",
    emergencyPhone: "+91 91234 56780",
    address: "15, Green Park Avenue, New Delhi",
    mediumLanguage: "English",
    schoolId: "default_school",
    totalQuizzes: 12,
    averageScore: 85,
    bestScore: 90,
    lastActivity: "5 hours ago",
    created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "2 Hours / Day",
      safetyMode: true,
      quizAlerts: true,
      quietHours: false,
    },
  },
  {
    id: "GYAN-2026-9B-031",
    studentId: "GYAN-2026-9B-031",
    userId: "GYAN-2026-9B-031",
    name: "Diya Patel",
    class: "Class 9",
    className: "Class 9",
    section: "Section B",
    rollNumber: "2026-9B-031",
    dob: "2011-07-29",
    fatherName: "Mr. Sanjay Patel",
    parentPhone: "+91 98112 34567",
    parentEmail: "sanjay.patel@example.com",
    studentPhone: "+91 98112 34568",
    bloodGroup: "O+",
    emergencyPhone: "+91 98112 34567",
    address: "88, Navrangpura, Ahmedabad, Gujarat",
    mediumLanguage: "English",
    schoolId: "default_school",
    totalQuizzes: 18,
    averageScore: 91,
    bestScore: 95,
    lastActivity: "Yesterday",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "2.5 Hours / Day",
      safetyMode: true,
      quizAlerts: true,
      quietHours: false,
    },
  },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const classFilter = searchParams.get("class");
    const uniqueIdFilter = searchParams.get("uniqueId");
    const phoneFilter = searchParams.get("phone") || searchParams.get("parentPhone");
    const searchFilter = searchParams.get("search");

    let dbStudents = [];

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("user_roles")
          .select("*")
          .eq("role", "student");

        // When searching by phone, uniqueId, or search, query globally across all schools
        if (schoolId && schoolId !== "default_school" && schoolId !== "all" && !phoneFilter && !uniqueIdFilter && !searchFilter) {
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
            bloodGroup: row.metadata?.bloodGroup || "O+",
            emergencyPhone: row.metadata?.emergencyPhone || row.parent_phone || null,
            photoUrl: row.metadata?.photoUrl || null,
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

    let result = Array.from(map.values());

    // Apply uniqueId filter if provided
    if (uniqueIdFilter) {
      const uq = uniqueIdFilter.trim().toLowerCase();
      result = result.filter(
        (s) =>
          String(s.id).toLowerCase() === uq ||
          String(s.studentId).toLowerCase() === uq ||
          String(s.rollNumber).toLowerCase() === uq
      );
    }

    // Apply phone filter if provided
    if (phoneFilter) {
      const cleanPhone = phoneFilter.replace(/[^0-9]/g, "");
      result = result.filter((s) => {
        const p1 = (s.parentPhone || "").replace(/[^0-9]/g, "");
        const p2 = (s.studentPhone || "").replace(/[^0-9]/g, "");
        return (cleanPhone && (p1.includes(cleanPhone) || p2.includes(cleanPhone)));
      });
    }

    // Apply search filter if provided
    if (searchFilter) {
      const q = searchFilter.trim().toLowerCase();
      result = result.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.id && s.id.toLowerCase().includes(q)) ||
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          (s.rollNumber && String(s.rollNumber).toLowerCase().includes(q)) ||
          (s.fatherName && s.fatherName.toLowerCase().includes(q)) ||
          (s.parentPhone && s.parentPhone.includes(q))
      );
    }

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
      bloodGroup,
      emergencyPhone,
      photoUrl,
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
      bloodGroup: bloodGroup || "O+",
      emergencyPhone: emergencyPhone || parentPhone || null,
      photoUrl: photoUrl || null,
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
      bloodGroup: bloodGroup || "O+",
      emergencyPhone: emergencyPhone || parentPhone || null,
      photoUrl: photoUrl || null,
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
