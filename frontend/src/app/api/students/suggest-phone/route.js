import { NextResponse } from "next/server";
import { supabase, run, checkSupabaseConfigured } from "../../_utils/supabase";

export const runtime = "nodejs";

// Demo fallback registry for demo multi-student parent mobile numbers
const demoFallbackStudents = [
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
  },
];

function normalizeCoreDigits(str) {
  if (!str) return "";
  const d = String(str).replace(/[^0-9]/g, "");
  if (d.length > 10 && d.startsWith("91")) return d.slice(2);
  if (d.length > 10 && d.startsWith("0")) return d.slice(1);
  return d;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (
      searchParams.get("q") ||
      searchParams.get("query") ||
      searchParams.get("phone") ||
      ""
    ).trim();

    const cleanDigits = query.replace(/[^0-9]/g, "");
    const coreDigits = normalizeCoreDigits(cleanDigits);
    const lowerQuery = query.toLowerCase();

    let allStudents = [];

    // 1. Fetch live students from Supabase user_roles
    if (checkSupabaseConfigured()) {
      try {
        const rows = await run(
          supabase
            .from("user_roles")
            .select("*")
            .eq("role", "student")
            .order("created_at", { ascending: false })
        );

        if (Array.isArray(rows)) {
          allStudents = rows.map((row) => ({
            id: row.user_id,
            studentId: row.user_id,
            userId: row.user_id,
            name: row.name || "Student",
            class: row.class || "Class 8",
            className: row.class || "Class 8",
            schoolId: row.school_id || "default_school",
            email: row.email || row.metadata?.email || null,
            phone: row.phone || row.metadata?.studentPhone || null,
            dob: row.metadata?.dob || row.dob || null,
            fatherName: row.metadata?.fatherName || row.father_name || null,
            parentPhone: row.parent_phone || row.metadata?.parentPhone || null,
            parentEmail: row.parent_email || row.metadata?.parentEmail || null,
            studentPhone: row.phone || row.metadata?.studentPhone || row.student_phone || null,
            address: row.metadata?.address || row.address || null,
            section: row.metadata?.section || row.section || "Section A",
            rollNumber: row.metadata?.rollNumber || row.roll_number || row.user_id || null,
            mediumLanguage: row.metadata?.mediumLanguage || "English",
            bloodGroup: row.metadata?.bloodGroup || "O+",
            emergencyPhone: row.metadata?.emergencyPhone || row.parent_phone || null,
            photoUrl: row.metadata?.photoUrl || null,
            parentalControl: row.metadata?.parentalControl || null,
            createdAt: row.created_at,
          }));
        }
      } catch (dbErr) {
        console.warn("[/api/students/suggest-phone GET] Supabase fetch warning:", dbErr.message);
      }
    }

    // 2. Include demo fallback students if not already present
    demoFallbackStudents.forEach((demo) => {
      if (!allStudents.some((s) => s.id === demo.id)) {
        allStudents.push(demo);
      }
    });

    // 3. Group students by phone number
    const phoneGroupsMap = new Map();

    allStudents.forEach((student) => {
      // Prioritize parentPhone, then emergencyPhone, then phone
      const candidates = [
        student.parentPhone,
        student.emergencyPhone,
        student.phone,
        student.studentPhone,
      ].filter(Boolean);

      candidates.forEach((rawPhone) => {
        const clean = String(rawPhone).replace(/[^0-9]/g, "");
        if (!clean || clean.length < 5) return;

        const core = normalizeCoreDigits(clean);
        // Use clean as primary grouping key
        const groupKey = core || clean;

        if (!phoneGroupsMap.has(groupKey)) {
          phoneGroupsMap.set(groupKey, {
            phoneKey: clean,
            coreKey: core,
            originalPhone: String(rawPhone),
            guardianName: student.fatherName || "Guardian / Parent",
            students: [],
          });
        }

        const group = phoneGroupsMap.get(groupKey);
        // Avoid duplicate student in same phone group
        if (!group.students.some((s) => s.id === student.id)) {
          group.students.push(student);
          if (student.fatherName && group.guardianName === "Guardian / Parent") {
            group.guardianName = student.fatherName;
          }
        }
      });
    });

    let suggestions = Array.from(phoneGroupsMap.values());

    // 4. Filter by query if provided
    if (query) {
      suggestions = suggestions.filter((group) => {
        const phoneKeyClean = group.phoneKey;
        const phoneKeyCore = group.coreKey;

        // Match by digits
        const phoneDigitsMatch =
          Boolean(cleanDigits) &&
          (phoneKeyClean.includes(cleanDigits) ||
            cleanDigits.includes(phoneKeyClean) ||
            (coreDigits && phoneKeyCore.includes(coreDigits)) ||
            (coreDigits && coreDigits.includes(phoneKeyCore)));

        // Match by raw string
        const origMatches = group.originalPhone.toLowerCase().includes(lowerQuery);

        // Match by guardian name
        const guardianMatches =
          group.guardianName && group.guardianName.toLowerCase().includes(lowerQuery);

        // Match by student name, unique ID, or roll number
        const studentMatches = group.students.some(
          (s) =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.id.toLowerCase().includes(lowerQuery) ||
            (s.rollNumber && String(s.rollNumber).toLowerCase().includes(lowerQuery)) ||
            (s.studentId && String(s.studentId).toLowerCase().includes(lowerQuery))
        );

        return phoneDigitsMatch || origMatches || guardianMatches || studentMatches;
      });
    }

    // Sort by student count descending (family accounts first)
    suggestions.sort((a, b) => b.students.length - a.students.length);

    // Format output
    const result = suggestions.map((group) => ({
      phone: group.originalPhone,
      cleanPhone: group.phoneKey,
      corePhone: group.coreKey,
      guardianName: group.guardianName,
      studentCount: group.students.length,
      hasMultipleStudents: group.students.length > 1,
      students: group.students,
    }));

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[/api/students/suggest-phone GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch phone suggestions" },
      { status: 500 }
    );
  }
}
