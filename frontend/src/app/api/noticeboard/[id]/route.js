import { NextResponse } from "next/server";
import { supabase, run, checkSupabaseConfigured, nowIso } from "../../_utils/supabase";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Notice ID required" }, { status: 400 });
    }

    if (checkSupabaseConfigured()) {
      try {
        await run(supabase.from("noticeboard").delete().eq("id", id));
      } catch (err) {
        console.warn("Supabase notice delete error:", err);
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to delete notice" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Notice ID required" }, { status: 400 });
    }

    const updates = {
      ...body,
      updated_at: nowIso(),
    };

    if (checkSupabaseConfigured()) {
      try {
        const updated = await run(
          supabase.from("noticeboard").update(updates).eq("id", id).select().maybeSingle()
        );
        return NextResponse.json(updated || updates);
      } catch (err) {
        console.warn("Supabase notice patch error:", err);
      }
    }

    return NextResponse.json({ success: true, id, ...updates });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update notice" }, { status: 500 });
  }
}
