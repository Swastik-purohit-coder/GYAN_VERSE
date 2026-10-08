import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  normalizeId,
  nowIso,
  requireUserRole,
  ensureTeacher,
  checkSupabaseConfigured,
} from "../_utils/supabase";

export const runtime = "nodejs";

// Initial seed notices if table is empty or for demo/offline fallback
const fallbackNotices = [
  {
    id: "notice_1",
    school_id: "default",
    title: "📢 Monthly STEM & Robotics Olympiad Registration Open",
    content: "All students from Classes 6–12 are invited to register for the October Innovation Challenge. Team size: 2–4 members. Great prizes and certificates for all finalists!",
    category: "competition",
    target_audience: "all",
    target_class: null,
    priority: "high",
    is_pinned: true,
    attachments: [
      { name: "Olympiad_Guidelines_2026.pdf", url: "#" }
    ],
    created_by: "system_principal",
    author_name: "Dr. Evelyn Reed (Principal)",
    author_role: "principal",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "notice_2",
    school_id: "default",
    title: "📅 Mid-Term Formative Assessments Schedule Released",
    content: "The mid-term evaluation time-table for Science, Mathematics, and Computer Science is published. Please review your subject modules and attempt mock practice quizzes.",
    category: "exam",
    target_audience: "all",
    target_class: null,
    priority: "urgent",
    is_pinned: true,
    attachments: [],
    created_by: "system_admin",
    author_name: "Academic Dean Office",
    author_role: "higher_body",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "notice_3",
    school_id: "default",
    title: "💡 New 21st Century Skill Courses Available: AI & IoT",
    content: "Two new elective skill micro-courses ('Applied AI & Prompt Engineering' and 'Robotics & IoT Foundations') are now open for enrollment with verifiable certificates upon completion.",
    category: "academic",
    target_audience: "students",
    target_class: null,
    priority: "medium",
    is_pinned: false,
    attachments: [],
    created_by: "system_teacher",
    author_name: "Prof. Arvind Sharma (Tech Dept)",
    author_role: "teacher",
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

let inMemoryNotices = [...fallbackNotices];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const targetClass = searchParams.get("class");
    const priority = searchParams.get("priority");

    if (checkSupabaseConfigured()) {
      let query = supabase
        .from("noticeboard")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      if (priority && priority !== "all") {
        query = query.eq("priority", priority);
      }

      const notices = await run(query);
      if (notices && notices.length > 0) {
        return NextResponse.json(notices);
      }
    }

    // Fallback to in-memory store
    let filtered = [...inMemoryNotices];
    if (category && category !== "all") {
      filtered = filtered.filter((n) => n.category === category);
    }
    if (priority && priority !== "all") {
      filtered = filtered.filter((n) => n.priority === priority);
    }
    if (targetClass && targetClass !== "all") {
      filtered = filtered.filter(
        (n) => !n.target_class || n.target_class === targetClass || n.target_audience === "all"
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(inMemoryNotices);
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId || "mock_user";
    const body = await request.json();

    const {
      title,
      content,
      category = "general",
      target_audience = "all",
      target_class = null,
      priority = "medium",
      is_pinned = false,
      attachments = [],
      author_name = "Principal / Higher Body",
      author_role = "principal",
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const now = nowIso();
    const newNotice = {
      id: normalizeId("notice", title),
      school_id: "default",
      title: title.trim(),
      content: content.trim(),
      category,
      target_audience,
      target_class: target_class || null,
      priority,
      is_pinned: Boolean(is_pinned),
      attachments: Array.isArray(attachments) ? attachments : [],
      created_by: userId,
      author_name,
      author_role,
      created_at: now,
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("noticeboard").insert(newNotice).select().maybeSingle()
        );
        if (inserted) {
          inMemoryNotices = [inserted, ...inMemoryNotices];
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("Supabase notice insert error, falling back to memory:", err.message);
      }
    }

    inMemoryNotices = [newNotice, ...inMemoryNotices];
    return NextResponse.json(newNotice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create notice" }, { status: 500 });
  }
}
