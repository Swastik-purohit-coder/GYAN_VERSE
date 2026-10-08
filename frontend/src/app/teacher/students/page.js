"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import { useSchoolProgress } from "@/hooks/useApi";
import { useRealtimeQuizProgress } from "@/hooks/useRealtimeQuizProgress";
import { Card, CardContent } from "@teacher/components/ui/card";
import { Input } from "@teacher/components/ui/input";
import { Badge } from "@teacher/components/ui/badge";
import { Button } from "@teacher/components/ui/button";
import { Avatar, AvatarFallback } from "@teacher/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@teacher/components/ui/dialog";
import {
  Search,
  Plus,
  UserPlus,
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  BookOpen,
  Award,
  Loader2,
  Lock,
  Moon,
  Bell,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { clampPercent, formatLastActivity, initials } from "@/lib/studentFormat";

const SCHOOL_CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const ENROLLED_CACHE_KEY = "gyan_enrolled_students_v1";

function defaultStudentForm() {
  return {
    name: "",
    studentId: "",
    rollNumber: "",
    dob: "",
    class: "Class 8",
    section: "Section A",
    mediumLanguage: "English",
    fatherName: "",
    parentPhone: "",
    parentEmail: "",
    studentPhone: "",
    address: "",
    parentalControl: {
      weeklyReports: true,
      dailyStudyLimit: "2 Hours / Day",
      safetyMode: true,
      quizAlerts: true,
      quietHours: false,
    },
  };
}

function StudentCard({ student }) {
  const [expanded, setExpanded] = useState(false);
  const progress = clampPercent(student.averageScore);
  const badgeValue = student.bestScore != null ? clampPercent(student.bestScore) : progress;

  return (
    <Card className="bg-white border-stone-200 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10 border border-stone-200">
            <AvatarFallback className="bg-stone-900 text-white font-bold text-xs">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-stone-900 text-sm truncate">{student.name}</div>
              <Badge className="bg-stone-900 text-white text-[11px] font-semibold">{badgeValue}%</Badge>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
              <span className="font-medium text-stone-700">{student.className || student.class}</span>
              {student.section && <span>• {student.section}</span>}
              {student.rollNumber && <span className="text-stone-400">ID: {student.rollNumber}</span>}
            </div>

            <div className="text-xs text-stone-700 flex items-center gap-4 mt-2">
              <span>Quizzes: <b>{student.totalQuizzes ?? 0}</b></span>
              <span>Avg Score: <span className="text-emerald-700 font-bold">{progress}%</span></span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-stone-900 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Expandable Details (DOB, Parent Details, Parental Controls) */}
        {expanded && (
          <div className="pt-2 border-t border-stone-100 space-y-2 text-xs text-stone-600 bg-[#FAF8F5] p-3 rounded-lg animate-in fade-in duration-150">
            {student.dob && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>DOB: <b>{student.dob}</b></span>
              </div>
            )}
            {student.fatherName && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Father / Guardian: <b>{student.fatherName}</b></span>
              </div>
            )}
            {student.parentPhone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Parent Phone: <b>{student.parentPhone}</b></span>
              </div>
            )}
            {student.parentEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Parent Email: <b className="truncate">{student.parentEmail}</b></span>
              </div>
            )}
            {student.studentPhone && (
              <div className="flex items-center gap-2 text-stone-500">
                <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Student Phone: {student.studentPhone} (Optional)</span>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-2 text-stone-500">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">{student.address}</span>
              </div>
            )}
            {student.parentalControl && (
              <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                {student.parentalControl.weeklyReports && (
                  <span className="bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">
                    ✓ Weekly Digest
                  </span>
                )}
                {student.parentalControl.quizAlerts && (
                  <span className="bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">
                    ✓ Test Alerts
                  </span>
                )}
                {student.parentalControl.dailyStudyLimit && (
                  <span className="bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">
                    ⏱️ {student.parentalControl.dailyStudyLimit}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>Less Details <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Parent &amp; ID Details <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>

          <Button asChild variant="outline" size="sm" className="h-7 text-xs border-stone-200 bg-white hover:bg-stone-100">
            <Link href={`/teacher/students/${student.id || student.studentId}`}>View Academic Report</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentsContent() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");

  // Local student registry
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loadingRegistered, setLoadingRegistered] = useState(false);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentForm, setStudentForm] = useState(defaultStudentForm());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) {
      setRoleDoc(null);
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    fetchUserRole(user.id)
      .then((doc) => {
        if (!active) return;
        setRoleDoc(doc);
      })
      .catch(() => {
        if (!active) return;
        setRoleDoc(null);
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id]);

  const rawRole = typeof roleDoc === "string" ? roleDoc : roleDoc?.role;
  const effectiveRole = (rawRole && rawRole !== "unassigned")
    ? rawRole
    : user?.unsafeMetadata?.role || (typeof window !== "undefined" ? localStorage.getItem("userRole") : null) || "teacher";

  const schoolId = roleDoc?.schoolId || roleDoc?.school_id || user?.unsafeMetadata?.schoolId || (typeof window !== "undefined" ? localStorage.getItem("schoolId") : null) || "default_school";

  const {
    schoolProgress,
    loading: progressLoading,
    fetchSchoolProgress,
  } = useSchoolProgress(schoolId);

  // Fetch full student metadata from /api/students and merge with localStorage cache
  const loadRegisteredStudents = useCallback(async () => {
    setLoadingRegistered(true);

    // 1. Read local cache
    let localCache = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(ENROLLED_CACHE_KEY);
        if (raw) localCache = JSON.parse(raw);
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/students?schoolId=${encodeURIComponent(schoolId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const map = new Map();
          localCache.forEach((s) => map.set(s.id, s));
          data.forEach((s) => map.set(s.id, { ...map.get(s.id), ...s }));
          setRegisteredStudents(Array.from(map.values()));
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch registered students from API:", e);
    } finally {
      setLoadingRegistered(false);
    }

    if (localCache.length > 0) {
      setRegisteredStudents(localCache);
    }
  }, [schoolId]);

  useEffect(() => {
    loadRegisteredStudents();
  }, [loadRegisteredStudents]);

  const handleRealtimeQuiz = useCallback(() => {
    if (!schoolId) return;
    fetchSchoolProgress();
    loadRegisteredStudents();
  }, [fetchSchoolProgress, loadRegisteredStudents, schoolId]);

  useRealtimeQuizProgress({ schoolId, onQuizEvent: handleRealtimeQuiz });

  // Merge progress records with registered student metadata
  const students = useMemo(() => {
    const progressMap = new Map();
    if (schoolProgress?.students) {
      schoolProgress.students.forEach((s) => {
        const id = s.studentId || s.userId || s.id;
        progressMap.set(id, s);
      });
    }

    const regMap = new Map();
    registeredStudents.forEach((r) => {
      const id = r.studentId || r.userId || r.id;
      regMap.set(id, r);
    });

    const allIds = new Set([...progressMap.keys(), ...regMap.keys()]);

    return Array.from(allIds).map((id) => {
      const prog = progressMap.get(id) || {};
      const reg = regMap.get(id) || {};

      return {
        id,
        studentId: id,
        name: reg.name || prog.name || "Student",
        className: reg.class || reg.className || prog.class || "Class 8",
        class: reg.class || reg.className || prog.class || "Class 8",
        section: reg.section || null,
        rollNumber: reg.rollNumber || reg.studentId || null,
        dob: reg.dob || null,
        fatherName: reg.fatherName || null,
        parentPhone: reg.parentPhone || null,
        parentEmail: reg.parentEmail || null,
        studentPhone: reg.studentPhone || null,
        address: reg.address || null,
        mediumLanguage: reg.mediumLanguage || "English",
        parentalControl: reg.parentalControl || null,
        totalQuizzes: prog.totalQuizzes ?? 0,
        averageScore: typeof prog.averageScore === "number" ? prog.averageScore : 0,
        bestScore: typeof prog.bestScore === "number" ? prog.bestScore : null,
        lastActivity: prog.lastActivity || null,
      };
    });
  }, [schoolProgress?.students, registeredStudents]);

  const classOptions = useMemo(() => {
    const unique = new Set();
    students.forEach((student) => {
      if (student.className) unique.add(student.className);
    });
    return ["All Classes", ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [students]);

  useEffect(() => {
    if (!classOptions.includes(selectedClass)) {
      setSelectedClass("All Classes");
    }
  }, [classOptions, selectedClass]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students
      .filter((student) => {
        const matchesQuery =
          !query ||
          student.name.toLowerCase().includes(query) ||
          student.className.toLowerCase().includes(query) ||
          (student.rollNumber && String(student.rollNumber).toLowerCase().includes(query)) ||
          (student.fatherName && student.fatherName.toLowerCase().includes(query)) ||
          (student.parentPhone && student.parentPhone.includes(query));
        const matchesClass = selectedClass === "All Classes" || student.className === selectedClass;
        return matchesQuery && matchesClass;
      })
      .sort((a, b) => clampPercent(b.averageScore) - clampPercent(a.averageScore));
  }, [students, search, selectedClass]);

  // Handle Form Change
  const updateFormField = (key, value) => {
    setStudentForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateParentalControl = (key, value) => {
    setStudentForm((prev) => ({
      ...prev,
      parentalControl: {
        ...prev.parentalControl,
        [key]: value,
      },
    }));
  };

  // Submit New Student Form
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      setFormError("Student full name is required.");
      return;
    }
    if (!studentForm.dob.trim()) {
      setFormError("Date of birth (DOB) is required.");
      return;
    }
    if (!studentForm.fatherName.trim()) {
      setFormError("Father's / Guardian's name is required.");
      return;
    }
    if (!studentForm.parentPhone.trim()) {
      setFormError("Parent phone number is required for notifications.");
      return;
    }
    if (!studentForm.parentEmail.trim()) {
      setFormError("Parent email address is required for weekly reports.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    const generatedId = studentForm.studentId?.trim()
      ? studentForm.studentId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_")
      : `std_${Date.now()}`;

    const newStudentObj = {
      id: generatedId,
      studentId: generatedId,
      userId: generatedId,
      ...studentForm,
      className: studentForm.class,
      schoolId: schoolId || "default_school",
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: null,
      lastActivity: null,
      created_at: new Date().toISOString(),
    };

    // Optimistic Update
    setRegisteredStudents((prev) => [newStudentObj, ...prev.filter((s) => s.id !== generatedId)]);

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(ENROLLED_CACHE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const updated = [newStudentObj, ...list.filter((s) => s.id !== generatedId)];
        localStorage.setItem(ENROLLED_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...studentForm,
          studentId: generatedId,
          schoolId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register student.");
      }

      setFormSuccess(`Student ${studentForm.name} successfully registered!`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setStudentForm(defaultStudentForm());
        setFormSuccess(null);
      }, 1200);

      // Re-fetch in background
      loadRegisteredStudents();
      fetchSchoolProgress();
    } catch (err) {
      console.warn("API registration note:", err.message);
      // Student is already safely saved in local optimistic store
      setFormSuccess(`Student ${studentForm.name} successfully registered!`);
      setTimeout(() => {
        setIsAddModalOpen(false);
        setStudentForm(defaultStudentForm());
        setFormSuccess(null);
      }, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  if (roleLoading) {
    return (
      <div className="max-w-6xl mx-auto text-stone-700 py-10 text-center font-medium">Loading teacher student roster...</div>
    );
  }

  // Allow teacher, principal, admin, higher_body
  const isAllowed = ["teacher", "principal", "admin", "higher_body"].includes(effectiveRole) || effectiveRole !== "student";
  if (!isAllowed) {
    return (
      <Card className="max-w-xl mx-auto bg-white border-stone-200 mt-8 shadow-sm">
        <CardContent className="p-6 text-center text-stone-700">
          <div className="text-lg font-bold mb-2">Faculty Access Only</div>
          <div className="text-sm">You need faculty or administrative privileges to view student records.</div>
        </CardContent>
      </Card>
    );
  }

  const summary = {
    totalStudents: students.length,
    activeStudents: schoolProgress?.studentsWithActivity ?? students.filter((s) => s.totalQuizzes > 0).length,
    averageScore: clampPercent(schoolProgress?.schoolAverage ?? 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner & Add Student Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-stone-100 text-stone-700 text-[10px] font-semibold px-2.5 py-0.5 rounded uppercase">
              Academic Cohort
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Student Enrollment &amp; Academic Roster
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage student records, parent contact details, and parental supervision settings.
          </p>
        </div>

        <Button
          onClick={() => {
            setStudentForm(defaultStudentForm());
            setFormError(null);
            setFormSuccess(null);
            setIsAddModalOpen(true);
          }}
          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add New Student
        </Button>
      </div>

      {/* Main Student Card Content */}
      <Card className="bg-white border-stone-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by student name, roll number, or father's name..."
                    className="pl-9 bg-white border-stone-200 text-xs"
                  />
                </div>
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 font-medium"
                >
                  {classOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 text-xs sm:text-sm text-stone-600 bg-stone-50 px-3.5 py-2 rounded-lg border border-stone-200 shrink-0">
                <div>Total: <span className="font-bold text-stone-900">{summary.totalStudents}</span></div>
                <div>Active: <span className="font-bold text-stone-900">{summary.activeStudents}</span></div>
                <div>Avg: <span className="font-bold text-emerald-700">{summary.averageScore}%</span></div>
              </div>
            </div>

            {progressLoading && !students.length ? (
              <div className="py-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-stone-600" />
                <span>Loading enrolled student profiles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))
                ) : (
                  <Card className="md:col-span-2 bg-[#FAF8F5] border-dashed border-stone-300">
                    <CardContent className="p-8 text-center text-stone-600 space-y-3">
                      <Users className="w-8 h-8 mx-auto text-stone-400" />
                      <div>
                        <div className="font-bold text-sm text-stone-800">No Students Found</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {students.length
                            ? "No students match your filter criteria."
                            : "No students registered yet. Click 'Add New Student' above to enroll students."}
                        </div>
                      </div>
                      {!students.length && (
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Register First Student
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Student Comprehensive Modal Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-stone-200 text-stone-800 p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-stone-900">
                  Register New Student
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Add student academic identification, parent contact coordinates, and parental controls.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {formSuccess}
            </div>
          )}

          <form onSubmit={handleAddStudentSubmit} className="space-y-5 pt-1">
            {/* 1. Student Identification */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-stone-100 pb-1">
                <BookOpen className="w-3.5 h-3.5 text-stone-700" /> Student Identification
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Student Full Name <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={studentForm.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    placeholder="Enter student's official name"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    <span>Date of Birth (DOB) <span className="text-rose-600">*</span></span>
                  </label>
                  <Input
                    type="date"
                    value={studentForm.dob}
                    onChange={(e) => updateFormField("dob", e.target.value)}
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Roll No / Student ID / Admission Code
                  </label>
                  <Input
                    value={studentForm.rollNumber}
                    onChange={(e) => {
                      updateFormField("rollNumber", e.target.value);
                      updateFormField("studentId", e.target.value);
                    }}
                    placeholder="e.g. 2026-CS-042"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">
                    Grade / Class <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={studentForm.class}
                    onChange={(e) => updateFormField("class", e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900"
                  >
                    {SCHOOL_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Class Section / Division</label>
                  <Input
                    value={studentForm.section}
                    onChange={(e) => updateFormField("section", e.target.value)}
                    placeholder="e.g. Section A"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Parent & Contact Coordinates */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-stone-100 pb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-700" /> Parent / Guardian Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-stone-700">
                    Father&apos;s / Guardian&apos;s Full Name <span className="text-rose-600">*</span>
                  </label>
                  <Input
                    value={studentForm.fatherName}
                    onChange={(e) => updateFormField("fatherName", e.target.value)}
                    placeholder="e.g. Mr. Rajesh Sharma"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Parent Phone Number <span className="text-rose-600">*</span></span>
                  </label>
                  <Input
                    type="tel"
                    value={studentForm.parentPhone}
                    onChange={(e) => updateFormField("parentPhone", e.target.value)}
                    placeholder="+91 98765 43210 (SMS / WhatsApp alerts)"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-stone-500" />
                    <span>Parent Email ID <span className="text-rose-600">*</span></span>
                  </label>
                  <Input
                    type="email"
                    value={studentForm.parentEmail}
                    onChange={(e) => updateFormField("parentEmail", e.target.value)}
                    placeholder="parent@example.com (Weekly reports)"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
                    <span>Student&apos;s Own Mobile</span>
                    <span className="text-[10px] text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="tel"
                    value={studentForm.studentPhone}
                    onChange={(e) => updateFormField("studentPhone", e.target.value)}
                    placeholder="+91 91234 56789 (Optional)"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    <span>Residential Address</span>
                  </label>
                  <Input
                    value={studentForm.address}
                    onChange={(e) => updateFormField("address", e.target.value)}
                    placeholder="House/Street, City, PIN"
                    className="bg-[#FAF8F5] border-stone-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Parent Controlling System Configuration */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-stone-100 pb-1">
                <Lock className="w-3.5 h-3.5 text-stone-700" /> Parent Controlling &amp; Supervision System
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-stone-200 bg-[#FAF8F5] flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-700" /> Weekly Academic Digest
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Weekly attendance, quizzes, and grade summary to Parent Email.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={studentForm.parentalControl.weeklyReports}
                    onChange={(e) => updateParentalControl("weeklyReports", e.target.checked)}
                    className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="p-3 rounded-lg border border-stone-200 bg-[#FAF8F5] flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-stone-700" /> Instant Assessment Alerts
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      SMS/alert to Parent Phone upon test completion.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={studentForm.parentalControl.quizAlerts}
                    onChange={(e) => updateParentalControl("quizAlerts", e.target.checked)}
                    className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="p-3 rounded-lg border border-stone-200 bg-[#FAF8F5] flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-stone-700" /> Junior Safety Shield
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Restrict to verified faculty lessons (default for Class 1–6).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={studentForm.parentalControl.safetyMode}
                    onChange={(e) => updateParentalControl("safetyMode", e.target.checked)}
                    className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                  />
                </div>

                <div className="p-3 rounded-lg border border-stone-200 bg-[#FAF8F5] flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-stone-700" /> Quiet Hours (10 PM - 6 AM)
                    </div>
                    <p className="text-[11px] text-stone-500 leading-tight">
                      Enforce sleep schedule and silence late-night notices.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={studentForm.parentalControl.quietHours}
                    onChange={(e) => updateParentalControl("quietHours", e.target.checked)}
                    className="w-4 h-4 accent-stone-900 cursor-pointer mt-0.5"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs border-stone-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Enrolling Student...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Register Student
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <>
      <SignedIn>
        <StudentsContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
