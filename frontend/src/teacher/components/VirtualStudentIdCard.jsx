"use client";

import React, { useState, useRef } from "react";
import {
  RotateCcw,
  Download,
  Printer,
  Copy,
  Check,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  Heart,
  MapPin,
  ExternalLink,
  GraduationCap,
  Award,
  Share2,
  Columns,
  Eye,
} from "lucide-react";
import { jsPDF } from "jspdf";
import {
  QrCodeSvg,
  BarcodeSvg,
  HologramBadge,
  OfficialStamp,
  SignatureGraphic,
} from "./IdCardGraphics";

// Color palettes for ID Card themes
const THEMES = {
  indigo: {
    name: "Royal Indigo",
    primary: "from-[#0e1626] via-[#1a2b4c] to-[#0e1626]",
    accent: "bg-indigo-600 text-white",
    border: "border-indigo-400/40",
    badgeBg: "bg-indigo-900/70 text-indigo-200 border-indigo-700/60",
    gold: "text-amber-300",
    ribbon: "bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 text-slate-950",
    glow: "shadow-[0_12px_36px_rgba(26,43,76,0.45)]",
    cardBg: "bg-[#0b1320]",
    frontHeader: "bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950",
  },
  emerald: {
    name: "STEM Emerald",
    primary: "from-[#06241a] via-[#0d3d2c] to-[#06241a]",
    accent: "bg-emerald-600 text-white",
    border: "border-emerald-400/40",
    badgeBg: "bg-emerald-900/70 text-emerald-200 border-emerald-700/60",
    gold: "text-emerald-300",
    ribbon: "bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-500 text-slate-950",
    glow: "shadow-[0_12px_36px_rgba(13,61,44,0.45)]",
    cardBg: "bg-[#051c14]",
    frontHeader: "bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950",
  },
  crimson: {
    name: "Prestige Crimson",
    primary: "from-[#2b080f] via-[#4d0f1b] to-[#2b080f]",
    accent: "bg-rose-700 text-white",
    border: "border-rose-400/40",
    badgeBg: "bg-rose-900/70 text-rose-200 border-rose-700/60",
    gold: "text-amber-300",
    ribbon: "bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 text-slate-950",
    glow: "shadow-[0_12px_36px_rgba(77,15,27,0.45)]",
    cardBg: "bg-[#1f060b]",
    frontHeader: "bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950",
  },
  dark: {
    name: "Obsidian Titanium",
    primary: "from-[#090a0f] via-[#141724] to-[#090a0f]",
    accent: "bg-cyan-600 text-white",
    border: "border-cyan-400/40",
    badgeBg: "bg-slate-900/90 text-cyan-200 border-cyan-800/60",
    gold: "text-cyan-300",
    ribbon: "bg-gradient-to-r from-cyan-400 via-sky-200 to-blue-500 text-slate-950",
    glow: "shadow-[0_12px_36px_rgba(20,23,36,0.55)]",
    cardBg: "bg-[#08090d]",
    frontHeader: "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950",
  },
};

