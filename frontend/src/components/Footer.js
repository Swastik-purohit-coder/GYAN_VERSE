"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function Footer() {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Hide footer on dashboard portals and auth shells to maintain full-height sidebar and clean layout
  const isDashboardShell = [
    "/teacher",
    "/principal",
    "/student",
    "/role-select",
    "/settings",
    "/quiz",
    "/games",
  ].some((p) => pathname?.startsWith(p));

  if (isDashboardShell) {
    return null;
  }

  const isLight = theme === "light";
  const style = isLight
    ? { backgroundColor: "#ffffff", color: "#000000" }
    : { backgroundColor: "#000000", color: "#f8fafc" };

  return (
    <footer className="text-center p-4 mt-8 w-full" style={style}>
      © 2025 GYANARATNA. All rights reserved.
    </footer>
  );
}
