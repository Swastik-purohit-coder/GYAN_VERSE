import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  normalizeId,
  nowIso,
  checkSupabaseConfigured,
} from "../_utils/supabase";

export const runtime = "nodejs";

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
    member_count: 4,
    activity_score: 88,
    members: [
      { id: "m6", name: "Diya Nambiar", role: "leader", class: "Class 9" },
      { id: "m7", name: "Siddharth Sen", role: "member", class: "Class 9" },
      { id: "m8", name: "Tanvi Patel", role: "member", class: "Class 9" },
      { id: "m9", name: "Aditya Roy", role: "member", class: "Class 9" },
    ],
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
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
    member_count: 6,
    activity_score: 79,
    members: [
      { id: "m10", name: "Vikram Malhotra", role: "leader", class: "Class 8" },
      { id: "m11", name: "Sneha Mukherjee", role: "member", class: "Class 8" },
      { id: "m12", name: "Karan Johar", role: "member", class: "Class 8" },
      { id: "m13", name: "Riya Kapoor", role: "member", class: "Class 8" },
    ],
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
  {
    id: "group_4",
    school_id: "default",
    name: "🤝 Peer Math & Science Study Circle",
    description: "Peer-to-peer revision and doubt-solving group for Class 7 STEM curriculum.",
    category: "peer_tutoring",
    target_class: "Class 7",
    mentor_id: "teacher_1",
    mentor_name: "Prof. Arvind Sharma",
    leader_id: "student_4",
    member_count: 5,
    activity_score: 84,
    members: [
      { id: "m14", name: "Manish Gill", role: "leader", class: "Class 7" },
      { id: "m15", name: "Pooja Hegde", role: "member", class: "Class 7" },
    ],
    created_at: new Date(Date.now() - 3600000 * 140).toISOString(),
  },
];

let inMemoryGroups = [...fallbackGroups];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetClass = searchParams.get("class");

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("student_groups")
          .select("*")
          .order("activity_score", { ascending: false });

        if (category && category !== "all") query = query.eq("category", category);
        if (targetClass && targetClass !== "all") query = query.eq("target_class", targetClass);

        const groups = await run(query);
        if (groups && groups.length > 0) {
          return NextResponse.json(groups);
        }
      } catch (err) {
        console.warn("Supabase student_groups fetch failed:", err.message);
      }
    }

    let filtered = [...inMemoryGroups];
    if (category && category !== "all") {
      filtered = filtered.filter((g) => g.category === category);
    }
    if (targetClass && targetClass !== "all") {
      filtered = filtered.filter((g) => g.target_class === targetClass);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(inMemoryGroups);
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId || "user_mock";
    const body = await request.json();

    const {
      name,
      description,
      category = "study_circle",
      target_class = "Class 10",
      mentor_name = "Faculty In-Charge",
      members = [],
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const now = nowIso();
    const newGroup = {
      id: normalizeId("group", name),
      school_id: "default",
      name: name.trim(),
      description: description?.trim() || null,
      category,
      target_class,
      mentor_id: userId,
      mentor_name,
      leader_id: members?.[0]?.id || userId,
      member_count: members.length || 1,
      activity_score: 50,
      members: members.length ? members : [{ id: userId, name: "Lead Creator", role: "leader" }],
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
          inMemoryGroups = [inserted, ...inMemoryGroups];
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("Supabase student_groups insert failed:", err.message);
      }
    }

    inMemoryGroups = [newGroup, ...inMemoryGroups];
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create group" }, { status: 500 });
  }
}
