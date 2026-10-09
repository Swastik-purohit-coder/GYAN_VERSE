"use client";
import dynamic from "next/dynamic";

const ChallengeArena = dynamic(() => import("@/student/components/challenge-arena"), { ssr: false });

export default function Page() {
  return <ChallengeArena />;
}
