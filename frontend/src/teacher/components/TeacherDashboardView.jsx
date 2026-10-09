"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import { useAdminOverview, useNoticeboard, useCompetitions } from "@/hooks/useDashboardFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Progress } from "@teacher/components/ui/progress";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Users,
  GraduationCap,
  BookOpen,
  LineChart as LineChartIcon,
  TrendingUp,
  ChevronRight,
  Bell,
  Sparkles,
  Trophy,
  ShieldCheck,
  Building2,
  Layers,
  UserCheck,
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, change, subtext, color = "indigo" }) => {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  };

  return (
    <Card className="bg-white/95 border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${colorMap[color] || colorMap.indigo}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-500 text-xs font-semibold tracking-wide uppercase">{label}</div>
              <div className="text-slate-900 font-bold text-2xl mt-0.5">{value}</div>
            </div>
          </div>
          {change && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
              {change}
            </Badge>
          )}
        </div>
        {subtext && <div className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">{subtext}</div>}
      </CardContent>
    </Card>
  );
};

export default function TeacherDashboardView({ defaultView = "principal", forcedRole = null }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const userMetadataRole = forcedRole || user?.unsafeMetadata?.role;
  const isHigherAuthority = ["principal", "admin", "higher_body"].includes(userMetadataRole);

  const [viewMode, setViewMode] = useState(defaultView || (isHigherAuthority ? "principal" : "teacher"));
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");

  const { overview, faculty, loading: adminLoading } = useAdminOverview();
  const { notices } = useNoticeboard();
  const { competitions } = useCompetitions();

  useEffect(() => {
    if (forcedRole) {
      setViewMode(forcedRole === "principal" ? "principal" : "teacher");
      return;
    }
    if (userMetadataRole) {
      if (["principal", "admin", "higher_body"].includes(userMetadataRole)) {
        setViewMode("principal");
      } else if (userMetadataRole === "teacher") {
        setViewMode("teacher");
      }
    } else if (user?.id) {
      fetchUserRole(user.id).then((doc) => {
        const r = typeof doc === "string" ? doc : doc?.role;
        if (r === "principal" || r === "higher_body" || r === "admin") {
          setViewMode("principal");
        } else {
          setViewMode("teacher");
        }
      });
    }
  }, [userMetadataRole, user?.id, forcedRole]);

  const classData = useMemo(() => {
    if (!overview?.classPerformance) return [];
    if (selectedClassFilter === "all") return overview.classPerformance;
    return overview.classPerformance.filter((c) => c.class === selectedClassFilter);
  }, [overview?.classPerformance, selectedClassFilter]);

  const monthlyTrendData = useMemo(() => {
    return overview?.monthlyTrends || [
      { month: "May", averageScore: 76, activeLearners: 260 },
      { month: "Jun", averageScore: 78, activeLearners: 280 },
      { month: "Jul", averageScore: 80, activeLearners: 295 },
      { month: "Aug", averageScore: 81, activeLearners: 305 },
      { month: "Sep", averageScore: 82, activeLearners: 315 },
      { month: "Oct", averageScore: 85, activeLearners: 318 },
    ];
  }, [overview?.monthlyTrends]);

  const subjectProficiencyData = useMemo(() => {
    return overview?.subjectProficiency || [
      { subject: "Mathematics", proficiency: 83 },
      { subject: "Physics & Chemistry", proficiency: 86 },
      { subject: "Computer Science & AI", proficiency: 91 },
      { subject: "Biology", proficiency: 85 },
      { subject: "Communication", proficiency: 88 },
    ];
  }, [overview?.subjectProficiency]);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  if (!isSignedIn && isLoaded && !isOffline) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Perspective Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 py-1 font-semibold text-xs">
                🏛️ {overview?.institutionName || "Gyanaratan STEM Academy"}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 font-semibold text-xs">
                Academic Year {overview?.academicYear || "2026–2027"}
              </Badge>
              {viewMode === "principal" && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1 font-semibold text-xs">
                  Principal Executive View
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {viewMode === "principal" ? "Executive & Higher Body Command Center" : "Faculty STEM & Student Management"}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              {viewMode === "principal"
                ? "Institution-wide governance: monitor faculty delivery, student cohort progress, publish circulars, and steer competition & skill initiatives."
                : "Manage your assigned STEM curriculum, monitor individual student scores, conduct peer sub-groups, and evaluate assignments."}
            </p>
          </div>

          {/* Perspective Toggle (Principal / Higher Body vs Teacher) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <span className="text-xs font-semibold text-slate-300 px-2">Perspective:</span>
            <div className="flex gap-1.5 w-full sm:w-auto">
              <Button
                size="sm"
                variant={viewMode === "principal" ? "default" : "ghost"}
                onClick={() => setViewMode("principal")}
                className={`text-xs font-semibold ${
                  viewMode === "principal"
                    ? "bg-violet-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 mr-1.5" /> Higher Body / Principal
              </Button>
              <Button
                size="sm"
                variant={viewMode === "teacher" ? "default" : "ghost"}
                onClick={() => setViewMode("teacher")}
                className={`text-xs font-semibold ${
                  viewMode === "teacher"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-700"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 mr-1.5" /> Classroom Teacher
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Enrolled Students"
          value={overview?.totalStudents || 342}
          change="+8.4% YoY"
          subtext={`${overview?.activeStudents || 318} Active in Daily Learning`}
          color="indigo"
        />
        <StatCard
          icon={UserCheck}
          label="Faculty & Teachers"
          value={overview?.totalTeachers || 18}
          change="100% Active"
          subtext="12 Classes (Grade 1–12)"
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Average Score Index"
          value={`${overview?.overallAverageScore || 82.4}%`}
          change="+3.2% vs Last Term"
          subtext={`Attendance Rate: ${overview?.attendanceRate || 94.8}%`}
          color="violet"
        />
        <StatCard
          icon={Trophy}
          label="Competitions & Skills"
          value={overview?.enrolledSkillStudents || 236}
          change="2 Active Contests"
          subtext={`${overview?.activePeerGroups || 14} Peer Study Sub-Groups`}
          color="amber"
        />
      </div>

      {/* Quick Access Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/teacher/noticeboard">
          <Card className="bg-white/95 border-slate-200 hover:border-violet-500 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-violet-700">Noticeboard</div>
                  <div className="text-xs text-slate-500">Publish announcements &amp; circulars</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/groups">
          <Card className="bg-white/95 border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">Peer Sub-Groups</div>
                  <div className="text-xs text-slate-500">Student squads &amp; team channels</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/skills">
          <Card className="bg-white/95 border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">Skill Courses</div>
                  <div className="text-xs text-slate-500">AI, Robotics, Debate &amp; Finance</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/teacher/competitions">
          <Card className="bg-white/95 border-slate-200 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-amber-700">Monthly Contests</div>
                  <div className="text-xs text-slate-500">Hackathons, Olympiads &amp; Medals</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Analytics: Progress Trends & Subject Proficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Longitudinal Learning Velocity */}
        <Card className="lg:col-span-7 bg-white/95 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-violet-600" />
                Academic Progress &amp; Score Trajectory
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Month-by-month average score and student engagement velocity</p>
            </div>
            <Badge variant="outline" className="text-xs text-slate-600">6-Month Trend</Badge>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrendData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis domain={[60, 100]} stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", border: "none" }}
                    formatter={(val) => [`${val}%`, "Average Score"]}
                  />
                  <Area type="monotone" dataKey="averageScore" stroke="#7c3aed" strokeWidth={3} fill="url(#scoreGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Right 5 Columns: Subject Performance Distribution */}
        <Card className="lg:col-span-5 bg-white/95 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Subject Proficiency Breakdown
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Weighted mastery level across STEM disciplines</p>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {subjectProficiencyData.map((item) => (
              <div key={item.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{item.subject}</span>
                  <span className="text-emerald-600 font-bold">{item.proficiency}%</span>
                </div>
                <Progress value={item.proficiency} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Class Level Performance Table & Realtime Administrative Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Performance Table (8 cols) */}
        <Card className="lg:col-span-8 bg-white/95 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Class-by-Class Performance Index
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Compare scores, quiz attempts, and syllabus completion across grades</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700"
              >
                <option value="all">All Grades (6–12)</option>
                {overview?.classPerformance?.map((c) => (
                  <option key={c.class} value={c.class}>{c.class}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Class</th>
                    <th className="pb-3">Enrolled</th>
                    <th className="pb-3">Avg Score</th>
                    <th className="pb-3">Quizzes Taken</th>
                    <th className="pb-3">Completion Rate</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classData.map((item) => (
                    <tr key={item.class} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        {item.class}
                      </td>
                      <td className="py-3 text-slate-700">{item.students} Students</td>
                      <td className="py-3">
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {item.avgScore}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-700">{item.quizzesTaken}</td>
                      <td className="py-3">
                        <div className="w-28">
                          <Progress value={item.completionRate} className="h-1.5" />
                          <span className="text-[10px] text-slate-500 mt-0.5 inline-block">{item.completionRate}% complete</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <Link href="/teacher/students">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-50">
                            Drill Down <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Administrative Notifications & Live Alerts (4 cols) */}
        <Card className="lg:col-span-4 bg-white/95 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 text-base font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Latest Circulars &amp; Alerts
            </CardTitle>
            <Link href="/teacher/noticeboard" className="text-xs text-violet-700 hover:underline font-semibold">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3.5">
            {notices.slice(0, 3).map((notice) => (
              <div key={notice.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    className={`text-[10px] uppercase font-bold ${
                      notice.priority === "urgent"
                        ? "bg-rose-100 text-rose-700 border-rose-200"
                        : notice.priority === "high"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-violet-100 text-violet-700 border-violet-200"
                    }`}
                  >
                    {notice.category}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{notice.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{notice.content}</p>
              </div>
            ))}

            <Link href="/teacher/noticeboard">
              <Button variant="outline" className="w-full text-xs font-semibold mt-2 border-dashed border-slate-300 hover:border-violet-500">
                + Create New School Notice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
