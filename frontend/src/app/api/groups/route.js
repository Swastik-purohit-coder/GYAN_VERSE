import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  normalizeId,
  nowIso,
  requireUserRole,
  checkSupabaseConfigured,
} from "../_utils/supabase";

export const runtime = "nodejs";

function extractGradeNumber(classStr) {
  if (!classStr) return null;
  const match = String(classStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

const fallbackGroups = [
  {
    id: "group_1",
    school_id: "default",
    name: "🚀 Quantum Coders & AI Innovators",
    description: "Collaborative research and coding squad for Python algorithms, Generative AI models, and hackathons.",
    category: "hackathon_team",
    target_class: "Class 10",
    mentor_id: "teacher_1",
    mentor_name: "Prof. Arvind Sharma",
    leader_id: "student_1",
    leader_name: "Aarav Mehta",
    created_by_role: "teacher",
    is_faculty_managed: true,
    is_student_created: false,
    member_count: 5,
    activity_score: 92,
    members: [
      { id: "m1", name: "Aarav Mehta", role: "leader", class: "Class 10" },
      { id: "m2", name: "Priya Sharma", role: "member", class: "Class 10" },
      { id: "m3", name: "Rohan Varma", role: "member", class: "Class 10" },
      { id: "m4", name: "Ananya Iyer", role: "member", class: "Class 10" },
      { id: "m5", name: "Kabir Das", role: "member", class: "Class 10" },
    ],
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: "group_2",
    school_id: "default",
    name: "📐 Math Olympiad Elite Cohort",
    description: "Advanced problem solving squad preparing for regional, national, and international Math Olympiads.",
    category: "olympiad_squad",
    target_class: "Class 9",
    mentor_id: "teacher_2",
    mentor_name: "Dr. Meenakshi Sundaram",
    leader_id: "student_2",
    leader_name: "Diya Nambiar",
    created_by_role: "teacher",
    is_faculty_managed: true,
    is_student_created: false,
    member_count: 4,
    activity_score: 88,
    members: [
      { id: "m6", name: "Diya Nambiar", role: "leader", class: "Class 9" },
      { id: "m7", name: "Siddharth Sen", role: "member", class: "Class 9" },
      { id: "m8", name: "Tanvi Patel", role: "member", class: "Class 9" },
      { id: "m9", name: "Aditya Roy", role: "member", class: "Class 9" },
    ],
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: "group_3",
    school_id: "default",
    name: "🔬 Bio-Tech & Eco Explorers",
    description: "Science exhibition project squad focusing on renewable energy prototypes and sustainable biodiversity models.",
    category: "science_club",
    target_class: "Class 8",
    mentor_id: "teacher_3",
    mentor_name: "Mrs. Sunita Rao",
    leader_id: "student_3",
    leader_name: "Vikram Malhotra",
    created_by_role: "teacher",
    is_faculty_managed: true,
    is_student_created: false,
    member_count: 4,
    activity_score: 79,
    members: [
      { id: "m10", name: "Vikram Malhotra", role: "leader", class: "Class 8" },
      { id: "m11", name: "Sneha Mukherjee", role: "member", class: "Class 8" },
      { id: "m12", name: "Karan Johar", role: "member", class: "Class 8" },
      { id: "m13", name: "Riya Kapoor", role: "member", class: "Class 8" },
    ],
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
  {
    id: "group_4",
    school_id: "default",
    name: "💡 Senior Python & Web Dev Circle",
    description: "Independent peer study group formed by Class 8 seniors for hands-on web projects and competitive coding.",
    category: "study_circle",
    target_class: "Class 8",
    mentor_id: null,
    mentor_name: "Self-Governed Peer Group",
    leader_id: "student_lead_8",
    leader_name: "Rohan Verma",
    created_by_role: "student",
    is_faculty_managed: false,
    is_student_created: true,
    member_count: 3,
    activity_score: 85,
    members: [
      { id: "m14", name: "Rohan Verma", role: "leader", class: "Class 8" },
      { id: "m15", name: "Tanvi Patel", role: "member", class: "Class 8" },
      { id: "m16", name: "Kabir Das", role: "member", class: "Class 8" },
    ],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

let inMemoryGroups = [...fallbackGroups];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetClass = searchParams.get("class");
    const studentId = searchParams.get("studentId");
    const createdByRole = searchParams.get("createdByRole");
    const schoolId = searchParams.get("schoolId");

    let groups = [];
    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("student_groups")
          .select("*")
          .order("activity_score", { ascending: false })
          .order("created_at", { ascending: false });

        if (category && category !== "all") query = query.eq("category", category);
        if (targetClass && targetClass !== "all") query = query.eq("target_class", targetClass);
        if (createdByRole && createdByRole !== "all") query = query.eq("created_by_role", createdByRole);

        const rows = await run(query);
        if (Array.isArray(rows) && rows.length > 0) {
          groups = rows;
        }
      } catch (err) {
        console.warn("[/api/groups GET] Supabase student_groups fetch failed:", err.message);
      }
    }

    // Fallback to inMemoryGroups if DB is empty or unconfigured
    if (groups.length === 0) {
      groups = [...inMemoryGroups];
    }

    // Apply in-memory filters
    let filtered = groups;
    if (category && category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }
    if (targetClass && targetClass !== "all") {
      filtered = filtered.filter((g) => g.target_class === targetClass);
    }
    if (createdByRole && createdByRole !== "all") {
      filtered = filtered.filter((g) => g.created_by_role === createdByRole);
    }
    if (studentId) {
      filtered = filtered.filter((g) => {
        if (g.leader_id === studentId || g.created_by === studentId) return true;
        if (Array.isArray(g.members)) {
          return g.members.some((m) => m.id === studentId || m.userId === studentId || m.name === studentId);
        }
        return false;
      });
    }

    return NextResponse.json(filtered, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(inMemoryGroups);
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const userDoc = await requireUserRole(userId);
    const userRole = String(userDoc?.role || "student").toLowerCase().trim();
    const isFaculty = ["teacher", "admin", "principal", "higher_body"].includes(userRole);

    const body = await request.json();
    const {
      name,
      description,
      category = "study_circle",
      target_class = "Class 10",
      mentor_name,
      leader_name,
      leader_id,
      members = [],
      is_student_created: requestedStudentCreated,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    // =========================================================================
    // STUDENT GROUPING GRADE RESTRICTION:
    // Students up to Class 6 cannot create personal groups (faculty-only mode).
    // Students above Class 6 (Class 7+) can create personal peer groups.
    // =========================================================================
    if (!isFaculty) {
      const studentClass = userDoc.class || target_class || "Class 6";
      const gradeNum = extractGradeNumber(studentClass);

      if (gradeNum !== null && gradeNum <= 6) {
        return NextResponse.json(
          {
            error:
              "Child Safety & Parental Control Rule: Students in Class 6 or below can only participate in teacher-assigned groups. Personal group creation unlocks in Class 7.",
            gradeRestricted: true,
            currentGrade: gradeNum,
          },
          { status: 403 }
        );
      }
    }

    const isStudentCreated = !isFaculty || Boolean(requestedStudentCreated);
    const createdByRole = isFaculty ? "teacher" : "student";
    const facultyManaged = isFaculty;

    const defaultLeaderName = leader_name || userDoc.name || (isFaculty ? "Faculty Lead" : "Student Lead");
    const defaultLeaderId = leader_id || userId;

    const formattedMembers = Array.isArray(members) && members.length > 0
      ? members.map((m, idx) => ({
          id: m.id || m.userId || m.studentId || `m_${Date.now()}_${idx}`,
          name: m.name || `Member ${idx + 1}`,
          role: m.role || (m.id === defaultLeaderId ? "leader" : "member"),
          class: m.class || target_class,
        }))
      : [
          {
            id: defaultLeaderId,
            name: defaultLeaderName,
            role: "leader",
            class: userDoc.class || target_class,
          },
        ];

    // Ensure leader is in members
    if (!formattedMembers.some((m) => m.id === defaultLeaderId || m.role === "leader")) {
      formattedMembers.unshift({
        id: defaultLeaderId,
        name: defaultLeaderName,
        role: "leader",
        class: userDoc.class || target_class,
      });
    }

    const now = nowIso();
    const newGroup = {
      id: normalizeId("group", name),
      school_id: userDoc.school_id || "default_school",
      name: name.trim(),
      description: description ? String(description).trim() : null,
      category,
      target_class: target_class.trim(),
      mentor_id: isFaculty ? userId : null,
      mentor_name: mentor_name ? mentor_name.trim() : (isFaculty ? (userDoc.name || "Faculty In-Charge") : "Self-Governed Peer Group"),
      leader_id: defaultLeaderId,
      leader_name: defaultLeaderName,
      created_by_role: createdByRole,
      is_faculty_managed: facultyManaged,
      is_student_created: isStudentCreated,
      member_count: formattedMembers.length,
      activity_score: 60,
      members: formattedMembers,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("student_groups").insert(newGroup).select().maybeSingle()
        );
        if (inserted) {
          inMemoryGroups = [inserted, ...inMemoryGroups.filter((g) => g.id !== inserted.id)];
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("[/api/groups POST] Supabase insert warning:", err.message);
      }
    }

    inMemoryGroups = [newGroup, ...inMemoryGroups.filter((g) => g.id !== newGroup.id)];
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error("[/api/groups POST] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create group" }, { status: error.statusCode || 500 });
  }
}
