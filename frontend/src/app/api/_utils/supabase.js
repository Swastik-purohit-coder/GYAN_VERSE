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
  if (!checkSupabaseConfigured()) {
    return {
      user_id: userId,
      role: "student",
      name: "Guest User",
      school_id: "default",
      class: "10",
      provisional: true,
    };
  }
  try {
    const role = await runSingle(
      supabase
        .from("user_roles")
        .select("user_id, role, name, school_id, class, provisional, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle()
    );
    if (!role) {
      return {
        user_id: userId,
        role: "student",
        name: "Guest User",
        school_id: "default",
        class: "10",
        provisional: true,
      };
    }
    return role;
  } catch (err) {
    console.warn("user_roles table missing or query error, returning fallback role:", err.message);
    return {
      user_id: userId,
      role: "student",
      name: "Guest User",
      school_id: "default",
      class: "10",
      provisional: true,
    };
  }
}

export function ensureTeacher(roleDoc) {
  if (!roleDoc || !["teacher", "admin", "principal", "higher_body"].includes(roleDoc.role)) {
    const err = new Error("Only teachers or administrators can perform this action");
    err.statusCode = 403;
    throw err;
  }
}

export function ensureHigherBody(roleDoc) {
  if (!roleDoc || !["admin", "principal", "higher_body"].includes(roleDoc.role)) {
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
