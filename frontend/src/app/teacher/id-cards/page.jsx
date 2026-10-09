"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import { Card, CardContent } from "@teacher/components/ui/card";
import { Input } from "@teacher/components/ui/input";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Avatar, AvatarFallback } from "@teacher/components/ui/avatar";
import {
  IdCard,
  Search,
  Filter,
  Users,
  UserPlus,
  Phone,
  ShieldCheck,
  Sparkles,
  QrCode,
  Printer,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  CreditCard,
  Building,
} from "lucide-react";
import VirtualStudentIdCard from "@/teacher/components/VirtualStudentIdCard";
import VirtualIdCardModal from "@/teacher/components/VirtualIdCardModal";
import PhoneAutocompleteInput from "@/teacher/components/PhoneAutocompleteInput";
import { clampPercent, initials } from "@/lib/studentFormat";

const ENROLLED_CACHE_KEY = "gyan_enrolled_students_v1";
const SCHOOL_CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

export default function TeacherIdCardsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Student list state
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");
  const [onlyMultiStudent, setOnlyMultiStudent] = useState(false);
  const [activeTab, setActiveTab] = useState("roster"); // "roster" | "households" | "issue"

  // Quick lookup state
  const [lookupIdInput, setLookupIdInput] = useState("");
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Student ID Card form state
  const [newCardForm, setNewCardForm] = useState({
    name: "",
    studentId: "",
    rollNumber: "",
    class: "Class 8",
    section: "Section A",
    dob: "",
    fatherName: "",
    parentPhone: "",
    parentEmail: "",
    studentPhone: "",
    bloodGroup: "O+",
    address: "",
    mediumLanguage: "English",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const schoolId =
    roleDoc?.schoolId ||
    roleDoc?.school_id ||
    user?.unsafeMetadata?.schoolId ||
    (typeof window !== "undefined" ? localStorage.getItem("schoolId") : null) ||
    "default_school";

  // Load students from API and localStorage
  const loadStudents = useCallback(async () => {
    setLoading(true);
    let cachedList = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(ENROLLED_CACHE_KEY);
        if (raw) cachedList = JSON.parse(raw);
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/students?schoolId=all`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map();
          cachedList.forEach((s) => map.set(s.id || s.studentId, s));
          data.forEach((s) => {
            const id = s.id || s.studentId;
            map.set(id, { ...map.get(id), ...s });
          });
          const merged = Array.from(map.values());
          setStudents(merged);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch students from API:", err);
    } finally {
      setLoading(false);
    }

    if (cachedList.length > 0) {
      setStudents(cachedList);
    }
  }, [schoolId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Compute multi-student phone groups (where 1 mobile number has 2+ students)
  const phoneGroupMap = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      const rawPhone = s.parentPhone || s.phone;
      if (!rawPhone) return;
      const clean = rawPhone.replace(/[^0-9]/g, "");
      if (!clean || clean.length < 5) return;
      if (!map.has(clean)) {
        map.set(clean, []);
      }
      map.get(clean).push(s);
    });
    return map;
  }, [students]);

  // Household list (phones with multiple students)
  const multiStudentHouseholds = useMemo(() => {
    const list = [];
    phoneGroupMap.forEach((studentsGroup, phone) => {
      if (studentsGroup.length > 1) {
        list.push({
          phone: studentsGroup[0].parentPhone || phone,
          guardianName: studentsGroup[0].fatherName || "Parent / Guardian",
          students: studentsGroup,
        });
      }
    });
    return list;
  }, [phoneGroupMap]);

  // Filtered students for the roster view
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const sId = (s.studentId || s.id || "").toLowerCase();
      const roll = (s.rollNumber || "").toLowerCase();
      const father = (s.fatherName || "").toLowerCase();
      const parentPhone = (s.parentPhone || "").replace(/[^0-9]/g, "");
      const cleanQ = q.replace(/[^0-9]/g, "");

      const matchesQuery =
        !q ||
        name.includes(q) ||
        sId.includes(q) ||
        roll.includes(q) ||
        father.includes(q) ||
        (cleanQ && parentPhone.includes(cleanQ));

      const matchesClass =
        selectedClass === "All Classes" ||
        s.class === selectedClass ||
        s.className === selectedClass;

      const cleanPhone = (s.parentPhone || "").replace(/[^0-9]/g, "");
      const isMulti = cleanPhone && (phoneGroupMap.get(cleanPhone)?.length || 0) > 1;
      const matchesMulti = !onlyMultiStudent || isMulti;

      return matchesQuery && matchesClass && matchesMulti;
    });
  }, [students, searchQuery, selectedClass, onlyMultiStudent, phoneGroupMap]);

  // Handle direct Unique ID or Mobile search lookup
  const lookupMatches = useMemo(() => {
    const input = lookupIdInput.trim();
    if (!input) return [];

    const cleanInput = input.toLowerCase();
    const cleanNumber = input.replace(/[^0-9]/g, "");

    return students.filter((s) => {
      const sId = String(s.studentId || s.id || "").toLowerCase();
      const roll = String(s.rollNumber || "").toLowerCase();
      const name = String(s.name || "").toLowerCase();
      const parentPhone = (s.parentPhone || "").replace(/[^0-9]/g, "");
      const studentPhone = (s.phone || s.studentPhone || "").replace(/[^0-9]/g, "");
      const phoneMatches =
        cleanNumber &&
        cleanNumber.length >= 2 &&
        (parentPhone.includes(cleanNumber) ||
          cleanNumber.includes(parentPhone) ||
          studentPhone.includes(cleanNumber));

      return (
        sId === cleanInput ||
        sId.includes(cleanInput) ||
        roll === cleanInput ||
        roll.includes(cleanInput) ||
        name.includes(cleanInput) ||
        phoneMatches
      );
    });
  }, [lookupIdInput, students]);

  const handleOpenCard = (student) => {
    setSelectedStudentForCard(student);
    setIsModalOpen(true);
  };

  // Submit new Virtual ID Card registration
  const handleCreateNewCard = async (e) => {
    e.preventDefault();
    if (!newCardForm.name.trim()) {
      setFormMessage({ type: "error", text: "Student full name is required." });
      return;
    }
    if (!newCardForm.parentPhone.trim()) {
      setFormMessage({ type: "error", text: "Parent mobile number is required to link student ID." });
      return;
    }

    setFormSubmitting(true);
    setFormMessage(null);

    const generatedId = newCardForm.studentId?.trim()
      ? newCardForm.studentId.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "_")
      : `GYAN-${new Date().getFullYear()}-${newCardForm.class.replace(/\s+/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const newStudent = {
      ...newCardForm,
      id: generatedId,
      studentId: generatedId,
      userId: generatedId,
      className: newCardForm.class,
      rollNumber: newCardForm.rollNumber || generatedId,
      schoolId: schoolId || "default_school",
      created_at: new Date().toISOString(),
    };

    // Optimistic cache update
    const updated = [newStudent, ...students.filter((s) => s.id !== generatedId)];
    setStudents(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ENROLLED_CACHE_KEY, JSON.stringify(updated));
      } catch (err) {}
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCardForm,
          studentId: generatedId,
          schoolId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue ID card");

      setFormMessage({
        type: "success",
        text: `Virtual ID Card for ${newCardForm.name} generated successfully with Unique ID: ${generatedId}!`,
      });

      // Automatically open the new card in modal
      setTimeout(() => {
        setSelectedStudentForCard(newStudent);
        setIsModalOpen(true);
        setActiveTab("roster");
        setFormMessage(null);
      }, 900);
    } catch (err) {
      setFormMessage({
        type: "success",
        text: `Virtual ID Card for ${newCardForm.name} generated successfully with Unique ID: ${generatedId}!`,
      });
      setTimeout(() => {
        setSelectedStudentForCard(newStudent);
        setIsModalOpen(true);
        setActiveTab("roster");
        setFormMessage(null);
      }, 900);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Smart Identity Hub
              </span>
              <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                Session 2026-27
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Virtual Student Identity Cards
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Create, view, download, and print official tamper-evident Virtual ID Cards. Multiple student IDs registered under a single mobile number are automatically cross-linked and accessible by their unique student ID.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
              <span className="text-[11px] font-semibold text-stone-500 block">Total Students</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900">{students.length}</span>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl">
              <span className="text-[11px] font-semibold text-stone-500 block">Multi-ID Phones</span>
              <span className="text-xl sm:text-2xl font-black text-amber-700">
                {multiStudentHouseholds.length}
              </span>
            </div>

            <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-semibold text-stone-500 block">ID Format</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CR-80 &amp; QR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Unique ID / Mobile Lookup Section */}
      <Card className="bg-gradient-to-r from-stone-900 via-slate-900 to-stone-900 text-white border-stone-800 shadow-xl overflow-hidden rounded-3xl">
        <CardContent className="p-6 sm:p-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Instant Virtual ID Card Creator &amp; Lookup by Unique ID
              </h2>
            </div>
            <p className="text-xs text-stone-300">
              Enter any <b>Unique Student ID</b> (e.g. <span className="font-mono text-amber-300">GYAN-2026-8A-042</span>) or a <b>Parent Mobile Number</b> to instantly generate their official Virtual ID Card with scannable QR code and barcode.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
              <PhoneAutocompleteInput
                value={lookupIdInput}
                onChange={setLookupIdInput}
                onSelectStudent={(st) => handleOpenCard(st)}
                placeholder="Enter mobile number, Unique Student ID, or student name..."
                mode="lookup"
                variant="dark"
                className="flex-1"
                inputClassName="py-3 text-xs sm:text-sm"
              />

              {lookupMatches.length === 1 && (
                <Button
                  onClick={() => handleOpenCard(lookupMatches[0])}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-colors"
                >
                  Generate ID Card <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>

            {/* Instant Match Results */}
            {lookupIdInput && (
              <div className="pt-2">
                {lookupMatches.length > 0 ? (
                  <div className="bg-stone-800/90 border border-stone-700 rounded-2xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                      Found {lookupMatches.length} Matching Student{lookupMatches.length > 1 ? "s" : ""}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {lookupMatches.map((match) => {
                        const mId = match.id || match.studentId;
                        const cleanPhone = (match.parentPhone || "").replace(/[^0-9]/g, "");
                        const siblingCount = phoneGroupMap.get(cleanPhone)?.length || 0;

                        return (
                          <div
                            key={mId}
                            onClick={() => handleOpenCard(match)}
                            className="bg-stone-900/90 hover:bg-stone-700/80 border border-stone-700/80 hover:border-amber-400/60 p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="w-9 h-9 border border-stone-600 shrink-0">
                                <AvatarFallback className="bg-amber-400 text-slate-950 font-bold text-xs">
                                  {initials(match.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors">
                                  {match.name}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono truncate">
                                  ID: {mId} • {match.class || match.className}
                                </div>
                                {siblingCount > 1 && (
                                  <span className="text-[9px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                                    <Users className="w-2.5 h-2.5" /> {siblingCount} Students on this Mobile
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="h-7 text-[11px] bg-stone-800 text-stone-200 group-hover:bg-amber-400 group-hover:text-slate-950 font-bold px-2.5 rounded-lg shrink-0 transition-colors"
                            >
                              View Card
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-800/80 border border-stone-700 rounded-2xl p-4 text-center space-y-2">
                    <p className="text-xs text-stone-300">
                      No existing student found matching &ldquo;{lookupIdInput}&rdquo;.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewCardForm((prev) => ({
                          ...prev,
                          studentId: lookupIdInput.replace(/[^a-zA-Z0-9_-]/g, "_").toUpperCase(),
                          rollNumber: lookupIdInput,
                        }));
                        setActiveTab("issue");
                      }}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Create Virtual ID Card with ID: &ldquo;{lookupIdInput}&rdquo;
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("roster")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === "roster"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <IdCard className="w-4 h-4" />
            <span>All Virtual ID Cards ({filteredStudents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("households")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === "households"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Multi-Student Mobile Accounts ({multiStudentHouseholds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("issue")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 ${
              activeTab === "issue"
                ? "bg-stone-900 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Issue New Virtual ID Card</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ALL VIRTUAL ID CARDS ROSTER */}
      {/* ========================================================= */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by student name, unique ID, roll number, or phone..."
                  className="pl-9 bg-[#FAF8F5] border-stone-200 text-xs"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#FAF8F5] border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 font-medium"
              >
                <option>All Classes</option>
                {SCHOOL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer px-2 py-1 bg-stone-50 rounded-lg border border-stone-200 shrink-0">
                <input
                  type="checkbox"
                  checked={onlyMultiStudent}
                  onChange={(e) => setOnlyMultiStudent(e.target.checked)}
                  className="accent-stone-900 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Multi-Student Phones Only</span>
              </label>
            </div>
          </div>

          {/* Grid of Student ID Card Previews */}
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const sId = student.id || student.studentId;
                const cleanPhone = (student.parentPhone || "").replace(/[^0-9]/g, "");
                const siblingsList = phoneGroupMap.get(cleanPhone) || [];
                const hasSiblings = siblingsList.length > 1;

                return (
                  <Card
                    key={sId}
                    className="bg-white border-stone-200/90 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col justify-between group"
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Top Header of Card Item */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-11 h-11 border-2 border-stone-200 shrink-0">
                            <AvatarFallback className="bg-stone-900 text-white font-bold text-xs">
                              {initials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-bold text-stone-900 text-sm truncate">
                              {student.name}
                            </h3>
                            <div className="text-[11px] text-stone-500 font-medium truncate">
                              {student.class || student.className} {student.section ? `• ${student.section}` : ""}
                            </div>
                          </div>
                        </div>

                        <Badge className="bg-stone-100 text-stone-800 border-stone-300 text-[10px] font-mono shrink-0">
                          {student.bloodGroup || "O+"}
                        </Badge>
                      </div>

                      {/* Unique ID Badge */}
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-stone-500 font-medium">STUDENT UNIQUE ID</span>
                          <span className="font-semibold text-stone-700">Roll: {student.rollNumber || sId}</span>
                        </div>
                        <div className="font-mono font-bold text-xs text-stone-900 bg-white px-2 py-1 rounded-md border border-stone-200/80 flex items-center justify-between">
                          <span className="truncate">{sId}</span>
                          <QrCode className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
                        </div>
                      </div>

                      {/* Parent Phone & Multi-Student Indicator */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between text-stone-600">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-stone-400" /> Parent Mobile:
                          </span>
                          <span className="font-semibold font-mono text-stone-900">
                            {student.parentPhone || "Not Provided"}
                          </span>
                        </div>

                        {hasSiblings && (
                          <div className="pt-1 flex items-center justify-between text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/70 px-2 py-1 rounded-lg">
                            <span className="font-bold flex items-center gap-1">
                              <Users className="w-3 h-3 text-amber-700" /> Family Account:
                            </span>
                            <span className="font-medium">
                              {siblingsList.length} Student IDs on this Mobile
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                        <Button
                          onClick={() => handleOpenCard(student)}
                          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <IdCard className="w-3.5 h-3.5" />
                          <span>View Virtual ID Card</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-[#FAF8F5] border-dashed border-stone-300">
              <CardContent className="p-10 text-center text-stone-600 space-y-3">
                <IdCard className="w-10 h-10 mx-auto text-stone-400" />
                <div className="font-bold text-base text-stone-800">No Student ID Cards Found</div>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  No registered student matches your query or class filter. Use the search bar above or click below to register a new student.
                </p>
                <Button
                  onClick={() => setActiveTab("issue")}
                  className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Issue New Virtual ID Card
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MULTI-STUDENT MOBILE ACCOUNTS (HOUSEHOLD HUB) */}
      {/* ========================================================= */}
      {activeTab === "households" && (
        <div className="space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
              <Users className="w-4 h-4 text-amber-700" />
              <span>Multi-Student Mobile Registry (Sibling &amp; Household Accounts)</span>
            </div>
            <p className="text-amber-800 text-xs">
              In this system, multiple students can be registered under a single parent mobile phone number. Each child has their own unique Student ID, attendance, and progress records.
            </p>
          </div>

          {multiStudentHouseholds.length > 0 ? (
            <div className="space-y-4">
              {multiStudentHouseholds.map((hh) => (
                <Card key={hh.phone} className="bg-white border-stone-200 shadow-sm rounded-2xl overflow-hidden">
                  <div className="bg-[#FAF8F5] p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                          <span>Mobile Account: {hh.phone}</span>
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                            {hh.students.length} Student IDs
                          </Badge>
                        </div>
                        <div className="text-xs text-stone-500">
                          Guardian: <b className="text-stone-700">{hh.guardianName}</b>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenCard(hh.students[0])}
                        className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        <IdCard className="w-3.5 h-3.5 mr-1" /> View ID Cards
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {hh.students.map((st) => {
                        const sId = st.id || st.studentId;
                        return (
                          <div
                            key={sId}
                            onClick={() => handleOpenCard(st)}
                            className="p-3 rounded-xl border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-stone-900 group-hover:text-indigo-600 transition-colors">
                                {st.name}
                              </span>
                              <Badge className="bg-stone-100 text-stone-700 text-[10px]">
                                {st.class || st.className}
                              </Badge>
                            </div>

                            <div className="text-[11px] font-mono text-stone-600 bg-stone-50 p-1.5 rounded-md border border-stone-200/60 truncate">
                              ID: {sId}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                              <span>DOB: {st.dob || "—"}</span>
                              <span className="font-bold text-stone-700 group-hover:underline">Open Card →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
              No multi-student households found yet.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ISSUE NEW VIRTUAL ID CARD */}
      {/* ========================================================= */}
      {activeTab === "issue" && (
        <Card className="bg-white border-stone-200 shadow-sm rounded-3xl">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-stone-900" />
                <span>Issue New Student Virtual ID Card</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Enrolls a student, generates a unique identity code, and issues a tamper-evident virtual ID card. You can assign an existing parent mobile number to link multiple siblings to the same parent.
              </p>
            </div>

            {formMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  formMessage.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {formMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : null}
                <span>{formMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateNewCard} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Student Full Name <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={newCardForm.name}
                    onChange={(e) => setNewCardForm({ ...newCardForm, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Custom Unique ID <span className="text-[10px] text-stone-400">(Optional)</span>
                  </label>
                  <Input
                    value={newCardForm.studentId}
                    onChange={(e) => {
                      setNewCardForm({
                        ...newCardForm,
                        studentId: e.target.value,
                        rollNumber: e.target.value,
                      });
                    }}
                    placeholder="Auto-generated if empty"
                    className="bg-[#FAF8F5] border-stone-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Class / Grade <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newCardForm.class}
                    onChange={(e) => setNewCardForm({ ...newCardForm, class: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-lg p-2 text-xs font-medium text-stone-800"
                  >
                    {SCHOOL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Section / Division</label>
                  <Input
                    value={newCardForm.section}
                    onChange={(e) => setNewCardForm({ ...newCardForm, section: e.target.value })}
                    placeholder="Section A"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Date of Birth (DOB)</label>
                  <Input
                    type="date"
                    value={newCardForm.dob}
                    onChange={(e) => setNewCardForm({ ...newCardForm, dob: e.target.value })}
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Father&apos;s / Guardian&apos;s Name
                  </label>
                  <Input
                    value={newCardForm.fatherName}
                    onChange={(e) => setNewCardForm({ ...newCardForm, fatherName: e.target.value })}
                    placeholder="Mr. Rajesh Sharma"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <PhoneAutocompleteInput
                    value={newCardForm.parentPhone}
                    onChange={(val) => setNewCardForm((prev) => ({ ...prev, parentPhone: val }))}
                    onSelectPhone={(group) => {
                      const firstStudent = group.students?.[0];
                      setNewCardForm((prev) => ({
                        ...prev,
                        parentPhone: group.phone,
                        fatherName: prev.fatherName || group.guardianName || firstStudent?.fatherName || "",
                        parentEmail: prev.parentEmail || firstStudent?.parentEmail || "",
                        address: prev.address || firstStudent?.address || "",
                      }));
                    }}
                    onSelectStudent={(st) => {
                      setNewCardForm((prev) => ({
                        ...prev,
                        parentPhone: st.parentPhone || st.phone || prev.parentPhone,
                        fatherName: prev.fatherName || st.fatherName || "",
                        parentEmail: prev.parentEmail || st.parentEmail || "",
                        address: prev.address || st.address || "",
                      }));
                    }}
                    mode="form"
                    variant="light"
                    showLabel={true}
                    label="Parent / Guardian Mobile Number"
                    required={true}
                    placeholder="+91 98765 43210 (type to search DB)"
                  />
                  <p className="text-[10px] text-stone-500">
                    Type to see registered numbers in the database, or enter a new number.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Parent Email Address</label>
                  <Input
                    type="email"
                    value={newCardForm.parentEmail}
                    onChange={(e) => setNewCardForm({ ...newCardForm, parentEmail: e.target.value })}
                    placeholder="parent@example.com"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Blood Group</label>
                  <select
                    value={newCardForm.bloodGroup}
                    onChange={(e) => setNewCardForm({ ...newCardForm, bloodGroup: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-lg p-2 text-xs font-medium text-stone-800"
                  >
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="text-xs font-semibold text-stone-700">Residential Address</label>
                  <Input
                    value={newCardForm.address}
                    onChange={(e) => setNewCardForm({ ...newCardForm, address: e.target.value })}
                    placeholder="Plot / Street / City / State"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("roster")}
                  className="text-xs border-stone-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Issuing Virtual ID Card...
                    </>
                  ) : (
                    <>
                      <IdCard className="w-3.5 h-3.5 mr-1.5" /> Issue &amp; Preview Virtual ID Card
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Virtual ID Card Modal Dialog */}
      <VirtualIdCardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudentForCard(null);
        }}
        student={selectedStudentForCard}
        allStudents={students}
        onSelectStudent={(sibling) => setSelectedStudentForCard(sibling)}
      />
    </div>
  );
}
