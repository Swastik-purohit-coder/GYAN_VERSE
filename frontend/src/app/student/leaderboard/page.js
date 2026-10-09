"use client";
import dynamic from "next/dynamic";

const Leaderboard = dynamic(() => import("@/student/components/leaderboard"), { ssr: false });

export default function Page() {
  return <Leaderboard />;
}
