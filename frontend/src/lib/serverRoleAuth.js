// Server-side role resolution directly from Supabase user_roles table
// This module runs in both Edge runtime (Next.js middleware) and Node.js runtime.
// It bypasses client state and reads user_roles as the single source of truth.

const roleCache = new Map();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Fetches the user's role record directly from the `user_roles` table in Supabase.
 * Returns { role: "student" | "teacher" | "admin" | "unassigned", school_id, class, ... } or null.
 *
 * @param {string} userId - Clerk user ID
 * @returns {Promise<{ role: string, user_id?: string, school_id?: string, class?: string } | null>}
 */
export async function getServerUserRole(userId) {
  if (!userId) return null;

  const now = Date.now();
  const cached = roleCache.get(userId);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[serverRoleAuth] Missing Supabase credentials in environment");
    return null;
  }

  try {
    const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(
      userId
    )}&select=user_id,role,school_id,class,name`;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[serverRoleAuth] Supabase returned status ${res.status}`);
      return null;
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      const missing = { role: "unassigned", provisional: true, user_id: userId };
      roleCache.set(userId, { data: missing, timestamp: now });
      return missing;
    }

    const roleDoc = rows[0];
    roleCache.set(userId, { data: roleDoc, timestamp: now });
    return roleDoc;
  } catch (err) {
    console.error("[serverRoleAuth] Error fetching user role from Supabase:", err?.message || err);
    return null;
  }
}

/**
 * Manually invalidate cached role (e.g. after role update in /api/users/role).
 */
export function invalidateServerUserRoleCache(userId) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}
