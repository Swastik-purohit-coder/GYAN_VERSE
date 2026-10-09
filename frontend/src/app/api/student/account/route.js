import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  supabase,
  run,
  checkSupabaseConfigured,
} from "../../_utils/supabase";

export const runtime = "nodejs";

/**
 * Handles permanent account deletion for students:
 * 1. Validates authenticated user session
 * 2. Cascades and deletes all student records across all Supabase database tables:
 *    - lesson_progress & course_video_progress
 *    - quiz_responses, quiz_completions & streaks
 *    - achievements
 *    - skill_enrollments & competition_entries
 *    - doubt_sessions & doubt_messages
 *    - student_groups, group_members, group_messages & group_resources
 *    - teacher_student_assignments
 *    - user_roles & student profile
 * 3. Deletes user identity from Clerk authentication
 */
async function processAccountDeletion(request) {
  try {
    let userId = null;
    try {
      const authObj = await auth();
      userId = authObj?.userId || null;
    } catch (authErr) {
      console.warn("[/api/student/account] Clerk auth check warning:", authErr.message);
    }

    // Support fallback userId passed in JSON body or header
    if (!userId) {
      try {
        const body = await request.json().catch(() => ({}));
        if (body?.userId) {
          userId = body.userId;
        }
      } catch (_) {}
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to delete account." },
        { status: 401 }
      );
    }

    console.log(`[/api/student/account] Beginning permanent account deletion for user: ${userId}`);

    const summary = {
      userId,
      databaseTablesCleared: [],
      databaseWarnings: [],
      clerkDeleted: false,
    };

    // 1. Purge data across all Supabase database tables
    if (checkSupabaseConfigured()) {
      const tablesToPurge = [
        // Learning progress
        { table: "lesson_progress", column: "student_id" },
        { table: "course_video_progress", column: "student_id" },
        { table: "student_progress", column: "id" },

        // Quizzes, completions, and gamification
        { table: "quiz_responses", column: "student_id" },
        { table: "quiz_completions", column: "user_id" },
        { table: "streaks", column: "user_id" },
        { table: "achievements", column: "user_id" },

        // Skills & competitions
        { table: "skill_enrollments", column: "student_id" },
        { table: "competition_entries", column: "student_id" },

        // Doubts & messaging
        { table: "doubt_messages", column: "sender_id" },
        { table: "doubt_sessions", column: "student_id" },

        // Peer groups & discussions
        { table: "group_messages", column: "sender_id" },
        { table: "group_members", column: "user_id" },
        { table: "group_resources", column: "sender_id" },
        { table: "student_groups", column: "created_by" },

        // Teacher assignments
        { table: "teacher_student_assignments", column: "student_id" },

        // Students / activity tables if present
        { table: "daily_activity", column: "user_id" },
        { table: "tracked_exams", column: "user_id" },
        { table: "students", column: "user_id" },
        { table: "students", column: "id" },

        // User role record
        { table: "user_roles", column: "user_id" },
      ];

      for (const item of tablesToPurge) {
        try {
          await run(supabase.from(item.table).delete().eq(item.column, userId));
          summary.databaseTablesCleared.push(item.table);
        } catch (tableErr) {
          // PGRST205 or missing table is handled cleanly
          const msg = tableErr?.message || String(tableErr);
          if (!msg.includes("does not exist") && !msg.includes("schema cache")) {
            console.warn(`[/api/student/account] Warning purging ${item.table}:`, msg);
          }
          summary.databaseWarnings.push({ table: item.table, reason: msg });
        }
      }
    } else {
      console.warn("[/api/student/account] Supabase is not configured; skipped database tables purge.");
    }

    // 2. Delete user in Clerk authentication
    try {
      const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
      if (client?.users?.deleteUser) {
        await client.users.deleteUser(userId);
        summary.clerkDeleted = true;
      }
    } catch (clerkErr) {
      console.warn("[/api/student/account] Clerk delete user notice:", clerkErr?.message || clerkErr);
      summary.clerkError = clerkErr?.message || String(clerkErr);
    }

    return NextResponse.json({
      success: true,
      message: "Student account and all cloud data permanently deleted.",
      summary,
    });
  } catch (error) {
    console.error("[/api/student/account] Critical error during deletion:", error);
    return NextResponse.json(
      {
        error: "Failed to complete account deletion",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  return processAccountDeletion(request);
}

export async function POST(request) {
  return processAccountDeletion(request);
}
