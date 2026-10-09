import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  normalizeId,
  nowIso,
  checkSupabaseConfigured,
} from "../_utils/supabase";
import { parseStudentGrade, isGradeUpTo6 } from "@/lib/resourceAccess";

export const runtime = "nodejs";

const fallbackSkillCourses = [
  {
    id: "skill_1",
    title: "🤖 Applied AI & Prompt Engineering Masterclass",
    description: "Learn fundamental principles of Large Language Models, prompt techniques (zero-shot, few-shot, chain-of-thought), ethics in AI, and building intelligent agents.",
    category: "AI & Tech",
    level: "intermediate",
    source_type: "alumni",
    author_name: "Dr. K. S. Ramanathan (Class of '19)",
    author_role: "Alumni | AI Research Scientist @ DeepMind",
    instructor_name: "Dr. K. S. Ramanathan",
    duration_hours: 12,
    target_grade_min: 7,
    target_grade_max: 12,
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
    title: "🎙️ Public Speaking, Debate & Masterful Storytelling (Junior & Senior)",
    description: "Develop persuasive communication skills, structure compelling arguments, conquer stage fear, and present ideas with impact.",
    category: "Public Speaking",
    level: "beginner",
    source_type: "teacher",
    author_name: "Ms. Shalini Roy",
    author_role: "Head of English & Debating Society",
    instructor_name: "Ms. Shalini Roy",
    duration_hours: 8,
    target_grade_min: 1,
    target_grade_max: 12,
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
    source_type: "community",
    author_name: "OpenRobotics Guild",
    author_role: "Verified Community Maker Lab",
    instructor_name: "Prof. Arvind Sharma",
    duration_hours: 15,
    target_grade_min: 7,
    target_grade_max: 12,
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
    source_type: "retired_teacher",
    author_name: "CA Rajesh Goel (Retd. Commerce HoD)",
    author_role: "Retired Veteran Faculty & Financial Consultant",
    instructor_name: "CA Rajesh Goel",
    duration_hours: 6,
    target_grade_min: 7,
    target_grade_max: 12,
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
    source_type: "senior",
    author_name: "Rohan Verma (Grade 12)",
    author_role: "Senior Scholar | Design Lead @ School Media Club",
    instructor_name: "Maya Fernandez",
    duration_hours: 10,
    target_grade_min: 7,
    target_grade_max: 12,
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
  {
    id: "skill_6",
    title: "🧩 Creative Thinking, Puzzles & Math Olympiad Foundations (Junior)",
    description: "Logical reasoning, visual pattern recognition, arithmetic puzzles, and lateral thinking games designed specifically for Grades 1–6.",
    category: "Math & Logic",
    level: "beginner",
    source_type: "teacher",
    author_name: "Mr. V. K. Aggarwal",
    author_role: "Junior Math Lead, Gyanaratna Academy",
    instructor_name: "Mr. V. K. Aggarwal",
    duration_hours: 8,
    target_grade_min: 1,
    target_grade_max: 6,
    badge_icon: "🧩",
    badge_name: "Junior Math Pioneer",
    modules_count: 4,
    enrolled_count: 110,
    published: true,
    curriculum: [
      { id: "m1", title: "Number Patterns & Magic Squares", duration: "2h" },
      { id: "m2", title: "Geometric Shapes & Symmetry Secrets", duration: "2h" },
      { id: "m3", title: "Logical Deduction Riddles", duration: "2h" },
      { id: "m4", title: "Junior Olympiad Problem Solving", duration: "2h" },
    ],
    created_at: new Date(Date.now() - 3600000 * 320).toISOString(),
  },
];

let inMemorySkills = [...fallbackSkillCourses];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const level = searchParams.get("level");
    const sourceType = searchParams.get("sourceType");
    const studentClass = searchParams.get("studentClass");

    let courses = [];

    if (checkSupabaseConfigured()) {
      try {
        let query = supabase
          .from("skill_courses")
          .select("*")
          .order("enrolled_count", { ascending: false });

        if (category && category !== "all") query = query.eq("category", category);
        if (level && level !== "all") query = query.eq("level", level);
        if (sourceType && sourceType !== "all") query = query.eq("source_type", sourceType);

        const dbCourses = await run(query);
        if (dbCourses && dbCourses.length > 0) {
          courses = dbCourses;
        }
      } catch (err) {
        console.warn("Supabase skill_courses query failed, using inMemory:", err.message);
      }
    }

    if (!courses.length) {
      courses = [...inMemorySkills];
      if (category && category !== "all") {
        courses = courses.filter((c) => c.category === category);
      }
      if (level && level !== "all") {
        courses = courses.filter((c) => c.level === level);
      }
      if (sourceType && sourceType !== "all") {
        courses = courses.filter((c) => (c.source_type || "teacher") === sourceType);
      }
    }

    // Apply Grade 1-6 Access Control
    if (studentClass) {
      const isJunior = isGradeUpTo6(studentClass);
      if (isJunior) {
        courses = courses.map((course) => ({
          ...course,
          is_locked: (course.source_type || "teacher") !== "teacher",
          lock_reason: (course.source_type || "teacher") !== "teacher"
            ? "Class 1–6 can only access official teacher-provided skill courses. Community/alumni courses unlock in Class 7+."
            : null,
        }));
      }
    }

    return NextResponse.json(courses);
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
      source_type = "teacher",
      author_name = "Lead Faculty",
      author_role = "Teacher",
      instructor_name,
      duration_hours = 10,
      target_grade_min = 1,
      target_grade_max = 12,
      badge_icon = "⭐",
      badge_name = "Skill Certificate",
      curriculum = [],
      published = true,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Skill course title is required" }, { status: 400 });
    }

    const modCount = Number(body.modules_count) || (Array.isArray(curriculum) && curriculum.length) || 4;
    const durHours = Number(duration_hours) || (Number(body.duration_weeks) ? Number(body.duration_weeks) * 2.5 : 8);

    let resolvedCurriculum = Array.isArray(curriculum) && curriculum.length > 0 ? curriculum : [];
    if (resolvedCurriculum.length === 0) {
      const defaultTemplates = [
        { id: "m1", title: `Introduction & Foundational Concepts of ${title.trim()}`, duration: "1.5h", description: "Core concepts, fundamental terminology, and real-world applications." },
        { id: "m2", title: "Tools, Frameworks & Practical Hands-on Setup", duration: "2h", description: "Step-by-step setup, workspace preparation, and practical exercises." },
        { id: "m3", title: "Deep Dive: Intermediate Techniques & Problem Solving", duration: "2.5h", description: "Hands-on projects, problem breakdown, and guided solutions." },
        { id: "m4", title: "Advanced Best Practices & Capstone Project", duration: "2h", description: "Showcase submission, review, and certification assessment." },
        { id: "m5", title: "Industry Mentorship & Next Steps Exploration", duration: "1.5h", description: "Career pathways, peer collaboration, and continuous mastery." },
      ];
      resolvedCurriculum = defaultTemplates.slice(0, Math.min(Math.max(2, modCount), defaultTemplates.length));
    }

    const defaultIcons = {
      ai_tech: "⚡",
      coding: "🔧",
      leadership: "🎙️",
      finance: "📈",
      design: "🎨",
    };
    const normCat = String(category || "").toLowerCase();
    const resolvedBadgeIcon = badge_icon !== "⭐" ? badge_icon : (defaultIcons[normCat] || "🏆");
    const resolvedBadgeName = badge_name !== "Skill Certificate" ? badge_name : `${title.trim()} Specialist`;

    const now = nowIso();
    const newCourse = {
      id: normalizeId("skill", title),
      school_id: "default",
      title: title.trim(),
      description: description?.trim() || "",
      category,
      level,
      source_type,
      author_name: author_name || instructor_name || "Faculty In-Charge",
      author_role: author_role || "Educator",
      instructor_name: instructor_name || author_name || "Lead Faculty",
      duration_hours: durHours,
      target_grade_min: Number(target_grade_min) || 1,
      target_grade_max: Number(target_grade_max) || 12,
      badge_icon: resolvedBadgeIcon,
      badge_name: resolvedBadgeName,
      modules_count: resolvedCurriculum.length,
      enrolled_count: 0,
      published: Boolean(published),
      curriculum: resolvedCurriculum,
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
