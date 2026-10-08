"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import {
  LayoutDashboard,
  Bell,
  Users,
  UserCheck,
  BookOpen,
  Layers,
  ClipboardList,
  Sparkles,
  Trophy,
  MessageSquare,
  BarChart3,
  UploadCloud,
  ShieldCheck,
  LogOut,
  GraduationCap,
  Settings,
} from "lucide-react";

// All Navigation items with granular role access definitions
const rawNavSections = [
  {
    title: "Executive Leadership",
    higherBodyOnly: true,
    items: [
      { href: "/principal", label: "Executive Analytics", icon: LayoutDashboard },
      { href: "/teacher/noticeboard", label: "Noticeboard & Circulars", icon: Bell, badge: "Live" },
      { href: "/teacher/faculty", label: "Faculty Management", icon: UserCheck, higherBodyOnly: true },
      { href: "/teacher/reports", label: "Institutional Reports", icon: BarChart3, higherBodyOnly: true },
    ],
  },
  {
    title: "Teacher Workspace",
    facultyOnly: true,
    items: [
      { href: "/teacher", label: "My Teaching Overview", icon: LayoutDashboard },
      { href: "/teacher/noticeboard", label: "Noticeboard & Circulars", icon: Bell, badge: "Live" },
    ],
  },
  {
    title: "Academics & Classroom",
    items: [
      { href: "/teacher/classes", label: "Classes & Curriculum", icon: BookOpen },
      { href: "/teacher/students", label: "Student Progress", icon: Users },
      { href: "/teacher/modules", label: "Modules & Lessons", icon: Layers },
      { href: "/teacher/quizzes", label: "Quizzes & Tests", icon: ClipboardList },
      { href: "/teacher/content", label: "Resource Library", icon: UploadCloud },
    ],
  },
  {
    title: "Collaboration & Skills",
    items: [
      { href: "/teacher/groups", label: "Peer Sub-Groups", icon: MessageSquare, badge: "New" },
      { href: "/teacher/skills", label: "Skill Micro-Courses", icon: Sparkles },
      { href: "/teacher/competitions", label: "Monthly Competitions", icon: Trophy, badge: "Active" },
    ],
  },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();

  // Role resolution with fallback hierarchy
  const initialRole =
    user?.unsafeMetadata?.role ||
    (typeof window !== "undefined" ? localStorage.getItem("userRole") : null) ||
    "principal";

  const [resolvedRole, setResolvedRole] = useState(initialRole);

  useEffect(() => {
    if (user?.unsafeMetadata?.role) {
      setResolvedRole(user.unsafeMetadata.role);
    } else if (user?.id) {
      fetchUserRole(user.id).then((doc) => {
        const r = typeof doc === "string" ? doc : doc?.role;
        if (r && r !== "unassigned") {
          setResolvedRole(r);
        }
      });
    }
  }, [user]);

  const isHigherBody = ["principal", "admin", "higher_body"].includes(resolvedRole);

  // Filter sections and items: HIDE ANY ITEM WHERE ACCESS IS DENIED FOR CURRENT ROLE
  const filteredNavSections = rawNavSections
    .filter((section) => {
      if (section.higherBodyOnly && !isHigherBody) return false;
      if (section.facultyOnly && isHigherBody) return false;
      return true;
    })
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.higherBodyOnly && !isHigherBody) return false;
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="h-screen w-72 bg-[#0e1626] border-r border-slate-800 text-white flex flex-col px-4 py-5 sticky top-0 overflow-y-auto shrink-0 z-30 shadow-2xl">
      {/* Platform Branding & Institution */}
      <div className="flex items-center gap-3 px-2 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/30">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
            GYANARATNA
          </div>
          <div className="text-[11px] text-violet-300 font-medium truncate">
            {isHigherBody ? "Principal & Higher Body Portal" : "Faculty & Teacher Portal"}
          </div>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-2 mb-4">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-800/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">
              {isHigherBody ? "Principal / Higher Body" : "Faculty Lead"}
            </span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Role-Filtered Navigation Links */}
      <nav className="space-y-5 flex-1 pr-1">
        {filteredNavSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </div>
            {section.items.map(({ href, label, icon: Icon, badge }) => {
              const active =
                pathname === href ||
                (href === "/principal" && pathname === "/principal") ||
                (href === "/teacher" && pathname === "/teacher");

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all group ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400 group-hover:text-violet-400"}`} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        badge === "Live" || badge === "Active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer User Info & Sign Out */}
      <div className="pt-4 mt-auto border-t border-slate-800/80 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-violet-700/80 border border-violet-500/50 flex items-center justify-center text-xs font-bold text-white">
              {(user?.firstName?.[0] || user?.fullName?.[0] || (isHigherBody ? "P" : "T")).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.fullName || user?.firstName || (isHigherBody ? "Principal Dr. Reed" : "Faculty Lead")}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress || (isHigherBody ? "principal@gyanaratan.edu" : "teacher@gyanaratan.edu")}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
