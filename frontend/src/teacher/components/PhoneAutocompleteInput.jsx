"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Search,
  Users,
  IdCard,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Database,
  ExternalLink,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@teacher/components/ui/avatar";
import { initials } from "@/lib/studentFormat";

export default function PhoneAutocompleteInput({
  value = "",
  onChange = () => {},
  onSelectStudent = null,
  onSelectPhone = null,
  placeholder = "Enter mobile number or unique student ID...",
  className = "",
  inputClassName = "",
  mode = "lookup", // "lookup" | "form"
  variant = "light", // "light" | "dark"
  autoFocus = false,
  showLabel = false,
  label = "Parent Mobile Number",
  required = false,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const isDark = variant === "dark";

  // Fetch phone suggestions from database via API
  useEffect(() => {
    let active = true;
    const trimmed = (value || "").trim();

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students/suggest-phone?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data)) {
            setSuggestions(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch phone suggestions:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectGroup = (group) => {
    onChange(group.phone);
    if (onSelectPhone) {
      onSelectPhone(group);
    }
    if (mode === "lookup" && group.students?.length > 0 && onSelectStudent) {
      onSelectStudent({
        ...group.students[0],
        familyStudents: group.students,
      });
    }
    setIsOpen(false);
  };

  const handleSelectIndividualStudent = (student, group, e) => {
    e?.stopPropagation();
    onChange(student.parentPhone || student.phone || value);
    if (onSelectStudent) {
      onSelectStudent({
        ...student,
        familyStudents: group?.students || [student],
      });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {showLabel && (
        <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? "text-stone-300" : "text-stone-700"}`}>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-stone-400" />
            <span>{label} {required && <span className="text-rose-500">*</span>}</span>
          </span>
          <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? "text-amber-400" : "text-indigo-600"}`}>
            <Database className="w-3 h-3" /> Auto-suggests from DB
          </span>
        </label>
      )}

      <div className="relative w-full">
        {mode === "lookup" ? (
          <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-stone-400" : "text-stone-400"}`} />
        ) : (
          <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? "text-stone-400" : "text-stone-400"}`} />
        )}

        <input
          type={mode === "lookup" ? "text" : "tel"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-mono transition-all focus:outline-hidden ${
            isDark
              ? "bg-stone-800/90 text-white placeholder-stone-400 border border-stone-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/40"
              : "bg-[#FAF8F5] text-stone-900 placeholder-stone-400 border border-stone-200 focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
          } ${inputClassName}`}
        />

        {loading ? (
          <Loader2 className={`w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-amber-400" : "text-stone-400"}`} />
        ) : value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(true);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1 hover:opacity-100 opacity-60 ${isDark ? "text-stone-300" : "text-stone-500"}`}
            title="Clear input"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Auto-Suggestion Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl z-50 max-h-[420px] overflow-y-auto divide-y animate-in fade-in duration-150 ${
            isDark
              ? "bg-stone-900 border border-stone-700 text-stone-100 divide-stone-800 shadow-black/80"
              : "bg-white border border-stone-200/90 text-stone-900 divide-stone-100 shadow-xl"
          }`}
        >
          {/* Header */}
          <div
            className={`p-2.5 border-b flex items-center justify-between text-[11px] font-bold ${
              isDark
                ? "bg-stone-950/90 border-stone-800 text-stone-300"
                : "bg-stone-50/95 border-stone-200/80 text-stone-700"
            }`}
          >
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Database className={`w-3.5 h-3.5 ${isDark ? "text-amber-400" : "text-emerald-600"}`} />
              <span>Database Mobile Numbers &amp; Student IDs</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isDark ? "bg-stone-800 text-amber-300 border border-amber-400/30" : "bg-stone-200/70 text-stone-700"
              }`}
            >
              {suggestions.length} Found in DB
            </span>
          </div>

          {suggestions.length > 0 ? (
            suggestions.map((group) => {
              return (
                <div
                  key={group.cleanPhone}
                  onClick={() => handleSelectGroup(group)}
                  className={`p-3 transition-colors cursor-pointer space-y-2 group ${
                    isDark ? "hover:bg-stone-800/80" : "hover:bg-stone-50/90"
                  }`}
                >
                  {/* Phone Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-bold text-xs flex items-center gap-1.5 ${
                          isDark
                            ? "text-amber-300 group-hover:text-amber-200"
                            : "text-stone-900 group-hover:text-indigo-600"
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {group.phone}
                      </span>
                      {group.hasMultipleStudents && (
                        <span className="text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-500" />
                          <span>{group.studentCount} Students (Family)</span>
                        </span>
                      )}
                    </div>

                    <span className={`text-[11px] font-medium ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                      Guardian: <b className={isDark ? "text-stone-200" : "text-stone-700"}>{group.guardianName}</b>
                    </span>
                  </div>

                  {/* List of Linked Student IDs for this phone number */}
                  <div className="space-y-1.5 pt-0.5">
                    {group.students.map((student) => {
                      const sId = student.id || student.studentId;
                      return (
                        <div
                          key={sId}
                          onClick={(e) => handleSelectIndividualStudent(student, group, e)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            isDark
                              ? "bg-stone-950/60 hover:bg-stone-800/90 border-stone-800 hover:border-amber-400/50"
                              : "bg-stone-50 hover:bg-indigo-50/70 border-stone-200/80 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="w-7 h-7 border border-stone-400 shrink-0">
                              <AvatarFallback
                                className={`font-bold text-[10px] ${
                                  isDark ? "bg-amber-400 text-slate-950" : "bg-stone-900 text-white"
                                }`}
                              >
                                {initials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className={`font-bold text-xs truncate ${isDark ? "text-white" : "text-stone-900"}`}>
                                {student.name}
                              </div>
                              <div
                                className={`text-[10px] font-mono truncate flex items-center gap-1.5 ${
                                  isDark ? "text-stone-400" : "text-stone-500"
                                }`}
                              >
                                <span
                                  className={`px-1.5 py-0.2 rounded border font-bold ${
                                    isDark
                                      ? "bg-stone-900 border-stone-700 text-amber-300"
                                      : "bg-white border-stone-200 text-stone-700"
                                  }`}
                                >
                                  ID: {sId}
                                </span>
                                <span>• {student.class || student.className}</span>
                              </div>
                            </div>
                          </div>

                          {mode === "lookup" ? (
                            <button
                              type="button"
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0 transition-all ${
                                isDark
                                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm"
                                  : "bg-stone-900 hover:bg-stone-800 text-white shadow-2xs"
                              }`}
                            >
                              <IdCard className="w-3 h-3" />
                              <span>Virtual ID Card</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`text-[11px] font-bold flex items-center gap-1 shrink-0 ${
                                isDark ? "text-amber-300 hover:text-amber-200" : "text-indigo-700 hover:text-indigo-900"
                              }`}
                            >
                              <span>Use Household Data →</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={`p-4 text-center text-xs space-y-1 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              <p>No phone numbers in the database match &ldquo;{value}&rdquo;.</p>
              <p className={`text-[11px] ${isDark ? "text-stone-500" : "text-stone-400"}`}>
                {mode === "lookup"
                  ? "Try searching by student unique ID or name, or register them in the Issue tab."
                  : "You can enter this number to create a new student registration."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
