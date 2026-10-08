"use client";

import SyncStatusBadge from "./SyncStatusBadge";

/**
 * Replaces old intrusive blocking full-screen banner with non-intrusive offline & sync status badge.
 */
export default function ConnectionStatus() {
  return <SyncStatusBadge />;
}

