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

const fallbackCompetitions = [
  {
    id: "comp_oct_2026",
    title: "⚡ October National AI & STEM Innovation Marathon",
    tagline: "Build sustainable tech & AI prototypes solving real-world classroom & climate challenges",
    description: "Submit a working interactive software project, AI demo, or STEM prototype. Judged by industry leaders and academic heads on Innovation, Technical Depth, UI/UX, and Social Impact.",
    theme: "AI for Environmental Sustainability & Education",
    category: "hackathon",
    month_year: "October 2026",
    target_classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    start_date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    end_date: new Date(Date.now() + 3600000 * 24 * 15).toISOString(),
    prize_pool: "₹50,000 Trophy + National Medals + Gyanaratan Tech Kits",
    rules: [
      "Open to all enrolled students individually or in sub-groups of up to 4 members.",
      "Projects must be original and accompanied by a short video walkthrough or repository link.",
      "Live peer voting will count for 30% of total score, with 70% evaluated by Faculty Jury.",
    ],
    submission_type: "team_submission",
    status: "active",
    entries_count: 28,
    top_entries: [
      { id: "e1", student_name: "Quantum Coders Squad", project_title: "EcoSmart Campus AI Power Grid", score: 96, rank: 1 },
      { id: "e2", student_name: "Diya Nambiar & Team", project_title: "MathVisualizer 3D Geometry Toolkit", score: 92, rank: 2 },
      { id: "e3", student_name: "Aarav Mehta", project_title: "Automated Crop Disease Detector", score: 89, rank: 3 },
    ],
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
  },
  {
    id: "comp_nov_2026",
    title: "🏆 November Inter-School Mathematics & Algorithmic Sprint",
    tagline: "Speed, accuracy, and logic showdown across 3 intense rounds",
    description: "Multi-round timed mathematics and algorithmic quiz battle featuring speed arithmetic, combinatorics, graph theory puzzles, and logic riddles.",
    theme: "Pure Mathematics & Speed Algorithms",
    category: "olympiad",
    month_year: "November 2026",
    target_classes: ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    start_date: new Date(Date.now() + 3600000 * 24 * 16).toISOString(),
    end_date: new Date(Date.now() + 3600000 * 24 * 25).toISOString(),
    prize_pool: "Gold, Silver, Bronze Medals + Merit Certificates",
    rules: [
      "Individual participation with timed dynamic quizzes.",
      "Negative marking for wrong guesses in Round 3.",
    ],
    submission_type: "quiz",
    status: "upcoming",
    entries_count: 64,
    top_entries: [],
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: "comp_sep_2026",
    title: "🔬 September Junior Science Discovery Exhibition",
    tagline: "Young scientists demonstrating chemical reactions, optics, and physics principles",
    description: "Annual science fair where students submitted live experiments, home-laboratory recordings, and research posters.",
    theme: "Everyday Physics & Green Chemistry",
    category: "science_fair",
    month_year: "September 2026",
    target_classes: ["Class 6", "Class 7", "Class 8"],
    start_date: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
    end_date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    prize_pool: "Science Fair Champions Trophy & Certificates",
    rules: ["Experiment video or PDF documentation required."],
    submission_type: "video",
    status: "completed",
    entries_count: 42,
    top_entries: [
      { id: "e10", student_name: "Sneha Mukherjee (Class 8)", project_title: "Hydroponics with Recycled Water", score: 98, rank: 1 },
      { id: "e11", student_name: "Manish Gill (Class 7)", project_title: "Solar-Powered Water Filtration Unit", score: 94, rank: 2 },
    ],
    created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
  },
];

let inMemoryCompetitions = [...fallbackCompetitions];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("monthly_competitions")
          .select("*")
          .order("created_at", { ascending: false });

        if (status && status !== "all") query = query.eq("status", status);
        if (category && category !== "all") query = query.eq("category", category);

        const comps = await run(query);
        if (comps && comps.length > 0) {
          return NextResponse.json(comps);
        }
      } catch (err) {
        console.warn("Supabase monthly_competitions fetch failed:", err.message);
      }
    }

    let filtered = [...inMemoryCompetitions];
    if (status && status !== "all") {
      filtered = filtered.filter((c) => c.status === status);
    }
    if (category && category !== "all") {
      filtered = filtered.filter((c) => c.category === category);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(inMemoryCompetitions);
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId || "user_organizer";
    const body = await request.json();

    const {
      title,
      tagline,
      description,
      theme,
      category = "hackathon",
      month_year = "October 2026",
      target_classes = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
      start_date,
      end_date,
      prize_pool = "Exciting Prizes & Certificates",
      rules = [],
      submission_type = "team_submission",
      status = "active",
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Competition title and description are required" }, { status: 400 });
    }

    const now = nowIso();
    const newComp = {
      id: normalizeId("comp", title),
      school_id: "default",
      title: title.trim(),
      tagline: tagline?.trim() || "",
      description: description.trim(),
      theme: theme?.trim() || "STEM & Innovation",
      category,
      month_year,
      target_classes: Array.isArray(target_classes) ? target_classes : [target_classes],
      start_date: start_date || now,
      end_date: end_date || new Date(Date.now() + 3600000 * 24 * 30).toISOString(),
      prize_pool,
      rules: Array.isArray(rules) && rules.length ? rules : ["All students eligible", "Original work required"],
      submission_type,
      status,
      created_by: userId,
      created_at: now,
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("monthly_competitions").insert(newComp).select().maybeSingle()
        );
        if (inserted) {
          inMemoryCompetitions = [inserted, ...inMemoryCompetitions];
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("Supabase monthly_competitions insert failed:", err.message);
      }
    }

    inMemoryCompetitions = [newComp, ...inMemoryCompetitions];
    return NextResponse.json(newComp, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create competition" }, { status: 500 });
  }
}
