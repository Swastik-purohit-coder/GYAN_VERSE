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
import { clampPercent, formatLastActivity, initials } from "@/lib/studentFormat";

function StudentCard({ student }) {
  const progress = clampPercent(student.averageScore);
  const badgeValue = student.bestScore != null ? clampPercent(student.bestScore) : progress;
  return (
    <Card className="bg-white/95 border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{initials(student.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-900 truncate">{student.name}</div>
              <Badge className="bg-violet-600 text-white">{badgeValue}%</Badge>
            </div>
            <div className="text-xs text-slate-500 mb-2">{student.className}</div>
            <div className="text-sm text-slate-700 flex items-center gap-6">
              <span>Quizzes <b>{student.totalQuizzes}</b></span>
              <span>Avg Score <span className="text-emerald-600 font-semibold">{progress}%</span></span>
            </div>
            <div className="text-sm mt-1">Last Activity <b>{formatLastActivity(student.lastActivity)}</b></div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm" className="bg-white">
                <Link href={`/teacher/students/${student.id}`}>View details &amp; report</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentsContent() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [roleError, setRoleError] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("All Classes");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) {
      setRoleDoc(null);
      setRoleError(null);
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    setRoleError(null);
    fetchUserRole(user.id)
      .then((doc) => {
        if (!active) return;
        setRoleDoc(doc);
      })
      .catch((error) => {
        if (!active) return;
        setRoleDoc(null);
        setRoleError(error?.message || null);
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
    error: progressError,
    fetchSchoolProgress,
  } = useSchoolProgress(schoolId);

  const handleRealtimeQuiz = useCallback(() => {
    if (!schoolId) return;
    fetchSchoolProgress();
  }, [fetchSchoolProgress, schoolId]);

  useRealtimeQuizProgress({ schoolId, onQuizEvent: handleRealtimeQuiz });

  const students = useMemo(() => {
    if (!schoolProgress?.students) return [];
    return schoolProgress.students.map((student) => ({
      id: student.studentId || student.userId || student.id,
      name: student.name || "Unnamed Student",
      className: student.class || "Unassigned Class",
      totalQuizzes: student.totalQuizzes ?? 0,
      averageScore: typeof student.averageScore === "number" ? student.averageScore : 0,
      bestScore: typeof student.bestScore === "number" ? student.bestScore : null,
      lastActivity: student.lastActivity || null,
    }));
  }, [schoolProgress?.students]);

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
        const matchesQuery = !query || student.name.toLowerCase().includes(query) || student.className.toLowerCase().includes(query);
        const matchesClass = selectedClass === "All Classes" || student.className === selectedClass;
        return matchesQuery && matchesClass;
      })
      .sort((a, b) => clampPercent(b.averageScore) - clampPercent(a.averageScore));
  }, [students, search, selectedClass]);

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
    totalStudents: schoolProgress?.totalStudents ?? students.length,
    activeStudents: schoolProgress?.studentsWithActivity ?? 0,
    averageScore: clampPercent(schoolProgress?.schoolAverage ?? 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-stone-900 font-bold text-2xl tracking-tight">Enrolled Students &amp; Performance Roster</h1>
        <p className="text-xs text-stone-500 mt-0.5">Track individual progress, quiz completion, and academic performance</p>
      </div>

      <Card className="bg-white border-stone-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students by name or class"
                  className="bg-white border-stone-200"
                />
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="bg-white border border-stone-200 rounded-md px-3 py-2 text-sm text-stone-800"
                >
                  {classOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 text-xs sm:text-sm text-stone-600 bg-stone-50 px-3.5 py-1.5 rounded-lg border border-stone-200">
                <div>Total: <span className="font-semibold text-stone-900">{summary.totalStudents}</span></div>
                <div>Active: <span className="font-semibold text-stone-900">{summary.activeStudents}</span></div>
                <div>Avg: <span className="font-semibold text-emerald-700">{summary.averageScore}%</span></div>
              </div>
            </div>

            {progressLoading && !students.length ? (
              <div className="py-12 text-center text-stone-500">Loading enrolled students...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <StudentCard key={student.id} student={student} />
                  ))
                ) : (
                  <Card className="md:col-span-2 bg-stone-50/60 border-dashed border-stone-300">
                    <CardContent className="p-8 text-center text-stone-600 space-y-1">
                      <div className="font-semibold text-sm text-stone-800">No Student Records Found</div>
                      <div className="text-xs text-stone-500">
                        {students.length
                          ? "No students match your filter criteria."
                          : "Students enrolled in this institution will automatically appear here."}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
