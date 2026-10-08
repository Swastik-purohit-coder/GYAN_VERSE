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
  GraduationCap,
  ShieldCheck,
  Globe,
  Lock,
} from "lucide-react";
import { SOURCE_TYPES } from "@/lib/resourceAccess";

export default function SkillCoursesPage() {
  const { user } = useUser();
  const { courses, loading, addCourse } = useSkillCourses();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "ai_tech",
    level: "Beginner",
    source_type: "teacher",
    author_name: "Prof. Arvind Sharma",
    author_role: "Lead STEM Faculty",
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
        instructor_name: formData.author_name || user?.fullName || "Faculty In-Charge",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "ai_tech",
        level: "Beginner",
        source_type: "teacher",
        author_name: "Prof. Arvind Sharma",
        author_role: "Lead STEM Faculty",
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
        c.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.author_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "all" || c.category === selectedCategory;
      const matchesLvl = selectedLevel === "all" || c.level === selectedLevel;
      const matchesSrc = selectedSource === "all" || (c.source_type || "teacher") === selectedSource;

      return matchesSearch && matchesCat && matchesLvl && matchesSrc;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedSource]);

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
      case "AI & Tech":
        return <Cpu className="w-4 h-4 text-violet-600" />;
      case "coding":
      case "Robotics & IoT":
        return <Code className="w-4 h-4 text-indigo-600" />;
      case "design":
      case "Design":
        return <Palette className="w-4 h-4 text-pink-600" />;
      case "leadership":
      case "Public Speaking":
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Multi-Source Skill Certification Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Skill Micro-Courses &amp; Tracks</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Equip students with future-ready skills in AI, Public Speaking, Robotics, Finance, and Design from Faculty, Alumni Champions, and Senior Scholars.
            </p>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-lg shadow-violet-600/30 shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Skill Track
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/95 border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-50 text-violet-700 rounded-xl border border-violet-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Skill Tracks</div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalCourses}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/95 border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Enrolled</div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalEnrolled || 236}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/95 border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Certificates Awarded</div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalCertified || 89}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/95 border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Avg Completion Rate</div>
              <div className="text-2xl font-bold text-slate-900">{stats.avgCompletion || 78}%</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/95 border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill courses, instructors, topics..."
              className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <Button
              size="sm"
              variant={selectedSource === "all" ? "default" : "outline"}
              onClick={() => setSelectedSource("all")}
              className={`text-xs h-8 ${selectedSource === "all" ? "bg-slate-900 text-white" : "border-slate-200 text-slate-700"}`}
            >
              All Sources
            </Button>
            <Button
              size="sm"
              variant={selectedSource === "teacher" ? "default" : "outline"}
              onClick={() => setSelectedSource("teacher")}
              className={`text-xs h-8 ${selectedSource === "teacher" ? "bg-emerald-700 text-white" : "border-emerald-200 text-emerald-800 bg-emerald-50/50"}`}
            >
              Faculty
            </Button>
            <Button
              size="sm"
              variant={selectedSource === "alumni" ? "default" : "outline"}
              onClick={() => setSelectedSource("alumni")}
              className={`text-xs h-8 ${selectedSource === "alumni" ? "bg-violet-700 text-white" : "border-violet-200 text-violet-800 bg-violet-50/50"}`}
            >
              Alumni
            </Button>
            <Button
              size="sm"
              variant={selectedSource === "senior" ? "default" : "outline"}
              onClick={() => setSelectedSource("senior")}
              className={`text-xs h-8 ${selectedSource === "senior" ? "bg-indigo-700 text-white" : "border-indigo-200 text-indigo-800 bg-indigo-50/50"}`}
            >
              Senior Peers
            </Button>
            <Button
              size="sm"
              variant={selectedSource === "retired_teacher" ? "default" : "outline"}
              onClick={() => setSelectedSource("retired_teacher")}
              className={`text-xs h-8 ${selectedSource === "retired_teacher" ? "bg-amber-700 text-white" : "border-amber-200 text-amber-800 bg-amber-50/50"}`}
            >
              Retired Faculty
            </Button>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const courseSource = course.source_type || "teacher";
          const sourceDef = SOURCE_TYPES[courseSource] || SOURCE_TYPES.teacher;

          return (
            <Card key={course.id} className="bg-white/95 border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${sourceDef.badgeColor}`}>
                    {sourceDef.badgeText}
                  </Badge>
                  <span className="text-[11px] text-slate-500 font-semibold">{course.level || "Beginner"}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="p-5 pt-3 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-3 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {course.duration_hours || 10} Hours
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {course.enrolled_count || 45} Students
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {course.author_name || course.instructor_name}
                  </div>
                  <Badge variant="outline" className="ml-auto text-[10px] text-slate-600">
                    Grade {course.target_grade_min || 1}–{course.target_grade_max || 12}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Course Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white text-slate-900 p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Create New Skill Micro-Course Track
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Launch a 21st-century skill course with contributor source attribution and target grade eligibility.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCourse} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course Title *</label>
              <Input
                required
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g. Applied AI & Prompt Engineering Masterclass"
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contributor Track *</label>
                <select
                  value={formData.source_type}
                  onChange={(e) => handleInputChange("source_type", e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-slate-800 font-semibold"
                >
                  <option value="teacher">🏫 Official Faculty (Grades 1–12)</option>
                  <option value="alumni">🎓 Alumni Mentor (Grade 7+)</option>
                  <option value="senior">⭐ Senior Peer Scholar (Grade 7+)</option>
                  <option value="retired_teacher">🎖️ Retired Veteran Faculty (Grade 7+)</option>
                  <option value="community">🌐 Community Expert (Grade 7+)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category Track</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-slate-800 font-medium"
                >
                  <option value="ai_tech">AI &amp; Technology</option>
                  <option value="coding">Robotics &amp; IoT</option>
                  <option value="leadership">Public Speaking &amp; Debate</option>
                  <option value="finance">Financial Literacy</option>
                  <option value="design">UI/UX &amp; Product Design</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Instructor / Contributor Name *</label>
                <Input
                  required
                  value={formData.author_name}
                  onChange={(e) => handleInputChange("author_name", e.target.value)}
                  placeholder="e.g. Dr. K. S. Ramanathan"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Instructor Role / Affiliation</label>
                <Input
                  value={formData.author_role}
                  onChange={(e) => handleInputChange("author_role", e.target.value)}
                  placeholder="e.g. Alumni | AI Research Scientist @ DeepMind"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Skill Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange("level", e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-slate-800 font-medium"
                >
                  <option value="Beginner">Beginner / Foundational</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced Track</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duration (Weeks / Hours)</label>
                <Input
                  value={formData.duration_weeks}
                  onChange={(e) => handleInputChange("duration_weeks", e.target.value)}
                  placeholder="4 weeks (12 hours)"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Course Description &amp; Learning Outcomes</label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Detail what students will master in this skill track..."
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                {isSubmitting ? "Creating..." : "Launch Skill Track"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
