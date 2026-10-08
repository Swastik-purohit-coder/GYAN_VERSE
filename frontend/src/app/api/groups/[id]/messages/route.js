import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  normalizeId,
  nowIso,
  checkSupabaseConfigured,
} from "../../../_utils/supabase";

export const runtime = "nodejs";

const initialGroupMessages = {
  group_1: [
    {
      id: "msg_1",
      sender_id: "teacher_1",
      sender_name: "Prof. Arvind Sharma (Mentor)",
      sender_role: "teacher",
      message: "Welcome team! Let's start preparing for the October Hackathon. Please review the AI Model design guidelines.",
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: "msg_2",
      sender_id: "student_1",
      sender_name: "Aarav Mehta (Captain)",
      sender_role: "student",
      message: "Thanks Professor! I have set up our project repository and shared the dataset for prompt optimization.",
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: "msg_3",
      sender_id: "student_2",
      sender_name: "Priya Sharma",
      sender_role: "student",
      message: "I am working on the prototype UI and user workflow diagram. Will upload it here soon!",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  group_2: [
    {
      id: "msg_201",
      sender_id: "teacher_2",
      sender_name: "Dr. Meenakshi Sundaram",
      sender_role: "teacher",
      message: "Practice set #4 on Combinatorics & Number Theory is live. Let us schedule our group discussion this Thursday.",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ],
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    if (checkSupabaseConfigured()) {
      try {
        const messages = await run(
          supabase
            .from("group_messages")
            .select("*")
            .eq("group_id", id)
            .order("created_at", { ascending: true })
        );
        if (messages && messages.length > 0) {
          return NextResponse.json(messages);
        }
      } catch (err) {
        console.warn("Supabase group_messages fetch error:", err.message);
      }
    }

    const list = initialGroupMessages[id] || [
      {
        id: "msg_welcome",
        sender_id: "system",
        sender_name: "Group Channel Bot",
        sender_role: "system",
        message: `Welcome to the peer discussion channel for ${id}! Collaborate, share notes, and build together.`,
        created_at: new Date().toISOString(),
      },
    ];

    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const authObj = await auth();
    const userId = authObj?.userId || "user_student";
    const body = await request.json();

    const {
      sender_name = "Student Member",
      sender_role = "student",
      message,
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const now = nowIso();
    const newMsg = {
      id: normalizeId("msg", Date.now().toString()),
      group_id: id,
      sender_id: userId,
      sender_name,
      sender_role,
      message: message.trim(),
      created_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("group_messages").insert(newMsg).select().maybeSingle()
        );
        if (inserted) {
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("Supabase group_messages insert error:", err.message);
      }
    }

    if (!initialGroupMessages[id]) {
      initialGroupMessages[id] = [];
    }
    initialGroupMessages[id].push(newMsg);

    return NextResponse.json(newMsg, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to post message" }, { status: 500 });
  }
}
