import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  nowIso,
  normalizeId,
  checkSupabaseConfigured,
  requireUserRole,
} from "../../../_utils/supabase";
import { getOrCreateClassGroup } from "../../../_utils/communication";
import { broadcast } from "../../../_utils/events";

export const runtime = "nodejs";

if (!globalThis.__gyanaratnaInMemoryGroupMessages) {
  globalThis.__gyanaratnaInMemoryGroupMessages = {};
}
const inMemoryClassMessages = globalThis.__gyanaratnaInMemoryGroupMessages;

async function resolveUserId(request) {
  try {
    const authObj = await auth();
    if (authObj?.userId) return authObj.userId;
  } catch (err) {}
  if (process.env.NODE_ENV !== "production") {
    const headerId = request.headers.get("x-user-id") || request.headers.get("x-clerk-user-id");
    if (headerId) return headerId;
  }
  return null;
}

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine group strictly from authenticated class (IDOR prevention)
    const studentRole = await requireUserRole(userId);
    const studentClass = studentRole.class || "Class 8";
    const group = await getOrCreateClassGroup(studentClass, studentRole.school_id);
    const groupId = group.id;

    if (checkSupabaseConfigured()) {
      try {
        const messages = await run(
          supabase
            .from("group_messages")
            .select("*")
            .eq("group_id", groupId)
            .order("created_at", { ascending: true })
        );
        if (messages && messages.length > 0) {
          return NextResponse.json(messages);
        }
      } catch (err) {
        console.warn("[/api/student/group/messages GET] DB fetch warning:", err.message);
      }
    }

    if (!inMemoryClassMessages[groupId]) {
      inMemoryClassMessages[groupId] = [
        {
          id: "cmsg_init_1",
          group_id: groupId,
          sender_id: "teacher_faculty_math",
          sender_name: "Prof. Arvind Sharma (Faculty)",
          sender_role: "teacher",
          message: `Welcome to the official ${studentClass} Learning Group! Feel free to ask questions, discuss assignments, and share study notes.`,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: "cmsg_init_2",
          group_id: groupId,
          sender_id: "student_peer_1",
          sender_name: "Swastik Purohit",
          sender_role: "student",
          message: "Does anyone understand today's fractions lesson?",
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: "cmsg_init_3",
          group_id: groupId,
          sender_id: "student_peer_2",
          sender_name: "Rahul Verma",
          sender_role: "student",
          message: "Yes, I can explain it! Remember that multiplying numerator and denominator by the same number creates an equivalent fraction.",
          created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
      ];
    }

    return NextResponse.json(inMemoryClassMessages[groupId]);
  } catch (error) {
    console.error("[/api/student/group/messages GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group messages" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Server-side identity & class determination
    const studentRole = await requireUserRole(userId);
    const studentClass = studentRole.class || "Class 8";
    const group = await getOrCreateClassGroup(studentClass, studentRole.school_id);
    const groupId = group.id;

    const body = await request.json();
    const { message } = body || {};

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    const now = nowIso();
    const newMsg = {
      id: normalizeId("gmsg", Date.now().toString()),
      group_id: groupId,
      sender_id: studentRole.user_id,
      sender_name: studentRole.name || "Student",
      sender_role: studentRole.role || "student",
      message: message.trim(),
      created_at: now,
    };

    if (checkSupabaseConfigured()) {
      try {
        const inserted = await run(
          supabase.from("group_messages").insert(newMsg).select().maybeSingle()
        );
        if (inserted) {
          broadcast("group:message", {
            groupId,
            message: inserted,
          });
          return NextResponse.json(inserted, { status: 201 });
        }
      } catch (err) {
        console.warn("[/api/student/group/messages POST] DB insert warning:", err.message);
      }
    }

    if (!inMemoryClassMessages[groupId]) {
      inMemoryClassMessages[groupId] = [];
    }
    inMemoryClassMessages[groupId].push(newMsg);

    broadcast("group:message", {
      groupId,
      message: newMsg,
    });

    return NextResponse.json(newMsg, { status: 201 });
  } catch (error) {
    console.error("[/api/student/group/messages POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post group message" },
      { status: error.statusCode || 500 }
    );
  }
}
