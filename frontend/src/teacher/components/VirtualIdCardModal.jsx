"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@teacher/components/ui/dialog";
import {
  IdCard,
  Users,
  Palette,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit3,
  Layers,
  X,
  Copy,
  Check,
} from "lucide-react";
import VirtualStudentIdCard from "./VirtualStudentIdCard";

export default function VirtualIdCardModal({
  isOpen = false,
  onClose = () => {},
  student = null,
  allStudents = [],
  onSelectStudent = null,
}) {
  const [theme, setTheme] = useState("indigo");
  const [format, setFormat] = useState("horizontal"); // Default to horizontal CR-80 wallet card
  const [activeTab, setActiveTab] = useState("card"); // "card" | "customize"
  const [copiedId, setCopiedId] = useState(false);

  // Editable local state for quick customization
  const [customFields, setCustomFields] = useState({
    bloodGroup: student?.bloodGroup || "O+",
    section: student?.section || "Section A",
    photoUrl: student?.photoUrl || "",
    mediumLanguage: student?.mediumLanguage || "English",
  });

  // Find other students registered under the same parent mobile number
  const siblings = useMemo(() => {
    const curId = student?.id || student?.studentId;
    if (Array.isArray(student?.familyStudents) && student.familyStudents.length > 1) {
      return student.familyStudents.filter((s) => (s.id || s.studentId) !== curId);
    }
    if (Array.isArray(student?.siblings) && student.siblings.length > 0) {
      return student.siblings.filter((s) => (s.id || s.studentId) !== curId);
    }

    if (!student?.parentPhone || !Array.isArray(allStudents)) return [];
    const cleanPhone = (student.parentPhone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 5) return [];

    return allStudents.filter((s) => {
      const p = (s.parentPhone || s.phone || "").replace(/[^0-9]/g, "");
      const sId = s.id || s.studentId;
      return p === cleanPhone && sId !== curId;
    });
  }, [student, allStudents]);

  if (!student) return null;

  const mergedStudent = {
    ...student,
    bloodGroup: customFields.bloodGroup || student.bloodGroup || "O+",
    section: customFields.section || student.section || "A",
    photoUrl: customFields.photoUrl || student.photoUrl || null,
    mediumLanguage: customFields.mediumLanguage || student.mediumLanguage || "English",
  };

  const uniqueId =
    mergedStudent.uniqueId ||
    mergedStudent.id ||
    mergedStudent.studentId ||
    mergedStudent.rollNumber ||
    "GYAN-STD-001";

  const handleCopyUniqueId = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(uniqueId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl w-[96vw] max-h-[95vh] overflow-y-auto bg-stone-50 border border-stone-200 text-stone-900 p-4 sm:p-6 rounded-3xl shadow-2xl">
        {/* Header Bar */}
        <DialogHeader className="pb-3 border-b border-stone-200/90 pr-12">
          {/* Row 1: Title & View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                <IdCard className="w-5 h-5 text-amber-400" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-black text-stone-900 tracking-tight whitespace-nowrap">
                Virtual Student ID Card
              </DialogTitle>
            </div>

            {/* Segmented View Switcher */}
            <div className="flex items-center gap-1 bg-stone-200/90 p-1 rounded-xl shrink-0 border border-stone-300/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === "card"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Card View
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("customize")}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "customize"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Themes &amp; Customize</span>
              </button>
            </div>
          </div>

          {/* Row 2: Student Details & Copyable ID Badge */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <DialogDescription className="text-xs text-stone-600 truncate">
              Official smart digital identity for <b className="text-stone-900">{mergedStudent.name}</b> ({mergedStudent.class || mergedStudent.className}).
            </DialogDescription>

            <button
              type="button"
              onClick={handleCopyUniqueId}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Click to copy full unique student ID"
            >
              <span className="truncate max-w-[200px] sm:max-w-[280px]">ID: {uniqueId}</span>
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-700" />
              ) : (
                <Copy className="w-3 h-3 text-amber-700 opacity-70" />
              )}
            </button>
          </div>
        </DialogHeader>

        {/* Multi-Student Mobile Notice Banner (if siblings exist) */}
        {siblings.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="w-4 h-4 text-amber-700 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold">Multi-Student Family Mobile: </span>
                <span className="font-medium text-amber-900">
                  {siblings.length + 1} Student IDs linked to mobile <b>{student.parentPhone}</b>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <span className="text-[11px] font-semibold text-amber-800">Switch Sibling ID:</span>
              {siblings.map((sib) => {
                const sId = sib.id || sib.studentId;
                return (
                  <button
                    key={sId}
                    type="button"
                    onClick={() => {
                      if (onSelectStudent) {
                        onSelectStudent(sib);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-900 rounded-lg border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                    title={`View ID Card of ${sib.name}`}
                  >
                    <span>{sib.name}</span>
                    <span className="font-mono text-[9px] text-amber-700">
                      ({sib.class || sib.className})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 1: CARD VIEW */}
        {activeTab === "card" && (
          <div className="py-2 flex flex-col items-center justify-center animate-in fade-in duration-200">
            <VirtualStudentIdCard
              student={mergedStudent}
              theme={theme}
              format={format}
              showControls={true}
              onFormatChange={setFormat}
            />
          </div>
        )}

        {/* TAB 2: CUSTOMIZE & THEMES */}
        {activeTab === "customize" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-2 animate-in fade-in duration-200">
            {/* Left Controls Panel */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <span>Card Visual Design &amp; Enrichment Data</span>
              </h4>

              {/* Theme Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">ID Card Visual Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "indigo", name: "Royal Indigo", bg: "bg-[#0b1320] text-amber-300 border-indigo-500/40" },
                    { key: "emerald", name: "STEM Emerald", bg: "bg-[#051c14] text-emerald-300 border-emerald-500/40" },
                    { key: "crimson", name: "Prestige Crimson", bg: "bg-[#1f060b] text-rose-300 border-rose-500/40" },
                    { key: "dark", name: "Obsidian Titanium", bg: "bg-[#08090d] text-cyan-300 border-cyan-500/40" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTheme(t.key)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between border-2 transition-all cursor-pointer ${
                        t.bg
                      } ${
                        theme === t.key
                          ? "ring-2 ring-indigo-600 border-white shadow-sm"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                    >
                      <span>{t.name}</span>
                      {theme === t.key && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation Format */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700">Card Orientation Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat("horizontal")}
                    className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                      format === "horizontal"
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                    }`}
                  >
                    Landscape Card (CR-80 Wallet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("vertical")}
                    className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                      format === "vertical"
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                    }`}
                  >
                    Vertical Badge (Lanyard ID)
                  </button>
                </div>
              </div>

              {/* Form Fields: Blood Group & Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Blood Group</label>
                  <select
                    value={customFields.bloodGroup}
                    onChange={(e) =>
                      setCustomFields({ ...customFields, bloodGroup: e.target.value })
                    }
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                  >
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Class Section / Division</label>
                  <input
                    type="text"
                    value={customFields.section}
                    onChange={(e) =>
                      setCustomFields({ ...customFields, section: e.target.value })
                    }
                    placeholder="e.g. Section A"
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700">
                  Custom Student Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={customFields.photoUrl}
                  onChange={(e) =>
                    setCustomFields({ ...customFields, photoUrl: e.target.value })
                  }
                  placeholder="https://example.com/student.jpg (or leave empty for initials)"
                  className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl p-2.5 text-xs font-medium text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Apply &amp; Return to Card View →
                </button>
              </div>
            </div>

            {/* Right Live Mini-Preview Panel */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-stone-100/70 p-4 rounded-2xl border border-stone-200/70">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                Live Design Preview
              </span>
              <div className="scale-90 sm:scale-95 origin-center">
                <VirtualStudentIdCard
                  student={mergedStudent}
                  theme={theme}
                  format={format}
                  showControls={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Info Summary */}
        <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Tamper-evident smart card with scannable QR verification and Code-128 barcode.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto text-xs font-bold text-stone-700 hover:text-stone-900 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
