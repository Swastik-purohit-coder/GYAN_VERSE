"use client";

import OfflineSafeAuthGuard from "@/components/OfflineSafeAuthGuard";
import FooterNav from "@/components/FooterNav";

export default function AchievementsPage() {
  return (
    <OfflineSafeAuthGuard>
      <div className="p-4 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold mb-3">Achievements</h2>
        <p>Badges and milestones will appear here.</p>
      </div>
      <FooterNav />
      <div className="h-14" aria-hidden />
    </OfflineSafeAuthGuard>
  );
}
