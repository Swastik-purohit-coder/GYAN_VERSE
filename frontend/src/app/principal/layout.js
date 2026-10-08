"use client";
import TeacherSidebar from "@/teacher/components/TeacherSidebar";

export default function PrincipalLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] bg-grid-cream text-stone-900 selection:bg-stone-200">
      <div className="flex">
        <TeacherSidebar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
