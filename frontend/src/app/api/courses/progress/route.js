import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase } from "../../_utils/supabase";

export const runtime = "nodejs";

/**
 * POST /api/courses/progress
 *
 * Saves student playback progress for a Course YouTube video.
 * System 2: Stored in course_video_progress (independent of teacher lesson_progress).
 */
export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in" }, { status: 401 });
    }

    const body = await request.json();
    const { videoId, lastPosition = 0, duration = 0, completed = false } = body;

    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const pos = Math.max(0, Math.round(Number(lastPosition) || 0));
    const dur = Math.max(0, Math.round(Number(duration) || 0));

    let calculatedPct = 0;
    if (dur > 0) {
      calculatedPct = Math.min(100, Math.round((pos / dur) * 100));
    }

    // Auto-complete if watched >= 90% or explicitly passed as completed
    const isCompleted = Boolean(completed || calculatedPct >= 90);
    const finalPct = isCompleted ? 100 : calculatedPct;

    const progressId = `cvp_${userId}_${videoId}`;
    const now = new Date().toISOString();

    const record = {
      id: progressId,
      student_id: userId,
      video_id: videoId,
      last_position: pos,
      duration: dur,
      completion_pct: finalPct,
      completed: isCompleted,
      completed_at: isCompleted ? now : null,
      updated_at: now,
    };

    let dbError = null;
    try {
      let { error } = await supabase
        .from("course_video_progress")
        .upsert(record, { onConflict: "student_id,video_id" });

      if (error) {
        const fallbackRes = await supabase
          .from("course_video_progress")
          .upsert(record, { onConflict: "id" });
        if (fallbackRes.error) {
          dbError = fallbackRes.error.message;
        }
      }
    } catch (e) {
      dbError = e.message;
    }

    if (dbError) {
      console.warn("[/api/courses/progress] DB upsert warning:", dbError);
    }

    return NextResponse.json({
      success: true,
      progress: {
        videoId,
        lastPosition: pos,
        duration: dur,
        completionPct: finalPct,
        completed: isCompleted,
      },
    });
  } catch (error) {
    console.error("[/api/courses/progress] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update course progress" },
      { status: 500 }
    );
  }
}
