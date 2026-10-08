const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const API_BASE_URL = (RAW_API_BASE_URL && RAW_API_BASE_URL.length
  ? RAW_API_BASE_URL.replace(/\/$/, '')
  : '/api');

export async function fetchUserRole(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/role`, {
      cache: "no-store",
    });
    if (res.status === 404) {
      const json = await res.json().catch(() => null);
      return json || { role: "unassigned", provisional: true };
    }
    if (!res.ok) return { role: "unassigned", provisional: true };
    return await res.json();
  } catch (err) {
    return { role: "unassigned", provisional: true };
  }
}

export async function saveUserRole(payload) {
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
    if (typeof window !== "undefined") {
      document.cookie = `gyan_user_role=${payload.role || "student"}; path=/; max-age=604800; SameSite=Lax`;
      localStorage.setItem("userRole", payload.role || "student");
      localStorage.setItem("userName", payload.name || "");
      if (payload.class) localStorage.setItem("studentClass", payload.class);
      if (payload.schoolId) localStorage.setItem("schoolId", payload.schoolId);
    }

    if (res.ok) {
      return await res.json();
    }
    console.warn(`[saveUserRole] Server responded with status ${res.status}, continuing with local cache`);
  } catch (err) {
    console.warn("[saveUserRole] Network/API exception, continuing with local cache:", err.message);
  }

  return { success: true, user: payload, fallback: true };
}
