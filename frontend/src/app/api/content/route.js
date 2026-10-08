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
import { broadcast } from "../_utils/events";
import { SEED_EDUCATIONAL_MATERIALS, parseStudentGrade, isGradeUpTo6 } from "@/lib/resourceAccess";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["quiz", "article", "video", "material", "skill"]);
const ALLOWED_SOURCES = new Set(["teacher", "alumni", "senior", "retired_teacher", "community"]);

let inMemoryContent = [...SEED_EDUCATIONAL_MATERIALS];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const type = searchParams.get("type");
    const sourceType = searchParams.get("sourceType");
    const studentClass = searchParams.get("studentClass");
    const limitParam = searchParams.get("limit");

    let allItems = [];

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("school_content")
          .select("*")
          .order("created_at", { ascending: false });

        if (schoolId) {
          query = query.eq("school_id", schoolId);
        }
        if (type && ALLOWED_TYPES.has(type)) {
          query = query.eq("type", type);
        }
        if (sourceType && ALLOWED_SOURCES.has(sourceType)) {
          query = query.eq("source_type", sourceType);
        }

        const rows = await run(query);
        if (rows && rows.length > 0) {
          allItems = rows.map((row) => ({
            id: row.id,
            schoolId: row.school_id,
            createdBy: row.created_by,
            type: row.type,
            source_type: row.source_type || "teacher",
            author_name: row.author_name || "Faculty In-Charge",
            author_role: row.author_role || "Teacher",
            duration: row.duration || "15 mins",
            target_grade_min: row.target_grade_min || 1,
            target_grade_max: row.target_grade_max || 12,
            title: row.title,
            description: row.description,
            url: row.url,
            embedHtml: row.embed_html,
            body: row.body,
            tags: row.tags || [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (dbErr) {
        console.warn("Supabase school_content query error, using inMemoryContent:", dbErr.message);
      }
    }

    if (!allItems.length) {
      allItems = [...inMemoryContent];
    }

    // Filter by type if requested
    if (type && ALLOWED_TYPES.has(type)) {
      allItems = allItems.filter((i) => i.type === type);
    }

    // Filter by source type if requested
    if (sourceType && ALLOWED_SOURCES.has(sourceType)) {
      allItems = allItems.filter((i) => (i.source_type || "teacher") === sourceType);
    }

    // Apply strict access control for students in Class <= 6
    if (studentClass) {
      const isJunior = isGradeUpTo6(studentClass);
      if (isJunior) {
        // Tag items or filter them: Junior students (Class <= 6) can ONLY access teacher provided resources
        allItems = allItems.map((item) => ({
          ...item,
          is_locked: (item.source_type || "teacher") !== "teacher",
          lock_reason: (item.source_type || "teacher") !== "teacher"
            ? "Protected: Available for Class 7+ (Senior Access)"
            : null,
        }));
      }
    }

    if (limitParam) {
      const parsed = Number.parseInt(limitParam, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        allItems = allItems.slice(0, Math.min(parsed, 200));
      }
    }

    return NextResponse.json(allItems, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(inMemoryContent, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      },
    });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const {
      createdBy,
      title,
      description,
      type = "video",
      source_type = "teacher",
      author_name = "Faculty Lead",
      author_role = "Teacher",
      duration = "20 mins",
      target_grade_min = 1,
      target_grade_max = 12,
      url,
      embedHtml,
      body,
      tags,
    } = payload || {};

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const safeType = ALLOWED_TYPES.has(type) ? type : "video";
    const safeSource = ALLOWED_SOURCES.has(source_type) ? source_type : "teacher";
    const now = nowIso();
    const id = normalizeId("content", title);

    const sanitizedTags = Array.isArray(tags)
      ? tags.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
      : [];

    const doc = {
      id,
      school_id: payload.schoolId || "default_school",
      created_by: createdBy || "user_faculty",
      type: safeType,
      source_type: safeSource,
      author_name: author_name.trim(),
      author_role: author_role.trim(),
      duration: duration.trim(),
      target_grade_min: Number(target_grade_min) || 1,
      target_grade_max: Number(target_grade_max) || 12,
      title: title.trim(),
      description: description ? String(description).trim() : null,
      url: url ? String(url).trim() : null,
      embed_html: embedHtml ? String(embedHtml).trim() : null,
      body: body ? String(body).trim() : null,
      tags: sanitizedTags.length ? sanitizedTags : null,
      created_at: now,
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("school_content").insert(doc).select().maybeSingle()
        );
        if (inserted) {
          inMemoryContent = [doc, ...inMemoryContent];
          broadcast("content.created", doc);
          return NextResponse.json({ success: true, content: doc }, { status: 201 });
        }
      } catch (dbErr) {
        console.warn("Supabase insert error, falling back to memory store:", dbErr.message);
      }
    }

    inMemoryContent = [doc, ...inMemoryContent];
    broadcast("content.created", doc);
    return NextResponse.json({ success: true, content: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to create educational material" },
      { status: 500 }
    );
  }
}
