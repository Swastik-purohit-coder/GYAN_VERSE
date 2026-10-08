import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabase, run, runSingle, nowIso, normalizeId } from "../_utils/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/sync
 * Multi-operation idempotent background synchronization handler for offline mutations.
 */
export async function POST(request) {
  try {
    const authObj = await auth();
    const userId = authObj?.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to sync offline changes" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const operations = Array.isArray(body?.operations) ? body.operations : [];

    if (operations.length === 0) {
      return NextResponse.json({
        success: true,
        processedIds: [],
        failedIds: [],
        message: "No operations to sync.",
      });
    }

    // Fetch Student Role Info once
    const roleDoc = await runSingle(
      supabase
        .from("user_roles")
        .select("class, school_id")
        .eq("user_id", userId)
        .maybeSingle()
    );

    const processedIds = [];
    const failedIds = [];
    const results = [];

    for (const op of operations) {
      const { id, action, entityId, payload, idempotentKey } = op;

      try {
        // =========================================================================
        // 1. UPDATE_LESSON_PROGRESS
        // =========================================================================
        if (action === "UPDATE_LESSON_PROGRESS") {
          const lessonId = entityId || payload?.lessonId;
          const isCompleted = typeof payload?.completed === "boolean" ? payload.completed : true;
          const position = typeof payload?.lastPosition === "number" ? Math.floor(payload.lastPosition) : 0;
          const clientTimestamp = payload?.updatedAt || nowIso();

          if (!lessonId) {
            processedIds.push(id);
            results.push({ id, status: "skipped_invalid_payload" });
            continue;
          }

          // Verify lesson exists & authorization
          const lesson = await runSingle(
            supabase.from("lessons").select("id, module_id, published").eq("id", lessonId).maybeSingle()
          );

          if (!lesson || !lesson.published) {
            processedIds.push(id);
            results.push({ id, lessonId, status: "skipped_not_found" });
            continue;
          }

          const existing = await runSingle(
            supabase
              .from("lesson_progress")
              .select("*")
              .eq("student_id", userId)
              .eq("lesson_id", lessonId)
              .maybeSingle()
          );

          // Conflict Resolution: Last-Write-Wins based on updatedAt
          if (existing && existing.updated_at && new Date(existing.updated_at) > new Date(clientTimestamp)) {
            // Server has newer record -> Keep server state as authoritative
            processedIds.push(id);
            results.push({ id, lessonId, status: "conflict_server_newer_preserved" });
            continue;
          }

          const now = nowIso();
          const upsertPayload = {
            id: existing?.id || normalizeId("prog", `${userId}-${lessonId}`),
            student_id: userId,
            lesson_id: lessonId,
            last_position: position || existing?.last_position || 0,
            completed: payload?.action === "start" ? (existing?.completed ?? false) : isCompleted,
            started_at: existing?.started_at || now,
            completed_at: payload?.action === "start"
              ? (existing?.completed_at || null)
              : isCompleted
              ? (existing?.completed_at || now)
              : null,
            updated_at: clientTimestamp || now,
          };

          await run(supabase.from("lesson_progress").upsert(upsertPayload));
          processedIds.push(id);
          results.push({ id, lessonId, status: "synced" });
        }

        // =========================================================================
        // 2. SUBMIT_QUIZ_RESPONSE
        // =========================================================================
        else if (action === "SUBMIT_QUIZ_RESPONSE") {
          const quizId = entityId || payload?.quizId;
          const { score, totalQuestions, correctAnswers, timeSpent, answers, subject } = payload || {};

          if (!quizId) {
            processedIds.push(id);
            results.push({ id, status: "skipped_invalid_quiz_payload" });
            continue;
          }

          const responseId = idempotentKey || normalizeId("resp", `${userId}-${quizId}-${Date.now()}`);

          // Idempotent insertion into quiz_responses
          const respDoc = {
            id: responseId,
            quiz_id: quizId,
            student_id: userId,
            answers: answers || {},
            score: typeof score === "number" ? score : 0,
            correct_answers: correctAnswers || 0,
            total_questions: totalQuestions || 0,
            time_spent: timeSpent || 0,
            submitted_at: payload?.completedAt || nowIso(),
          };

          await run(supabase.from("quiz_responses").upsert(respDoc));

          // Record in quiz_completions for streak & history
          const compDoc = {
            id: normalizeId("comp", `${userId}-${quizId}`),
            user_id: userId,
            quiz_id: quizId,
            score: respDoc.score,
            time_spent: respDoc.time_spent,
            subject: subject || "General",
            completed_at: respDoc.submitted_at,
          };

          await run(supabase.from("quiz_completions").upsert(compDoc));

          // Update Streak
          try {
            const today = new Date().toISOString().slice(0, 10);
            const currentStreakRow = await runSingle(
              supabase.from("streaks").select("*").eq("user_id", userId).maybeSingle()
            );

            if (!currentStreakRow) {
              await run(
                supabase.from("streaks").insert({
                  user_id: userId,
                  current_streak: 1,
                  last_completion_date: today,
                  updated_at: nowIso(),
                })
              );
            } else if (currentStreakRow.last_completion_date !== today) {
              const lastDate = new Date(currentStreakRow.last_completion_date);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const isConsecutive = lastDate.toISOString().slice(0, 10) === yesterday.toISOString().slice(0, 10);

              await run(
                supabase
                  .from("streaks")
                  .update({
                    current_streak: isConsecutive ? (currentStreakRow.current_streak || 0) + 1 : 1,
                    last_completion_date: today,
                    updated_at: nowIso(),
                  })
                  .eq("user_id", userId)
              );
            }
          } catch (stErr) {
            console.warn("[/api/sync] Streak update warning:", stErr.message);
          }

          processedIds.push(id);
          results.push({ id, quizId, status: "quiz_synced" });
        } else {
          // Unknown action -> mark processed so queue is not stuck
          processedIds.push(id);
          results.push({ id, status: "skipped_unrecognized_action" });
        }
      } catch (opErr) {
        console.error(`[/api/sync] Operation ${id} failed:`, opErr);
        failedIds.push({ id, error: opErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      processedIds,
      failedIds,
      results,
    });
  } catch (error) {
    console.error("[/api/sync] Sync engine fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process offline sync" },
      { status: error.statusCode || 500 }
    );
  }
}

