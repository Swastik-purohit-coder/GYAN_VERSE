"use client";

import { useState, useMemo } from "react";
import { useSkillCourses } from "@/hooks/useDashboardFeatures";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { Textarea } from "@teacher/components/ui/textarea";
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
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Award,
  Users,
  Clock,
  Layers,
  Code,
  Cpu,
  Palette,
  TrendingUp,
  CheckCircle2,
  Filter,
  Flame,
  ArrowUpRight,
} from "lucide-react";

export default function SkillCoursesPage() {
  const { user } = useUser();
  const { courses, loading, addCourse } = useSkillCourses();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ai_tech",
    level: "Beginner",
    duration_weeks: 4,
    modules_count: 6,
    target_class: "Class 8–12",
    instructor_name: user?.fullName || "Prof. Arvind Sharma",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await addCourse({
        ...formData,
        instructor_name: user?.fullName || "Faculty In-Charge",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "ai_tech",
        level: "Beginner",
        duration_weeks: 4,
        modules_count: 6,
        target_class: "Class 8–12",
        instructor_name: user?.fullName || "Prof. Arvind Sharma",
      });
    } catch (err) {
      console.error("Failed to create skill course:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || c.category === selectedCategory;
      const matchesLvl = selectedLevel === "all" || c.level === selectedLevel;
      return matchesSearch && matchesCat && matchesLvl;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const totalEnrolled = courses.reduce((acc, c) => acc + (c.enrolled_count || 0), 0);
    const totalCertified = courses.reduce((acc, c) => acc + (c.certified_count || 0), 0);
    const avgCompletion = totalCourses
      ? Math.round(courses.reduce((acc, c) => acc + (c.completion_rate || 75), 0) / totalCourses)
      : 0;

    return { totalCourses, totalEnrolled, totalCertified, avgCompletion };
  }, [courses]);

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "ai_tech":
        return <Cpu className="w-4 h-4 text-violet-600" />;
      case "coding":
        return <Code className="w-4 h-4 text-indigo-600" />;
      case "design":
        return <Palette className="w-4 h-4 text-pink-600" />;
      case "leadership":
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case "Advanced":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">Advanced Track</Badge>;
      case "Intermediate":
        return <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">Intermediate</Badge>;
      default:
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Foundational / Beginner</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-950 via-violet-900 to-purple-950 text-white p-6 rounded-2xl shadow-xl border border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> 21st-Century Skill Development Hub
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skill Micro-Courses & Certifications</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Empower students with practical competencies in AI, Robotics, Coding, UI Design, and Financial Literacy alongside academic curriculum.
          </p>
        </div>

        {/* Create Course Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto">
              <Plus className="w-4 h-4" /> Launch Skill Micro-Course
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Design New Skill Development Track
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Create a modular skill course with hands-on milestone projects and verifiable certificate badges.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateCourse} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Course Title *</label>
                <Input
                  placeholder="e.g., Applied Generative AI & Prompt Engineering"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Skill Domain</label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai_tech">AI & Machine Learning</SelectItem>
                      <SelectItem value="coding">Software & Web Coding</SelectItem>
                      <SelectItem value="design">UI/UX & Creative Media</SelectItem>
                      <SelectItem value="robotics">Robotics & IoT</SelectItem>
                      <SelectItem value="leadership">Leadership & Public Speaking</SelectItem>
                      <SelectItem value="finance">Financial Literacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Difficulty Level</label>
                  <Select
                    value={formData.level}
                    onValueChange={(val) => handleInputChange("level", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner / Foundational</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced Mastery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Grade Span</label>
                  <Input
                    placeholder="Class 8–12"
                    value={formData.target_class}
                    onChange={(e) => handleInputChange("target_class", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Duration (Weeks)</label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    value={formData.duration_weeks}
                    onChange={(e) => handleInputChange("duration_weeks", Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Number of Modules</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.modules_count}
                    onChange={(e) => handleInputChange("modules_count", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Course Overview & Learning Outcomes</label>
                <Textarea
                  placeholder="Outline key learning outcomes, hands-on lab projects, and certification criteria..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {isSubmitting ? "Publishing..." : "Launch Skill Track"}
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
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Tracks</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalCourses}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
              <div className="text-2xl font-bold text-violet-600 mt-1">{stats.totalEnrolled}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Certificates Issued</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.totalCertified}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Completion</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.avgCompletion}%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search skill track, instructor, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter By:
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-44 text-xs h-8">
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="ai_tech">AI & Machine Learning</SelectItem>
              <SelectItem value="coding">Coding & Web Dev</SelectItem>
              <SelectItem value="design">UI/UX & Design</SelectItem>
              <SelectItem value="robotics">Robotics & IoT</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-32 text-xs h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="bg-white border-slate-200/80 hover:shadow-lg transition-all duration-200 flex flex-col">
            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold">
                    {getCategoryIcon(course.category)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getLevelBadge(course.level)}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Progress & Modules meta */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Cohort Progress</span>
                  <span className="font-bold text-slate-800">{course.completion_rate || 78}%</span>
                </div>
                <Progress value={course.completion_rate || 78} className="h-1.5 bg-slate-100" />

                <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Duration</div>
                    <div className="font-bold text-slate-800 mt-0.5">{course.duration_weeks || 4}w</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Modules</div>
                    <div className="font-bold text-slate-800 mt-0.5">{course.modules_count || 6}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Enrolled</div>
                    <div className="font-bold text-indigo-600 mt-0.5">{course.enrolled_count || 40}</div>
                  </div>
                </div>
              </div>

              {/* Footer details */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-500 truncate">
                  Instructor: <span className="font-semibold text-slate-700">{course.instructor_name}</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-600" /> Certificate
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
