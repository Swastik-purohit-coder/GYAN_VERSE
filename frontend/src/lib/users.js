const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = (RAW_API_BASE_URL && RAW_API_BASE_URL.length
  ? RAW_API_BASE_URL.replace(/\/$/, '')
  : '/api');

export async function fetchUserRole(userId) {
  // 1. Check local cache first if offline
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const getLocalFallback = async () => {
    try {
      const localRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
      const localName = typeof window !== "undefined" ? localStorage.getItem("userName") : null;
      const localClass = typeof window !== "undefined" ? (localStorage.getItem("studentClass") || localStorage.getItem("student_class")) : null;
      const localSchoolId = typeof window !== "undefined" ? (localStorage.getItem("schoolId") || localStorage.getItem("school_id")) : null;

      // Also check IndexedDB Dexie db.userProfile
      let idbProfile = null;
      try {
        const { db } = await import("@/lib/offlineDb");
        idbProfile = await db.userProfile.get(userId);
      } catch {}

      // Also check cookie if available
      let cookieRole = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)gyan_user_role=([^;]+)/);
        if (match) cookieRole = decodeURIComponent(match[1]);
      }

      if (idbProfile && idbProfile.role && idbProfile.role !== "unassigned") {
        return {
          ...idbProfile,
          role: idbProfile.role,
          name: idbProfile.name || localName,
          class: idbProfile.class || localClass,
          schoolId: idbProfile.schoolId || localSchoolId,
          isOffline: true,
        };
      }

      const assignedFallbackRole =
        (localRole && localRole !== "unassigned" ? localRole : null) ||
        (cookieRole && cookieRole !== "unassigned" ? cookieRole : null);

      if (assignedFallbackRole) {
        return {
          userId,
          role: assignedFallbackRole,
          name: localName || "User",
          class: localClass,
          schoolId: localSchoolId,
          isOffline: true,
        };
      }
    } catch {}
    return null;
  };

  if (isOffline) {
    const cached = await getLocalFallback();
    if (cached) return cached;
  }

  // 2. Network fetch when online
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/role`, {
      cache: "no-store",
    });

    if (res.status === 404 || !res.ok) {
      const cached = await getLocalFallback();
      if (cached) return cached;
      const json = await res.json().catch(() => null);
      return json || { role: "unassigned", provisional: true };
    }

    const data = await res.json();

    // If server returned unassigned, check if client already has an assigned role
    if (!data?.role || data.role === "unassigned") {
      const cached = await getLocalFallback();
      if (cached && cached.role && cached.role !== "unassigned") {
        return cached;
      }
    }

    // Cache successful profile locally for offline use
    if (data && data.role && data.role !== "unassigned") {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", data.role);
          if (data.name) localStorage.setItem("userName", data.name);
          if (data.class) localStorage.setItem("studentClass", data.class);
          if (data.schoolId || data.school_id) {
            localStorage.setItem("schoolId", data.schoolId || data.school_id);
          }
          document.cookie = `gyan_user_role=${data.role}; path=/; max-age=604800; SameSite=Lax`;
        }
        const { db } = await import("@/lib/offlineDb");
        await db.userProfile.put({
          userId,
          role: data.role,
          name: data.name || null,
          class: data.class || null,
          schoolId: data.schoolId || data.school_id || null,
          updatedAt: new Date().toISOString(),
        });
      } catch (cacheErr) {
        console.warn("[fetchUserRole] Error saving profile to local cache:", cacheErr);
      }
    }

    return data;
  } catch (err) {
    console.warn("[fetchUserRole] Network fetch failed, checking offline fallback:", err.message);
    const cached = await getLocalFallback();
    if (cached) return cached;
    return { role: "unassigned", provisional: true };
  }
}

export async function saveUserRole(payload) {
  try {
    const { userId, role, name, schoolId, class: klass, ...extraProfile } = payload;
    const finalRole = role || "student";

    // Immediate synchronous local caching before network call
    if (typeof window !== "undefined") {
      document.cookie = `gyan_user_role=${finalRole}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem("userRole", finalRole);
      if (name) localStorage.setItem("userName", name);
      if (klass) localStorage.setItem("studentClass", klass);
      if (schoolId) localStorage.setItem("schoolId", schoolId);
    }

    try {
      const { db } = await import("@/lib/offlineDb");
      await db.userProfile.put({
        userId,
        role: finalRole,
        name: name || null,
        class: klass || null,
        schoolId: schoolId || null,
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    const res = await fetch(`${API_BASE_URL}/users/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role: finalRole,
        name,
        schoolId,
        class: klass,
        ...extraProfile,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
    console.warn(`[saveUserRole] Server responded with status ${res.status}, continuing with local cache`);
  } catch (err) {
    console.warn("[saveUserRole] Network/API exception, continuing with local cache:", err.message);
  }

  return { success: true, user: payload, fallback: true };
}
