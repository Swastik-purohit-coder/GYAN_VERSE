"use client";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import DashboardV2 from "@/student/views/DashboardV2";

export default function StudentDashboardPage() {
  return (
    <>
      <SignedIn>
        <DashboardV2 />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
