import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireUserRole } from "../../../_utils/supabase";
import {
  getOrCreateClassGroup,
  getClassGroupResources,
  addClassGroupResource,
} from "../../../_utils/communication";
import { broadcast } from "../../../_utils/events";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

const DISALLOWED_EXTENSIONS = [
  "exe", "bat", "cmd", "sh", "bin", "msi", "vbs", "js", "py", "apk",
  "com", "scr", "jar", "ps1", "app", "action", "gadget",
];

const ALLOWED_MIME_PATTERNS = [
  "application/pdf",
  "image/",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

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

    const studentRole = await requireUserRole(userId);
    const studentClass = studentRole.class || "Class 8";
    const group = await getOrCreateClassGroup(studentClass, studentRole.school_id);

    const resources = await getClassGroupResources(group.id);

    return NextResponse.json({
      groupId: group.id,
      className: studentClass,
      resources,
    });
  } catch (error) {
    console.error("[/api/student/group/resources GET] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group resources" },
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

    const studentRole = await requireUserRole(userId);
    const studentClass = studentRole.class || "Class 8";
    const group = await getOrCreateClassGroup(studentClass, studentRole.school_id);

    const body = await request.json();
    const {
      file_name,
      file_type,
      file_size,
      storage_path,
      file_url,
    } = body || {};

    if (!file_name || !file_name.trim()) {
      return NextResponse.json({ error: "file_name is required" }, { status: 400 });
    }

    // 1. Validate file extension
    const extension = file_name.split(".").pop().toLowerCase();
    if (DISALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `Executable or script file type .${extension} is strictly prohibited.` },
        { status: 400 }
      );
    }

    // 2. Validate file size
    const numericSize = Number(file_size) || 0;
    if (numericSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds the 25MB limit (current: ${(numericSize / 1024 / 1024).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // 3. Validate mime type if provided
    if (file_type) {
      const isAllowed = ALLOWED_MIME_PATTERNS.some((p) =>
        p.endsWith("/") ? file_type.startsWith(p) : file_type === p
      );
      if (!isAllowed && !["application/octet-stream"].includes(file_type)) {
        return NextResponse.json(
          { error: "Invalid file format. Only educational documents, PDFs, and images are permitted." },
          { status: 400 }
        );
      }
    }

    const resource = await addClassGroupResource({
      group_id: group.id,
      sender_id: studentRole.user_id,
      sender_name: studentRole.name || "Student",
      file_name: file_name.trim(),
      file_type: file_type || "application/octet-stream",
      file_size: numericSize,
      storage_path: storage_path || `resources/${group.id}/${Date.now()}_${file_name.trim()}`,
      file_url: file_url || `/resources/mock/${encodeURIComponent(file_name.trim())}`,
    });

    // Broadcast realtime event for new group resource
    broadcast("group:resource", {
      groupId: group.id,
      resource,
    });

    // Broadcast a companion message into group chat
    const companionMsg = {
      id: `msg_res_${Date.now()}`,
      group_id: group.id,
      sender_id: studentRole.user_id,
      sender_name: studentRole.name || "Student",
      sender_role: "student",
      message: `📎 Shared educational resource: [${resource.file_name}] (${(resource.file_size / 1024 / 1024).toFixed(2)} MB)`,
      created_at: new Date().toISOString(),
      resource_id: resource.id,
      file_url: resource.file_url,
    };

    broadcast("group:message", {
      groupId: group.id,
      message: companionMsg,
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("[/api/student/group/resources POST] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to share group resource" },
      { status: error.statusCode || 500 }
    );
  }
}
