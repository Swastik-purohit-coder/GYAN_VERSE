import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  runSingle,
  nowIso,
  requireUserRole,
  ensureTeacher,
} from "../../../_utils/supabase";

export const runtime = "nodejs";

export async function PUT(request, context) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await requireUserRole(userId);
    ensureTeacher(teacher);

    const { lessonId } = await context.params;

    const existing = await runSingle(
      supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle()
    );

    if (!existing) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      videoPath,
      videoUrl,
      audioPath,
      audioUrl,
      duration,
      orderIndex,
      isRequired,
      published,
    } = body || {};

    const reqAudioPath = audioPath !== undefined ? audioPath : body?.audio_path;
    const reqAudioUrl = audioUrl !== undefined ? audioUrl : body?.audio_url;

    const updates = {
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? (description ? String(description).trim() : null) : existing.description,
      video_path: videoPath !== undefined ? (videoPath ? String(videoPath).trim() : null) : existing.video_path,
      video_url: videoUrl !== undefined ? (videoUrl ? String(videoUrl).trim() : null) : existing.video_url,
      audio_path: reqAudioPath !== undefined ? (reqAudioPath ? String(reqAudioPath).trim() : null) : (existing.audio_path || null),
      audio_url: reqAudioUrl !== undefined ? (reqAudioUrl ? String(reqAudioUrl).trim() : null) : (existing.audio_url || null),
      duration: duration !== undefined ? (Number(duration) || 0) : existing.duration,
      order_index: orderIndex !== undefined ? (Number(orderIndex) || 1) : existing.order_index,
      is_required: isRequired !== undefined ? Boolean(isRequired) : existing.is_required,
      published: published !== undefined ? Boolean(published) : existing.published,
      updated_at: nowIso(),
    };

    let updated = null;
    const { data: upData, error: upErr } = await supabase
      .from("lessons")
      .update(updates)
      .eq("id", lessonId)
      .select()
      .maybeSingle();

    if (upErr && (upErr.code === "42703" || upErr.message?.includes("audio"))) {
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.audio_path;
      delete fallbackUpdates.audio_url;
      const { data: fbData } = await supabase
        .from("lessons")
        .update(fallbackUpdates)
        .eq("id", lessonId)
        .select()
        .maybeSingle();
      updated = { ...(fbData || { id: lessonId, ...fallbackUpdates }), audio_path: updates.audio_path, audio_url: updates.audio_url };
    } else if (upErr) {
      throw new Error(upErr.message);
    } else {
      updated = upData;
    }

    return NextResponse.json({
      success: true,
      lesson: updated || { id: lessonId, ...updates },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update lesson" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await requireUserRole(userId);
    ensureTeacher(teacher);

    const { lessonId } = await context.params;

    await run(supabase.from("lessons").delete().eq("id", lessonId));

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete lesson" },
      { status: error.statusCode || 500 }
    );
  }
}
