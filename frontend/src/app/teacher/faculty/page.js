"use client";

import { useState, useMemo } from "react";
import { useAdminOverview } from "@/hooks/useDashboardFeatures";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { Avatar, AvatarFallback } from "@teacher/components/ui/avatar";
import { Progress } from "@teacher/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@teacher/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@teacher/components/ui/select";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Search,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Mail,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Phone,
  GraduationCap,
  Calendar,
  Layers,
  Filter,
  Lock,
  ArrowLeft,
} from "lucide-react";

export default function FacultyManagementPage() {
  const { user } = useUser();
  const userRole = user?.unsafeMetadata?.role || "principal";
  const isHigherBody = ["principal", "admin", "higher_body"].includes(userRole);

  const { faculty: initialFaculty, loading } = useAdminOverview();
  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Fallback / initial faculty dataset if API is loading or empty
  const defaultFaculty = useMemo(
    () => [
      {
        id: "fac_1",
        name: "Prof. Arvind Sharma",
        email: "arvind.sharma@gyanaratan.edu",
        designation: "Head of Computer Science & Robotics",
        department: "Computer Science",
        classes_assigned: ["Class 9", "Class 10", "Class 11"],
        students_count: 148,
        syllabus_progress: 92,
        avg_student_score: 86.4,
        status: "active",
        rating: 4.9,
      },
      {
        id: "fac_2",
        name: "Dr. Meenakshi Sundaram",
        email: "m.sundaram@gyanaratan.edu",
        designation: "Senior Lead, Mathematics & Olympiad Coach",
        department: "Mathematics",
        classes_assigned: ["Class 8", "Class 9", "Class 10"],
        students_count: 132,
        syllabus_progress: 88,
        avg_student_score: 82.1,
        status: "active",
        rating: 4.8,
      },
      {
        id: "fac_3",
        name: "Mrs. Sunita Rao",
        email: "sunita.rao@gyanaratan.edu",
        designation: "Senior Faculty, Physical & Life Sciences",
        department: "Science",
        classes_assigned: ["Class 6", "Class 7", "Class 8"],
        students_count: 110,
        syllabus_progress: 95,
        avg_student_score: 89.0,
        status: "active",
        rating: 4.9,
      },
      {
        id: "fac_4",
        name: "Mr. Rajesh Sengupta",
        email: "rajesh.sengupta@gyanaratan.edu",
        designation: "Lecturer, Social Sciences & Humanities",
        department: "Humanities",
        classes_assigned: ["Class 9", "Class 10"],
        students_count: 95,
        syllabus_progress: 78,
        avg_student_score: 79.5,
        status: "active",
        rating: 4.6,
      },
      {
        id: "fac_5",
        name: "Dr. Ananya Mukherjee",
        email: "ananya.m@gyanaratan.edu",
        designation: "Head of Languages & Communication",
        department: "Languages",
        classes_assigned: ["Class 6", "Class 7", "Class 8", "Class 9"],
        students_count: 160,
        syllabus_progress: 84,
        avg_student_score: 84.8,
        status: "in_meeting",
        rating: 4.7,
      },
    ],
    []
  );

  const currentFaculty = (facultyList.length > 0 ? facultyList : (initialFaculty?.length > 0 ? initialFaculty : defaultFaculty));

  // Form State for new faculty member
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    department: "Computer Science",
    classes_assigned: "Class 10",
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const newMember = {
      id: `fac_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      designation: formData.designation || "Subject Faculty",
      department: formData.department,
      classes_assigned: formData.classes_assigned.split(",").map((s) => s.trim()),
      students_count: 45,
      syllabus_progress: 50,
      avg_student_score: 75.0,
      status: "active",
      rating: 5.0,
    };

    setFacultyList([newMember, ...currentFaculty]);
    setIsInviteOpen(false);
    setFormData({
      name: "",
      email: "",
      designation: "",
      department: "Computer Science",
      classes_assigned: "Class 10",
    });
  };

  const filteredFaculty = useMemo(() => {
    return currentFaculty.filter((fac) => {
      const matchesSearch =
        fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fac.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "all" || fac.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [currentFaculty, searchQuery, selectedDept]);

  const stats = useMemo(() => {
    const total = currentFaculty.length;
    const avgScore = (
      currentFaculty.reduce((acc, f) => acc + (f.avg_student_score || 80), 0) / (total || 1)
    ).toFixed(1);
    const totalStudents = currentFaculty.reduce((acc, f) => acc + (f.students_count || 0), 0);
    const avgProgress = Math.round(
      currentFaculty.reduce((acc, f) => acc + (f.syllabus_progress || 80), 0) / (total || 1)
    );

    return { total, avgScore, totalStudents, avgProgress };
  }, [currentFaculty]);

  if (!isHigherBody) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <Card className="bg-white border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Executive Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Faculty and Department Management is reserved for the Principal, Academic Deans, and Executive Leadership.
          </p>
          <div className="pt-2">
            <Link
              href="/teacher"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Teacher Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-violet-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" /> Higher Authority & Principal Control
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Faculty & Academic Staff Management</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Oversee department heads, monitor curriculum coverage velocity, review class score benchmarks, and allocate teaching assignments.
          </p>
        </div>

        {/* Invite Dialog Trigger */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto">
              <Plus className="w-4 h-4" /> Add / Onboard Faculty
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" /> Onboard New Faculty Member
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Register teacher profile, assign subject department, and configure class access.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvite} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                <Input
                  placeholder="e.g., Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Official Email *</label>
                <Input
                  type="email"
                  placeholder="teacher@gyanaratan.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Designation / Role Title</label>
                <Input
                  placeholder="e.g., Senior Lecturer, Mathematics"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <Select
                    value={formData.department}
                    onValueChange={(val) => setFormData({ ...formData, department: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Science">Science & Tech</SelectItem>
                      <SelectItem value="Humanities">Humanities</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Assigned Classes</label>
                  <Input
                    placeholder="Class 9, Class 10"
                    value={formData.classes_assigned}
                    onChange={(e) => setFormData({ ...formData, classes_assigned: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Add Faculty
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Faculty</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Students Under Mentorship</div>
              <div className="text-2xl font-bold text-violet-600 mt-1">{stats.totalStudents}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Student Score</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.avgScore}%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Syllabus Coverage</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.avgProgress}%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search faculty name, designation, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Department:
          </div>
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="w-48 text-xs h-8">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Computer Science">Computer Science</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Science">Science & Tech</SelectItem>
              <SelectItem value="Humanities">Humanities</SelectItem>
              <SelectItem value="Languages">Languages</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFaculty.map((teacher) => (
          <Card key={teacher.id} className="bg-white border-slate-200/80 hover:shadow-md transition-all duration-200">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-indigo-100 shadow-sm">
                    <AvatarFallback className="bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-sm">
                      {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{teacher.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{teacher.designation}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {teacher.department}
                    </span>
                  </div>
                </div>

                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  {teacher.status === "active" ? "Active" : "In Session"}
                </Badge>
              </div>

              {/* Progress & Performance */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Curriculum Completion</span>
                  <span className="font-bold text-slate-800">{teacher.syllabus_progress}%</span>
                </div>
                <Progress value={teacher.syllabus_progress} className="h-1.5 bg-slate-100" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Classes</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                    {Array.isArray(teacher.classes_assigned) ? teacher.classes_assigned.join(", ") : teacher.classes_assigned}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Avg Class Score</div>
                  <div className="text-xs font-bold text-emerald-600 mt-0.5">
                    {teacher.avg_student_score}%
                  </div>
                </div>
              </div>

              {/* Actions & Contact */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {teacher.students_count} Students
                </span>

                <a
                  href={`mailto:${teacher.email}`}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