export default function VirtualStudentIdCard({
  student = {},
  theme = "indigo",
  format = "horizontal", // "horizontal" | "vertical"
  initialFlipped = false,
  showControls = true,
  onThemeChange = null,
  onFormatChange = null,
  className = "",
}) {
  const [isFlipped, setIsFlipped] = useState(initialFlipped);
  const [viewMode, setViewMode] = useState("flip"); // "flip" | "both"
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardContainerRef = useRef(null);

  const selectedTheme = THEMES[theme] || THEMES.indigo;

  // Resolved student attributes with clean defaults
  const uniqueId =
    student.uniqueId ||
    student.id ||
    student.studentId ||
    student.rollNumber ||
    "GYAN-2026-STD-001";

  const studentName = student.name || "Student Name";
  const studentClass = student.class || student.className || "Class 8";
  const section = student.section || "A";
  const rollNumber = student.rollNumber || student.studentId || uniqueId;
  const dob = student.dob || "2012-05-14";
  const fatherName = student.fatherName || "Guardian";
  const parentPhone = student.parentPhone || student.phone || "+91 98765 43210";
  const studentPhone = student.studentPhone || "";
  const bloodGroup = student.bloodGroup || "O+";
  const address = student.address || "Vidyapeeth Campus Residential Sector, Jaipur";
  const mediumLanguage = student.mediumLanguage || "English";
  const schoolName = student.schoolName || "GYANARATNA STEM VIDYAPEETH";
  const photoUrl = student.photoUrl || null;
  const academicYear = "2026 - 2027";
  const verificationUrl = `https://gyanaratna.org/verify/id?id=${encodeURIComponent(uniqueId)}&school=default_school`;

  // Initials for avatar fallback
  const initials =
    studentName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  const handleCopyId = (e) => {
    e?.stopPropagation?.();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = (e) => {
    e?.stopPropagation?.();
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Export as high-resolution printable PDF
  const handleDownloadPdf = async (e) => {
    e?.stopPropagation?.();
    try {
      setDownloading(true);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const cardW = 85.6; // Standard CR-80 width
      const cardH = 53.98; // Standard CR-80 height
      const leftFront = 25;
      const leftBack = 135;
      const cardY = 45;

      // Header Banner on sheet
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("GYANARATNA STEM VIDYAPEETH", 148.5, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text("Official Virtual Student Identity Document • Standard CR-80 Print Layout", 148.5, 26, { align: "center" });

      // ================= FRONT CARD =================
      doc.setFillColor(11, 19, 32);
      doc.roundedRect(leftFront, cardY, cardW, cardH, 3.5, 3.5, "F");
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.roundedRect(leftFront, cardY, cardW, cardH, 3.5, 3.5, "S");

      // Front Header Bar
      doc.setFillColor(15, 23, 42);
      doc.rect(leftFront, cardY, cardW, 11, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("GYANARATNA STEM VIDYAPEETH", leftFront + 6, cardY + 6);
      doc.setFontSize(6);
      doc.setTextColor(251, 191, 36);
      doc.text("CBSE Affiliated STEM Institute • 2026/GYAN", leftFront + 6, cardY + 9.5);

      // Student Details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(studentName, leftFront + 10, cardY + 20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(251, 191, 36);
      doc.text(`UNIQUE ID: ${uniqueId.slice(0, 20)}`, leftFront + 10, cardY + 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text(`Class & Section: ${studentClass} (${section})`, leftFront + 10, cardY + 30);
      doc.text(`Roll Number: ${rollNumber.slice(0, 20)}`, leftFront + 10, cardY + 34.5);
      doc.text(`Date of Birth: ${dob}`, leftFront + 10, cardY + 39);
      doc.text(`Blood Group: ${bloodGroup}`, leftFront + 10, cardY + 43.5);
      doc.text(`Parent Mobile: ${parentPhone}`, leftFront + 10, cardY + 48);

      // Front Footer
      doc.setFillColor(8, 12, 22);
      doc.rect(leftFront, cardY + cardH - 5, cardW, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text(`VALID: ${academicYear} • SECURE CHIP ID`, leftFront + 6, cardY + cardH - 1.5);
      doc.text("S. Purohit (Dean)", leftFront + cardW - 6, cardY + cardH - 1.5, { align: "right" });

      // ================= BACK CARD =================
      doc.setFillColor(11, 19, 32);
      doc.roundedRect(leftBack, cardY, cardW, cardH, 3.5, 3.5, "F");
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.roundedRect(leftBack, cardY, cardW, cardH, 3.5, 3.5, "S");

      // Back Top Header
      doc.setFillColor(15, 23, 42);
      doc.rect(leftBack, cardY, cardW, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(251, 191, 36);
      doc.text("GUARDIAN & EMERGENCY RECORD", leftBack + cardW / 2, cardY + 6, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240);
      doc.text(`Guardian / Father: ${fatherName}`, leftBack + 8, cardY + 16);
      doc.text(`Parent Mobile: ${parentPhone}`, leftBack + 8, cardY + 21);
      if (studentPhone) {
        doc.text(`Student Mobile: ${studentPhone}`, leftBack + 8, cardY + 26);
      }
      doc.text(`Residential Address: ${address.slice(0, 45)}`, leftBack + 8, cardY + 31);
      doc.text("Emergency Helpline: +91 1800-GYAN-999", leftBack + 8, cardY + 36);

      // Back Barcode Simulation
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(leftBack + 8, cardY + cardH - 14, cardW - 16, 10, 1.5, 1.5, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text(`||||| ||||||| ${uniqueId.slice(0, 18)} |||||| ||||`, leftBack + cardW / 2, cardY + cardH - 8, { align: "center" });

      // Guidelines notes
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(15, 120, 282, 120);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("[ ✂ Cut along guidelines for standard CR-80 double-sided wallet lamination ]", 148.5, 128, { align: "center" });
      doc.text(`Official Verification URL: ${verificationUrl}`, 148.5, 134, { align: "center" });

      doc.save(`Student_ID_Card_${uniqueId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isVertical = format === "vertical";

  // ==========================================
  // CARD RENDERERS (FRONT & BACK)
  // ==========================================
  const renderFrontCard = (isSingleFlip = true) => (
    <div
      style={isSingleFlip ? {
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      } : {}}
      className={`${
        isSingleFlip ? "absolute inset-0" : "w-full h-full relative"
      } rounded-2xl overflow-hidden border-2 ${selectedTheme.border} ${selectedTheme.glow} ${
        selectedTheme.cardBg
      } text-white flex flex-col justify-between`}
    >
      {/* Lanyard Hole Cutout (for Vertical Badge format) */}
      {isVertical && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="w-10 h-2 rounded-full bg-slate-950/90 border border-slate-700/80 shadow-inner" />
        </div>
      )}

      {/* Front Header Bar */}
      <div
        className={`px-3.5 py-2.5 relative z-10 ${selectedTheme.frontHeader} border-b border-white/10 ${
          isVertical ? "pt-4" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-bold text-slate-950 shadow-md shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] sm:text-[13px] font-black tracking-wider uppercase text-white truncate leading-tight">
                {schoolName}
              </div>
              <div className="text-[8.5px] sm:text-[9px] text-amber-300 font-semibold truncate flex items-center gap-1">
                <span>CBSE Affiliated STEM Institute</span>
                <span>•</span>
                <span className="font-mono">Reg. 2026/GYAN</span>
              </div>
            </div>
          </div>

          {/* Hologram Badge */}
          <HologramBadge size={isVertical ? 34 : 38} className="shrink-0" />
        </div>

        {/* Sub-strip header */}
        <div className="mt-1.5 pt-1 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[9.5px]">
          <span className="font-bold tracking-widest text-slate-200 uppercase">
            STUDENT IDENTITY CARD
          </span>
          <span className="font-bold text-amber-300 bg-amber-400/15 border border-amber-300/30 px-2 py-0.5 rounded-md text-[8.5px] sm:text-[9px]">
            {academicYear}
          </span>
        </div>
      </div>

      {/* Front Body */}
      {isVertical ? (
        // VERTICAL BODY
        <div className="flex-1 px-3.5 py-2 flex flex-col items-center justify-between relative z-10 bg-gradient-to-b from-transparent via-slate-900/30 to-black/40 min-h-0">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-amber-300/90 shadow-md flex items-center justify-center text-xl font-black text-amber-200 overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-slate-900 shadow-xs"
                title="Verified Active Student"
              >
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>

            <h3 className="text-sm font-black text-white tracking-tight leading-snug truncate max-w-[280px]">
              {studentName}
            </h3>
            <div className="text-[11px] font-bold text-amber-300">
              {studentClass} • Section {section}
            </div>

            {/* Unique ID with copy button */}
            <div
              onClick={handleCopyId}
              className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/50 text-amber-200 font-mono text-[10px] font-bold shadow-xs hover:bg-amber-400/25 transition-colors cursor-pointer max-w-[280px]"
              title="Click to copy unique ID"
            >
              <span className="truncate max-w-[220px]">ID: {uniqueId}</span>
              <Copy className="w-3 h-3 text-amber-300/80 shrink-0" />
            </div>
          </div>

          {/* 4-Item Metadata Grid */}
          <div className="w-full grid grid-cols-2 gap-2 text-[10px] bg-slate-950/70 p-2 rounded-xl border border-white/10 my-1">
            <div className="min-w-0">
              <span className="text-slate-300 block text-[8.5px] font-semibold">Roll Number</span>
              <span className="font-bold text-white text-[10.5px] truncate block" title={rollNumber}>
                {rollNumber}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-300 block text-[8.5px] font-semibold">Date of Birth</span>
              <span className="font-bold text-white text-[10.5px] block">{dob}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-300 block text-[8.5px] font-semibold">Blood Group</span>
              <span className="font-black text-rose-300 text-[10.5px] block">{bloodGroup}</span>
            </div>
            <div className="min-w-0">
              <span className="text-slate-300 block text-[8.5px] font-semibold">Parent Mobile</span>
              <span className="font-mono font-bold text-amber-300 text-[10.5px] truncate block">
                {parentPhone}
              </span>
            </div>
          </div>

          {/* QR Code and Signature */}
          <div className="w-full flex items-center justify-between pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              <QrCodeSvg value={verificationUrl} size={46} fgColor="#0e1626" />
              <div className="text-[8px] text-slate-300 leading-tight">
                <span className="font-bold text-amber-300 block">SCAN TO VERIFY</span>
                <span>Digital Record</span>
              </div>
            </div>
            <SignatureGraphic name="Prof. S. Purohit" title="Academic Dean" />
          </div>
        </div>
      ) : (
        // HORIZONTAL BODY (CR-80 WALLET)
        <div className="flex-1 px-3 py-2 flex items-center justify-between gap-2.5 relative z-10 bg-gradient-to-b from-transparent via-slate-900/20 to-black/30 min-h-0">
          {/* Left: Student Photo */}
          <div className="w-18 shrink-0 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-amber-300/90 shadow-md flex items-center justify-center text-xl font-black text-amber-200 overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={studentName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-slate-900 shadow-xs">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
              Active Student
            </span>
          </div>

          {/* Middle: Details & Unique ID */}
          <div className="flex-1 min-w-0 pr-1 space-y-1">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight truncate">
                {studentName}
              </h3>
              <div className="text-[11px] font-bold text-amber-300 truncate">
                {studentClass} • Section {section}
              </div>
            </div>

            {/* Prominent Unique ID with truncation guard */}
            <div
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/50 text-amber-200 font-mono text-[10px] font-bold shadow-xs hover:bg-amber-400/25 transition-colors cursor-pointer max-w-full"
              title={`Unique ID: ${uniqueId}`}
            >
              <span className="truncate max-w-[150px] sm:max-w-[190px]">ID: {uniqueId}</span>
              <Copy className="w-3 h-3 text-amber-300/80 shrink-0" />
            </div>

            {/* 4-Item Metadata Grid with truncation guard */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] pt-0.5">
              <div className="min-w-0">
                <span className="text-slate-300 text-[8px] font-semibold block">Roll Number:</span>
                <span className="font-bold text-white truncate block max-w-[95px] text-[10px]" title={rollNumber}>
                  {rollNumber}
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-300 text-[8px] font-semibold block">Date of Birth:</span>
                <span className="font-bold text-white block text-[10px]">{dob}</span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-300 text-[8px] font-semibold block">Blood Group:</span>
                <span className="font-black text-rose-300 block text-[10px]">{bloodGroup}</span>
              </div>
              <div className="min-w-0">
                <span className="text-slate-300 text-[8px] font-semibold block">Parent Mobile:</span>
                <span className="font-mono font-bold text-amber-300 truncate block max-w-[100px] text-[10px]">
                  {parentPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Right: QR Code & Signature (fixed width so it NEVER gets pushed out) */}
          <div className="w-22 shrink-0 flex flex-col items-center justify-between h-full border-l border-white/10 pl-2">
            <div className="flex flex-col items-center">
              <QrCodeSvg value={verificationUrl} size={54} fgColor="#0e1626" />
              <span className="text-[7.5px] font-bold text-amber-300 mt-0.5 uppercase tracking-wider">
                Scan to Verify
              </span>
            </div>
            <SignatureGraphic name="Prof. S. Purohit" title="Authorized Dean" />
          </div>
        </div>
      )}

      {/* Front Footer Band */}
      <div className="px-3 py-1 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-300">
        <span className="tracking-widest font-mono text-[7.5px] sm:text-[8px] truncate">
          SECURE DIGITAL ID • AES-256 VERIFIED
        </span>
        {isSingleFlip && (
          <span className="font-bold text-amber-400 flex items-center gap-1 shrink-0 ml-1">
            <span>FLIP ↻</span>
          </span>
        )}
      </div>
    </div>
  );

  const renderBackCard = (isSingleFlip = true) => (
    <div
      style={isSingleFlip ? {
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
      } : {}}
      className={`${
        isSingleFlip ? "absolute inset-0" : "w-full h-full relative"
      } rounded-2xl overflow-hidden border-2 ${selectedTheme.border} ${selectedTheme.glow} ${
        selectedTheme.cardBg
      } text-white flex flex-col justify-between`}
    >
      {/* Back Header */}
      <div className="px-3.5 py-2 bg-slate-950 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] sm:text-[10.5px] font-black tracking-wider uppercase text-amber-300 truncate">
            GUARDIAN &amp; VERIFICATION RECORD
          </span>
        </div>
        <span className="text-[8.5px] font-mono text-slate-300 font-semibold truncate max-w-[140px] ml-1">
          ID: {uniqueId}
        </span>
      </div>

      {/* Back Body */}
      {isVertical ? (
        // VERTICAL BACK
        <div className="flex-1 px-3.5 py-2 flex flex-col justify-between text-slate-200 text-[10px] min-h-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">
                Father / Guardian
              </span>
              <span className="font-bold text-white text-[10.5px] truncate block">{fatherName}</span>
            </div>

            <div className="min-w-0">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                <Phone className="w-2.5 h-2.5 text-amber-400" /> Parent Mobile
              </span>
              <span className="font-mono font-bold text-amber-300 text-[10.5px] truncate block">
                {parentPhone}
              </span>
            </div>

            {studentPhone && (
              <div className="min-w-0">
                <span className="text-[8.5px] uppercase font-bold text-slate-400 block">
                  Student Mobile
                </span>
                <span className="font-mono text-slate-200 truncate block">{studentPhone}</span>
              </div>
            )}

            <div className="min-w-0">
              <span className="text-[8.5px] uppercase font-bold text-slate-400 block">
                Emergency Helpline
              </span>
              <span className="font-mono text-rose-300 font-bold block text-[10px]">+91 1800-GYAN-999</span>
            </div>
          </div>

          {/* Address */}
          <div className="mt-1 pt-1 border-t border-white/10 min-w-0">
            <span className="text-[8.5px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-slate-400" /> Residential Address
            </span>
            <span className="text-[9px] text-slate-200 line-clamp-1">{address}</span>
          </div>

          {/* Stamp & Guidelines */}
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex-1 space-y-0.5 text-[8px] text-slate-300 leading-tight">
              <p>• Official property of {schoolName}. Non-transferable.</p>
              <p>• Must be presented for exams, laboratories, and school bus.</p>
              <p>• If found, kindly return to Institute Administration.</p>
            </div>
            <OfficialStamp size={44} className="shrink-0" />
          </div>

          {/* Digital Barcode Container */}
          <div className="mt-1 pt-1 border-t border-white/10 bg-white rounded-lg p-1.5 flex flex-col items-center justify-center">
            <BarcodeSvg value={uniqueId} height={24} color="#0f172a" />
            <span className="text-[8px] font-mono font-black text-slate-900 tracking-wider truncate max-w-full">
              {uniqueId}
            </span>
          </div>
        </div>
      ) : (
        // HORIZONTAL BACK (CR-80 WALLET)
        <div className="flex-1 px-3 py-2 flex items-center justify-between gap-3 text-slate-200 text-[10px] min-h-0">
          {/* Left: Guardian Details & Terms */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="min-w-0">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">
                  Father / Guardian
                </span>
                <span className="font-bold text-white text-[10.5px] truncate block">{fatherName}</span>
              </div>
              <div className="min-w-0">
                <span className="text-[8px] uppercase font-bold text-slate-400 block">
                  Parent Mobile
                </span>
                <span className="font-mono font-bold text-amber-300 text-[10.5px] truncate block">
                  {parentPhone}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-[8px] uppercase font-bold text-slate-400 block">
                Residential Address
              </span>
              <span className="text-[9px] text-slate-200 truncate block">{address}</span>
            </div>

            <div className="space-y-0.5 text-[7.5px] text-slate-300 leading-tight border-t border-white/10 pt-1">
              <p>• Official property of {schoolName}. Non-transferable.</p>
              <p>
                • Emergency Helpline: <span className="text-rose-300 font-mono font-bold">+91 1800-GYAN-999</span>
              </p>
            </div>
          </div>

          {/* Right: Stamp & Barcode Container */}
          <div className="w-28 shrink-0 flex flex-col items-center justify-between h-full border-l border-white/10 pl-2">
            <OfficialStamp size={44} className="shrink-0" />
            <div className="w-full bg-white rounded-lg p-1 flex flex-col items-center justify-center">
              <BarcodeSvg value={uniqueId} height={18} color="#0f172a" />
              <span className="text-[7.5px] font-mono font-black text-slate-900 tracking-wider truncate max-w-full">
                {uniqueId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Back Footer Band */}
      <div className="px-3.5 py-1 bg-slate-950 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-300">
        <span className="truncate">OFFICIAL GOVERNMENT RECOGNIZED ACADEMIC INSTITUTION</span>
        {isSingleFlip && (
          <span className="font-bold text-amber-400 shrink-0 ml-1">
            <span>FLIP ↻</span>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Action Toolbar */}
      {showControls && (
        <div className="w-full max-w-2xl mb-3 flex items-center justify-between gap-1.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-stone-200/90 shadow-xs print:hidden flex-wrap sm:flex-nowrap">
          {/* View Mode Toggle: 3D Flip vs Both Sides */}
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setViewMode("flip");
                setIsFlipped(false);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "flip"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
              title="Interactive 3D Flippable Card"
            >
              <RotateCcw className="w-3 h-3" />
              <span>3D Flip</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "both"
                  ? "bg-stone-900 text-white shadow-2xs"
                  : "text-stone-700 hover:text-stone-900"
              }`}
              title="See both Front and Back sides at the same time"
            >
              <Columns className="w-3 h-3" />
              <span>Both Sides</span>
            </button>
          </div>

          {/* Quick Flip button when in flip mode */}
          {viewMode === "flip" && (
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all cursor-pointer shrink-0"
            >
              <RotateCcw
                className={`w-3 h-3 text-amber-700 transition-transform duration-300 ${
                  isFlipped ? "rotate-180" : ""
                }`}
              />
              <span>{isFlipped ? "Show Front" : "Flip to Back"}</span>
            </button>
          )}

          {/* Format Switch: Wallet vs Lanyard */}
          {onFormatChange && (
            <button
              type="button"
              onClick={() => onFormatChange(isVertical ? "horizontal" : "vertical")}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer shrink-0"
              title="Toggle between horizontal card and vertical badge"
            >
              <span>{isVertical ? "Wallet CR-80" : "Lanyard Badge"}</span>
            </button>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {/* Copy Unique ID */}
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
              title="Copy Unique Student ID"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3 text-stone-500" />
              )}
              <span className="font-mono text-[11px]">{copied ? "Copied" : "Copy ID"}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
              title="Print ID Card"
            >
              <Printer className="w-3 h-3 text-stone-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3 h-3" />
              <span>{downloading ? "Saving..." : "PDF"}</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: BOTH SIDES SIDE-BY-SIDE */}
      {viewMode === "both" ? (
        <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-5 my-2 animate-in fade-in duration-200">
          {/* Front Side */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-indigo-600" /> Front Side View
            </span>
            <div
              className={`${
                isVertical ? "w-[320px] sm:w-[340px] h-[480px]" : "w-[340px] sm:w-[480px] h-[290px]"
              }`}
            >
              {renderFrontCard(false)}
            </div>
          </div>

          {/* Back Side */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1 flex items-center gap-1">
              <Eye className="w-3 h-3 text-amber-600" /> Back Side View
            </span>
            <div
              className={`${
                isVertical ? "w-[320px] sm:w-[340px] h-[480px]" : "w-[340px] sm:w-[480px] h-[290px]"
              }`}
            >
              {renderBackCard(false)}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: 3D CARD FLIPPING STAGE */
        <div
          ref={cardContainerRef}
          style={{ perspective: "1400px" }}
          className={`relative transition-all duration-300 my-2 ${
            isVertical ? "w-[320px] sm:w-[340px] h-[480px]" : "w-[340px] sm:w-[480px] h-[290px]"
          }`}
        >
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transition: "transform 0.65s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
            className="w-full h-full relative cursor-pointer select-none"
          >
            {renderFrontCard(true)}
            {renderBackCard(true)}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-[11px] text-stone-500 mt-2 text-center print:hidden flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-amber-500" />
        <span>
          {viewMode === "both"
            ? "Viewing both Front and Back sides simultaneously • Switch to 3D Flip to interact"
            : "Click the ID card to flip between Front and Back • Formatted for standard CR-80 wallet printing"}
        </span>
      </p>
    </div>
  );
}
