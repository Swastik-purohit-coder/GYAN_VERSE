"use client";

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import DashboardV2 from "@/student/views/DashboardV2";

export default function Page() {
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
