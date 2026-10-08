import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  runSingle,
  nowIso,
  requireUserRole,
  checkSupabaseConfigured,
} from "../../_utils/supabase";

export const runtime = "nodejs";

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    if (checkSupabaseConfigured()) {
      try {
        const group = await runSingle(
          supabase.from("student_groups").select("*").eq("id", id).maybeSingle()
        );
        if (group) {
          return NextResponse.json(group);
        }
      } catch (err) {
        console.warn("[/api/groups/[id] GET] Supabase fetch error:", err.message);
      }
    }

    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to fetch group" }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const { id } = await context.params;
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await requireUserRole(userId);
    const body = await request.json();

    const {
      name,
      description,
      category,
      target_class,
      mentor_name,
      members,
      add_member,
      remove_member_id,
    } = body;

    let existingGroup = null;
    if (checkSupabaseConfigured()) {
      try {
        existingGroup = await runSingle(
          supabase.from("student_groups").select("*").eq("id", id).maybeSingle()
        );
      } catch (err) {
        console.warn("[/api/groups/[id] PUT] Fetch warning:", err.message);
      }
    }

    let currentMembers = Array.isArray(existingGroup?.members) ? [...existingGroup.members] : [];

    if (add_member) {
      const exists = currentMembers.some(
        (m) => m.id === add_member.id || m.userId === add_member.id
      );
      if (!exists) {
        currentMembers.push({
          id: add_member.id || `m_${Date.now()}`,
          name: add_member.name || "New Member",
          role: "member",
          class: add_member.class || existingGroup?.target_class || "Class 8",
        });
      }
    }

    if (remove_member_id) {
      currentMembers = currentMembers.filter(
        (m) => m.id !== remove_member_id && m.userId !== remove_member_id
      );
    }

    if (Array.isArray(members)) {
      currentMembers = members;
    }

    const updates = {
      name: name !== undefined ? name.trim() : existingGroup?.name,
      description: description !== undefined ? description?.trim() : existingGroup?.description,
      category: category !== undefined ? category : existingGroup?.category,
      target_class: target_class !== undefined ? target_class : existingGroup?.target_class,
      mentor_name: mentor_name !== undefined ? mentor_name : existingGroup?.mentor_name,
      members: currentMembers,
      member_count: currentMembers.length,
      updated_at: nowIso(),
    };

    if (checkSupabaseConfigured()) {
      try {
        const updated = await run(
          supabase.from("student_groups").update(updates).eq("id", id).select().maybeSingle()
        );
        if (updated) {
          return NextResponse.json(updated);
        }
      } catch (err) {
        console.warn("[/api/groups/[id] PUT] Supabase update warning:", err.message);
      }
    }

    return NextResponse.json({ id, ...updates });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await requireUserRole(userId);
    const userRole = String(userDoc?.role || "student").toLowerCase().trim();
    const isFaculty = ["teacher", "admin", "principal", "higher_body"].includes(userRole);

    if (checkSupabaseConfigured()) {
      try {
        const group = await runSingle(
          supabase.from("student_groups").select("created_by, leader_id").eq("id", id).maybeSingle()
        );

        if (group && !isFaculty && group.created_by !== userId && group.leader_id !== userId) {
          return NextResponse.json({ error: "Forbidden: Only creator or faculty can delete this group" }, { status: 403 });
        }

        await run(supabase.from("student_groups").delete().eq("id", id));
        return NextResponse.json({ success: true, message: "Group deleted successfully" });
      } catch (err) {
        console.warn("[/api/groups/[id] DELETE] Supabase delete warning:", err.message);
      }
    }

    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete group" }, { status: 500 });
  }
}
