"use client";

import { usePathname } from "next/navigation";
import SyncStatusBadge from "./SyncStatusBadge";

/**
 * Replaces old intrusive blocking full-screen banner with non-intrusive offline & sync status badge.
 * On student routes, the sync status is cleanly embedded in the navbar header with an inline pill.
 */
export default function ConnectionStatus() {
  const pathname = usePathname();

  if (pathname?.startsWith("/student")) {
    return null;
  }

  return <SyncStatusBadge />;
}

