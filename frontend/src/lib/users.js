import { saveLocalUserProfile, getLocalUserProfile } from "./offlineDb.js";

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = (RAW_API_BASE_URL && RAW_API_BASE_URL.length
  ? RAW_API_BASE_URL.replace(/\/$/, '')
  : '/api');

export async function fetchUserRole(userId) {
  // 1. Try server fetch if online
  if (typeof navigator === "undefined" || navigator.onLine) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/role`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.role) {
          // Persist in IndexedDB and localStorage for offline recovery
          await saveLocalUserProfile(data);
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem("userRole", data.role);
              localStorage.setItem("userName", data.name || "");
              if (data.class) localStorage.setItem("studentClass", data.class);
              if (typeof document !== "undefined") {
                document.cookie = `gyan_role=${encodeURIComponent(data.role)}; path=/; max-age=2592000; SameSite=Lax`;
              }
            }
          } catch {}
          return data;
        }
      } else if (res.status === 404) {
        // Fall through to offline check before returning unassigned
      }
    } catch (err) {
      console.warn("[users.js] Network fetch failed, checking IndexedDB userProfile:", err.message);
    }
  }

  // 2. Offline Fallback: Retrieve profile from local IndexedDB
  try {
    const cachedProfile = await getLocalUserProfile(userId);
    if (cachedProfile && cachedProfile.role) {
      if (typeof document !== "undefined") {
        document.cookie = `gyan_role=${encodeURIComponent(cachedProfile.role)}; path=/; max-age=2592000; SameSite=Lax`;
      }
      return {
        userId: cachedProfile.userId || userId,
        role: cachedProfile.role,
        name: cachedProfile.name || "Student",
        class: cachedProfile.class || "Class 8",
        schoolId: cachedProfile.schoolId || "Gyanaratna STEM Academy",
        offline: true,
      };
    }
  } catch (e) {
    console.warn("[users.js] IndexedDB profile lookup error:", e);
  }

  // 3. Secondary LocalStorage fallback
  try {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole) {
        return {
          userId,
          role: storedRole,
          name: localStorage.getItem("userName") || "Student",
          class: localStorage.getItem("studentClass") || "Class 8",
          offline: true,
        };
      }
    }
  } catch {}

  return { role: "unassigned", provisional: true };
}

export async function saveUserRole(payload) {
  // Always persist locally in IndexedDB first
  try {
    await saveLocalUserProfile(payload);
  } catch {}

  // Local storage fallback
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("userRole", payload.role || "student");
      localStorage.setItem("userName", payload.name || "");
      if (payload.class) localStorage.setItem("studentClass", payload.class);
      if (typeof document !== "undefined" && payload.role) {
        document.cookie = `gyan_role=${encodeURIComponent(payload.role)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }
  } catch {}

  try {
    const { userId, role, name, schoolId, class: klass, ...extraProfile } = payload;
    const res = await fetch(`${API_BASE_URL}/users/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        role,
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
    console.warn("[saveUserRole] Network exception, saved to local IndexedDB:", err.message);
  }

  return { success: true, user: payload, fallback: true };
}
