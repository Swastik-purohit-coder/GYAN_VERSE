"use client";

import React, { Suspense } from "react";
import StudentAuthGuard from "@/student/components/StudentAuthGuard";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const GlobalSearch = dynamic(() => import("@/student/components/search"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-[#635BFF]" />
      <p className="text-xs font-medium">Loading search experience...</p>
    </div>
  ),
});

export default function Page() {
  return (
    <StudentAuthGuard>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#635BFF]" />
            <p className="text-xs font-medium">Initializing search...</p>
          </div>
        }
      >
        <GlobalSearch />
      </Suspense>
    </StudentAuthGuard>
  );
}

