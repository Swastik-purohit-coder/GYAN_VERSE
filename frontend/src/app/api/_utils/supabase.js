import { createClient } from "@supabase/supabase-js";

/**
 * Validates and extracts Supabase credentials from environment variables.
 * Server-side routes prefer SUPABASE_SERVICE_ROLE_KEY to bypass RLS,
 * but will fall back to publishable/anon keys if service-role key is not configured.
 */
export function getSupabaseCredentials() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();

  // Server-side service role key (strictly server-side, never exposed to client)
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  // Public/anon key fallbacks
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();

  const key = serviceRoleKey || publishableKey;

  const isUrlValid =
    Boolean(url) &&
    !url.includes("your-project-id") &&
    !url.includes("example");

  const isKeyValid =
    Boolean(key) &&
    !key.includes("your_supabase") &&
    !key.includes("example");

  return {
    url,
    key,
    serviceRoleKey,
    publishableKey,
    isConfigured: Boolean(isUrlValid && isKeyValid),
    isUrlValid,
    isKeyValid,
  };
}

/**
 * Returns names of missing required Supabase environment variables without exposing values.
 */
export function getMissingSupabaseEnvVars() {
  const creds = getSupabaseCredentials();
  const missing = [];
  if (!creds.isUrlValid) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)");
  }
  if (!creds.isKeyValid) {
    missing.push(
      "SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  return missing;
}

export function checkSupabaseConfigured() {
  return getSupabaseCredentials().isConfigured;
}

export const isSupabaseConfigured = checkSupabaseConfigured();

let cachedClient = null;

/**
 * Returns an initialized Supabase client or throws a descriptive configuration error.
 */
export function getSupabaseClient() {
  const creds = getSupabaseCredentials();
  if (!creds.isConfigured) {
    const missing = getMissingSupabaseEnvVars();
    const err = new Error(
      `Supabase is not properly configured. Missing required environment variable(s): ${missing.join(
        ", "
      )}. Please verify your frontend/.env.local configuration and restart the Next.js server.`
    );
    err.statusCode = 503;
    throw err;
  }

  if (!cachedClient) {
    cachedClient = createClient(creds.url, creds.key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return cachedClient;
}

/**
 * Lazy proxy client that delegates to getSupabaseClient().
 * Calling methods such as supabase.from(...) will fail-fast with a clear server configuration error
 * if credentials are missing, preventing "TypeError: Cannot read properties of null (reading 'from')".
 */
export const supabase = new Proxy(
  {},
  {
    get(target, prop) {
      const client = getSupabaseClient();
      const value = Reflect.get(client, prop, client);
      if (typeof value === "function") {
        return value.bind(client);
      }
      return value;
    },
  }
);

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeId(prefix, slugSource) {
  const safe = String(slugSource || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}:${Date.now()}:${safe || "item"}`;
}

export async function run(query) {
  if (!checkSupabaseConfigured()) {
    return [];
  }
  try {
    const promise = typeof query === "function" ? query(getSupabaseClient()) : query;
    const { data, error } = await promise;
    if (error) {
      if (
        error.code === "PGRST205" ||
        error.message?.includes("schema cache") ||
        error.message?.includes("does not exist")
      ) {
        return [];
      }
      const err = new Error(error.message || "Supabase query failed");
      err.statusCode = error.status || 500;
      throw err;
    }
    return data ?? [];
  } catch (err) {
    if (
      err.message?.includes("schema cache") ||
      err.message?.includes("does not exist")
    ) {
      console.warn("[Supabase] Table missing in database schema:", err.message);
      return [];
    }
    throw err;
  }
}

export async function runSingle(query) {
  if (!checkSupabaseConfigured()) {
    return null;
  }
  try {
    const promise = typeof query === "function" ? query(getSupabaseClient()) : query;
    const { data, error } = await promise;
    if (error) {
      if (
        error.code === "PGRST116" ||
        error.code === "PGRST205" ||
        error.message?.includes("schema cache") ||
        error.message?.includes("does not exist")
      ) {
        return null;
      }
      const err = new Error(error.message || "Supabase query failed");
      err.statusCode = error.status || 500;
      throw err;
    }
    return data ?? null;
  } catch (err) {
    if (
      err.message?.includes("schema cache") ||
      err.message?.includes("does not exist")
    ) {
      console.warn("[Supabase] Table missing in database schema:", err.message);
      return null;
    }
    throw err;
  }
}

export async function requireUserRole(userId) {
  if (!userId) {
    const err = new Error("userId is required");
    err.statusCode = 400;
    throw err;
  }

  // 1. Query Supabase user_roles directly as primary source of truth
  let dbRole = null;
  if (checkSupabaseConfigured()) {
    try {
      dbRole = await runSingle(
        supabase
          .from("user_roles")
          .select("user_id, role, name, email, phone, parent_email, parent_phone, school_id, class, metadata, provisional, created_at, updated_at")
          .eq("user_id", userId)
          .maybeSingle()
      );
    } catch (err) {
      console.warn("[requireUserRole] user_roles query warning:", err.message);
    }
  }

  // 2. Extract database role if present (support role:principal/higher_body encoding in class column)
  let dbRoleValue = dbRole?.role ? String(dbRole.role).toLowerCase().trim() : null;
  if (dbRole?.class?.startsWith("role:")) {
    dbRoleValue = dbRole.class.replace("role:", "").trim().toLowerCase();
  } else if (["principal", "higher_body", "admin"].includes(dbRole?.class)) {
    dbRoleValue = dbRole.class;
  }

  // 3. Fallback to Clerk session user metadata if DB record is not yet present
  let clerkMeta = null;
  if (!dbRoleValue || dbRoleValue === "unassigned") {
    try {
      const { currentUser } = await import("@clerk/nextjs/server");
      const clerkUser = await currentUser();
      if (clerkUser) {
        const meta = clerkUser.unsafeMetadata || clerkUser.publicMetadata || {};
        const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || null;
        const phone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers?.[0]?.phoneNumber || null;
        clerkMeta = {
          role: meta.role || clerkUser.publicMetadata?.role || null,
          email,
          phone,
          parent_email: meta.parentEmail || meta.parent_email || null,
          parent_phone: meta.parentPhone || meta.parent_phone || null,
          school_id: meta.schoolId || meta.school_id || clerkUser.publicMetadata?.schoolId || "default_school",
          class: meta.class || clerkUser.publicMetadata?.class || "10",
          name: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "User",
          metadata: meta,
        };
      }
    } catch (err) {
      // ignore
    }
  }

  const clerkRole = clerkMeta?.role ? String(clerkMeta.role).toLowerCase().trim() : null;

  // Prioritize DB role value first, then Clerk role, then unassigned/fallback
  let effectiveRole = (dbRoleValue && dbRoleValue !== "unassigned") ? dbRoleValue : (clerkRole || "unassigned");
  if (clerkRole && ["principal", "higher_body", "admin"].includes(clerkRole)) {
    effectiveRole = clerkRole;
  }

  const effectiveSchoolId = dbRole?.school_id || clerkMeta?.school_id || "default_school";
  const effectiveName = dbRole?.name || clerkMeta?.name || "User";
  const rawClass = dbRole?.class || clerkMeta?.class || null;
  const effectiveClass = rawClass?.startsWith("role:") ? null : rawClass;
  const effectiveEmail = dbRole?.email || clerkMeta?.email || null;
  const effectivePhone = dbRole?.phone || clerkMeta?.phone || null;
  const effectiveParentEmail = dbRole?.parent_email || clerkMeta?.parent_email || null;
  const effectiveParentPhone = dbRole?.parent_phone || clerkMeta?.parent_phone || null;
  const effectiveMetadata =
    dbRole?.metadata && typeof dbRole.metadata === "object"
      ? dbRole.metadata
      : (clerkMeta?.metadata && typeof clerkMeta.metadata === "object" ? clerkMeta.metadata : {});

  // Auto-sync into Supabase user_roles if user has clerk metadata role but no DB row yet
  if ((!dbRole || dbRole.role === "unassigned") && effectiveRole !== "unassigned" && checkSupabaseConfigured()) {
    try {
      let syncRole = effectiveRole;
      let syncClass = effectiveClass;
      if (["principal", "higher_body", "admin"].includes(effectiveRole)) {
        syncRole = "teacher";
        syncClass = `role:${effectiveRole}`;
      }
      const syncPayload = {
        user_id: userId,
        role: syncRole,
        name: effectiveName,
        email: effectiveEmail,
        phone: effectivePhone,
        parent_email: effectiveParentEmail,
        parent_phone: effectiveParentPhone,
        school_id: effectiveSchoolId,
        class: syncClass,
        metadata: effectiveMetadata,
        provisional: false,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      runSingle(
        supabase.from("user_roles").upsert(syncPayload, { onConflict: "user_id" })
      ).catch(() => {});
    } catch {}
  }

  return {
    user_id: userId,
    userId: userId,
    role: effectiveRole,
    name: effectiveName,
    email: effectiveEmail,
    phone: effectivePhone,
    studentPhone: effectivePhone,
    parent_email: effectiveParentEmail,
    parentEmail: effectiveParentEmail,
    parent_phone: effectiveParentPhone,
    parentPhone: effectiveParentPhone,
    school_id: effectiveSchoolId,
    schoolId: effectiveSchoolId,
    class: effectiveClass,
    metadata: effectiveMetadata,
    ...effectiveMetadata,
    provisional: !dbRole,
    created_at: dbRole?.created_at || nowIso(),
    updated_at: dbRole?.updated_at || nowIso(),
  };
}

export function ensureTeacher(roleDoc) {
  const allowed = ["teacher", "admin", "principal", "higher_body"];
  const role = String(roleDoc?.role || "").toLowerCase().trim();
  if (!roleDoc || !allowed.includes(role)) {
    const err = new Error("Only teachers or administrators can perform this action");
    err.statusCode = 403;
    throw err;
  }
}

export function ensureHigherBody(roleDoc) {
  const allowed = ["admin", "principal", "higher_body"];
  const role = String(roleDoc?.role || "").toLowerCase().trim();
  if (!roleDoc || !allowed.includes(role)) {
    const err = new Error("Only principal or higher administrative body can perform this action");
    err.statusCode = 403;
    throw err;
  }
}

export function errorResponse(error) {
  const status = error?.statusCode || 500;
  return new Response(JSON.stringify({ error: error.message || "Unexpected error" }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

