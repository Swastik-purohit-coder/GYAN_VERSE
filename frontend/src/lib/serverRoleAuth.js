// Server-side role resolution directly from Supabase user_roles table with robust offline caching
// This module runs in both Edge runtime (Next.js middleware) and Node.js runtime.
// Once a user has logged in once, their role is permanently cached for offline compatibility.

if (!globalThis.__gyanRoleCache) {
  globalThis.__gyanRoleCache = new Map();
}
const roleCache = globalThis.__gyanRoleCache;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes normal online TTL
const OFFLINE_BACKOFF_MS = 60 * 1000; // Do not retry remote fetch for 60 seconds once offline
let lastOfflineErrorTimestamp = 0;

/**
 * Fetches the user's role record directly from the `user_roles` table in Supabase.
 * Returns { role: "student" | "teacher" | "principal" | "higher_body" | "admin" | "unassigned", school_id, class, ... } or null.
 * 
 * Offline compatible: Once resolved, will never fail when offline.
 *
 * @param {string} userId - Clerk user ID
 * @param {string|object} [hintRoleOrOptions] - Optional fallback role string, or options object { forceFresh }
 * @param {object} [options] - Optional options { forceFresh?: boolean }
 * @returns {Promise<{ role: string, user_id?: string, school_id?: string, class?: string, offline?: boolean } | null>}
 */
export async function getServerUserRole(userId, hintRoleOrOptions = null, options = {}) {
  if (!userId) return null;

  let hintRole = null;
  let forceFresh = false;

  if (typeof hintRoleOrOptions === "object" && hintRoleOrOptions !== null) {
    forceFresh = Boolean(hintRoleOrOptions.forceFresh);
  } else {
    hintRole = typeof hintRoleOrOptions === "string" ? hintRoleOrOptions : null;
    forceFresh = Boolean(options?.forceFresh);
  }

  const now = Date.now();
  const cached = roleCache.get(userId);

  // 1. Return fresh cached data if still within TTL
  if (!forceFresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. If recent network error occurred (offline mode), return cached data without attempting fetch
  if (!forceFresh && cached && now - lastOfflineErrorTimestamp < OFFLINE_BACKOFF_MS) {
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
    // Missing credentials - fallback to cached role or hint
    if (cached) return cached.data;
    if (hintRole) {
      const fallback = { role: hintRole, user_id: userId, offline: true };
      roleCache.set(userId, { data: fallback, timestamp: now });
      return fallback;
    }
    return null;
  }

  // 3. Attempt Supabase fetch
  try {
    const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/user_roles?user_id=eq.${encodeURIComponent(
      userId
    )}&select=user_id,role,school_id,class,name,email,phone,parent_email,parent_phone,metadata`;

    // Timeout signal so offline requests don't hang for 30s
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      signal: controller?.signal,
      cache: "no-store",
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      // Remote returned error status - reuse cached role if available
      if (cached) return cached.data;
      if (hintRole) return { role: hintRole, user_id: userId, offline: true };
      return null;
    }

    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      // NEVER cache unassigned or missing roles so freshly onboarding users are recognized immediately
      roleCache.delete(userId);
      return { role: hintRole || "unassigned", provisional: true, user_id: userId };
    }

    const roleDoc = rows[0];
    let resolvedRole = roleDoc.role;
    if (roleDoc.class?.startsWith("role:")) {
      resolvedRole = roleDoc.class.replace("role:", "").trim().toLowerCase();
    } else if (["principal", "higher_body", "admin"].includes(roleDoc.class)) {
      resolvedRole = roleDoc.class;
    }

    const metaObj = roleDoc.metadata && typeof roleDoc.metadata === "object" ? roleDoc.metadata : {};

    const finalDoc = {
      ...metaObj,
      ...roleDoc,
      role: resolvedRole,
      class: roleDoc.class?.startsWith("role:") ? null : roleDoc.class,
      email: roleDoc.email || metaObj.email || null,
      phone: roleDoc.phone || metaObj.studentPhone || null,
      parentEmail: roleDoc.parent_email || metaObj.parentEmail || null,
      parentPhone: roleDoc.parent_phone || metaObj.parentPhone || null,
      metadata: metaObj,
    };

    if (finalDoc.role === "unassigned") {
      roleCache.delete(userId);
    } else {
      roleCache.set(userId, { data: finalDoc, timestamp: now });
    }
    return finalDoc;
  } catch (err) {
    // Network failure / Offline detected
    lastOfflineErrorTimestamp = Date.now();

    // If we have ANY previous role for this user, reuse it indefinitely offline!
    if (cached && cached.data) {
      cached.timestamp = now; // renew timestamp so we don't attempt repeatedly
      return cached.data;
    }

    // If caller provided a hint role (e.g. from gyan_role cookie), use and cache it
    if (hintRole) {
      const fallback = { role: hintRole, user_id: userId, offline: true };
      roleCache.set(userId, { data: fallback, timestamp: now });
      return fallback;
    }

    // Default to student in offline mode rather than failing completely
    const offlineDefault = { role: "student", user_id: userId, offline: true };
    roleCache.set(userId, { data: offlineDefault, timestamp: now });
    return offlineDefault;
  }
}

/**
 * Manually update or pre-cache user role (used during login or client sync).
 */
export function setServerUserRoleCache(userId, roleDoc) {
  if (userId && roleDoc) {
    roleCache.set(userId, { data: roleDoc, timestamp: Date.now() });
  }
}

/**
 * Manually invalidate cached role.
 */
export function invalidateServerUserRoleCache(userId) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}
