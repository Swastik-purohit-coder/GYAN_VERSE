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

const fallbackSkillCourses = [
  {
    id: "skill_1",
    title: "🤖 Applied AI & Prompt Engineering Masterclass",
    description: "Learn fundamental principles of Large Language Models, prompt techniques (zero-shot, few-shot, chain-of-thought), ethics in AI, and building intelligent agents.",
    category: "AI & Tech",
    level: "intermediate",
    instructor_name: "Dr. K. S. Ramanathan",
    duration_hours: 12,
    badge_icon: "⚡",
    badge_name: "AI Prompt Architect",
    modules_count: 5,
    enrolled_count: 142,
    published: true,
    curriculum: [
      { id: "m1", title: "Introduction to Generative AI & LLM Architecture", duration: "2h" },
      { id: "m2", title: "Effective Prompt Structuring & Role Prompting", duration: "2.5h" },
      { id: "m3", title: "Context Management, Few-Shot & Chain of Thought", duration: "3h" },
      { id: "m4", title: "AI Safety, Hallucination Prevention & Ethics", duration: "2h" },
      { id: "m5", title: "Capstone Project: Build an AI Classroom Assistant", duration: "2.5h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 200).toISOString(),
  },
  {
    id: "skill_2",
    title: "🎙️ Public Speaking, Debate & Masterful Storytelling",
    description: "Develop persuasive communication skills, structure compelling arguments, conquer stage fear, and present ideas with impact.",
    category: "Public Speaking",
    level: "beginner",
    instructor_name: "Ms. Shalini Roy",
    duration_hours: 8,
    badge_icon: "🎤",
    badge_name: "Oratory Leader",
    modules_count: 4,
    enrolled_count: 98,
    published: true,
    curriculum: [
      { id: "m1", title: "Voice Modulation, Body Language & Overcoming Anxiety", duration: "2h" },
      { id: "m2", title: "The Art of Persuasive Structuring & Hooking Audiences", duration: "2h" },
      { id: "m3", title: "Parliamentary Debate Format & Rebuttal Strategies", duration: "2h" },
      { id: "m4", title: "TED-Style Presentation & Final Recorded Speech", duration: "2h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 220).toISOString(),
  },
  {
    id: "skill_3",
    title: "🛰️ Robotics, IoT & Embedded Sensor Systems",
    description: "Hands-on microcontrollers (Arduino/ESP32), sensor interfacing, circuit logic, and programming autonomous smart IoT devices.",
    category: "Robotics & IoT",
    level: "intermediate",
    instructor_name: "Prof. Arvind Sharma",
    duration_hours: 15,
    badge_icon: "🔧",
    badge_name: "IoT Hardware Pioneer",
    modules_count: 6,
    enrolled_count: 115,
    published: true,
    curriculum: [
      { id: "m1", title: "Basics of Electronics, Breadboards & Microcontrollers", duration: "2.5h" },
      { id: "m2", title: "Reading Analog & Digital Sensors (Ultrasonic, Temp, LDR)", duration: "2.5h" },
      { id: "m3", title: "Actuators: Controlling Servos, Motors & Relays", duration: "2.5h" },
      { id: "m4", title: "Wireless Data Transfer using Wi-Fi & MQTT", duration: "2.5h" },
      { id: "m5", title: "Building a Smart Home Automation System", duration: "2.5h" },
      { id: "m6", title: "Capstone: Autonomous Line Follower Robot", duration: "2.5h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 250).toISOString(),
  },
  {
    id: "skill_4",
    title: "💰 Financial Literacy, Budgeting & Smart Investing for Youth",
    description: "Master budgeting, compounding, inflation, equity markets, banking fundamentals, and financial decision-making for lifelong independence.",
    category: "Finance",
    level: "beginner",
    instructor_name: "CA Rajesh Goel",
    duration_hours: 6,
    badge_icon: "📈",
    badge_name: "Finance Prodigy",
    modules_count: 4,
    enrolled_count: 85,
    published: true,
    curriculum: [
      { id: "m1", title: "The Time Value of Money & Compound Interest Magic", duration: "1.5h" },
      { id: "m2", title: "Smart Budgeting & The 50/30/20 Rule", duration: "1.5h" },
      { id: "m3", title: "Understanding Stocks, Mutual Funds & Bonds", duration: "1.5h" },
      { id: "m4", title: "Risk Management, Taxes & Financial Goal Setting", duration: "1.5h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 280).toISOString(),
  },
  {
    id: "skill_5",
    title: "🎨 Creative UI/UX Design & Digital Product Thinking",
    description: "Design stunning digital interfaces, wireframing, color theory, typography, design systems, and user empathy testing.",
    category: "Design",
    level: "beginner",
    instructor_name: "Maya Fernandez",
    duration_hours: 10,
    badge_icon: "✨",
    badge_name: "Design Maestro",
    modules_count: 5,
    enrolled_count: 73,
    published: true,
    curriculum: [
      { id: "m1", title: "Design Thinking Framework & User Research", duration: "2h" },
      { id: "m2", title: "Wireframing & Low-Fidelity Prototyping", duration: "2h" },
      { id: "m3", title: "Visual Design: Colors, Typography & Glassmorphism", duration: "2h" },
      { id: "m4", title: "Interactive Components & Micro-animations", duration: "2h" },
      { id: "m5", title: "Portfolio Showcase: Design a Mobile Learning App", duration: "2h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 300).toISOString(),
  },
];

let inMemorySkills = [...fallbackSkillCourses];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("skill_courses")
          .select("*")
          .order("enrolled_count", { ascending: false });

        if (category && category !== "all") query = query.eq("category", category);
        if (level && level !== "all") query = query.eq("level", level);

        const courses = await run(query);
        if (courses && courses.length > 0) {
          return NextResponse.json(courses);
        }
      } catch (err) {
        console.warn("Supabase skill_courses query failed:", err.message);
      }
    }

    let filtered = [...inMemorySkills];
    if (category && category !== "all") {
      filtered = filtered.filter((c) => c.category === category);
    }
    if (level && level !== "all") {
      filtered = filtered.filter((c) => c.level === level);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json(inMemorySkills);
  }
}

export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId || "user_instructor";
    const body = await request.json();

    const {
      title,
      description,
      category = "AI & Tech",
      level = "beginner",
      instructor_name = "Lead Faculty",
      duration_hours = 10,
      badge_icon = "⭐",
      badge_name = "Skill Certificate",
      curriculum = [],
      published = true,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Skill course title is required" }, { status: 400 });
    }

    const now = nowIso();
    const newCourse = {
      id: normalizeId("skill", title),
      school_id: "default",
      title: title.trim(),
      description: description?.trim() || "",
      category,
      level,
      instructor_name,
      duration_hours: Number(duration_hours) || 10,
      badge_icon,
      badge_name,
      modules_count: curriculum.length || 4,
      enrolled_count: 0,
      published: Boolean(published),
      curriculum,
      created_at: now,
      updated_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("skill_courses").insert(newCourse).select().maybeSingle()
        );
        if (inserted) {
          inMemorySkills = [inserted, ...inMemorySkills];
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("Supabase skill_courses insert failed:", err.message);
      }
    }

    inMemorySkills = [newCourse, ...inMemorySkills];
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to create skill course" }, { status: 500 });
  }
}
