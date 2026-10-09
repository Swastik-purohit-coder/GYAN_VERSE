/**
 * clearStudentClientData.js
 * 
 * Complete client-side data purger for GyanVerse student accounts.
 * Clears:
 * 1. LocalStorage (offline metadata, preferences, video timestamps, cached tokens)
 * 2. SessionStorage
 * 3. Browser Cache Storage (glp-videos-v1, offline audio/video files, API response caches, shell caches)
 * 4. IndexedDB (Dexie "GyanaratnaOfflineDB", offline sync queues, and any auxiliary databases)
 * 5. Service Worker Registrations (forces fresh state upon next sign-up/login)
 * 6. Browser Cookies accessible via JavaScript
 */

export async function clearAllStudentClientData() {
  const status = {
    localStorage: false,
    sessionStorage: false,
    caches: false,
    indexedDB: false,
    serviceWorkers: false,
  };

  if (typeof window === "undefined") {
    return status;
  }

  // 1. Clear LocalStorage
  try {
    window.localStorage.clear();
    status.localStorage = true;
  } catch (err) {
    console.warn("[clearStudentClientData] LocalStorage clear error:", err);
  }

  // 2. Clear SessionStorage
  try {
    window.sessionStorage.clear();
    status.sessionStorage = true;
  } catch (err) {
    console.warn("[clearStudentClientData] SessionStorage clear error:", err);
  }

  // 3. Clear Cache Storage
  try {
    if ("caches" in window) {
      const cacheKeys = await window.caches.keys();
      await Promise.all(
        cacheKeys.map(async (key) => {
          try {
            await window.caches.delete(key);
          } catch (e) {
            console.warn(`[clearStudentClientData] Failed to delete cache: ${key}`, e);
          }
        })
      );
      status.caches = true;
    }
  } catch (err) {
    console.warn("[clearStudentClientData] Cache storage purge error:", err);
  }

  // 4. Clear IndexedDB
  try {
    if ("indexedDB" in window) {
      const knownDatabases = [
        "GyanaratnaOfflineDB",
        "glp-offline",
        "gyanverse-offline",
        "next-pwa",
      ];

      for (const dbName of knownDatabases) {
        try {
          window.indexedDB.deleteDatabase(dbName);
        } catch (_) {}
      }

      if (typeof window.indexedDB.databases === "function") {
        try {
          const databases = await window.indexedDB.databases();
          for (const dbInfo of databases) {
            if (dbInfo && dbInfo.name) {
              try {
                window.indexedDB.deleteDatabase(dbInfo.name);
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
      status.indexedDB = true;
    }
  } catch (err) {
    console.warn("[clearStudentClientData] IndexedDB purge error:", err);
  }

  // 5. Unregister Service Workers
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        try {
          await registration.unregister();
        } catch (_) {}
      }
      status.serviceWorkers = true;
    }
  } catch (err) {
    console.warn("[clearStudentClientData] Service worker unregister error:", err);
  }

  // 6. Expire client-side cookies
  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }
  } catch (_) {}

  return status;
}
