"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Input } from "@teacher/components/ui/input";
import { Textarea } from "@teacher/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@teacher/components/ui/select";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@teacher/components/ui/dialog";
import {
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  Globe,
  PlusCircle,
  Pencil,
  Trash2,
  Video,
  FileText,
  Search,
  Filter,
  Play,
  Clock,
  Eye,
  Lock,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import InbuiltVideoPlayer from "@/components/InbuiltVideoPlayer";
import {
  SOURCE_TYPES,
  SEED_EDUCATIONAL_MATERIALS,
  parseStudentGrade,
  isGradeUpTo6,
} from "@/lib/resourceAccess";

function defaultFormState() {
  return {
    title: "",
    description: "",
    type: "video",
    source_type: "teacher",
    author_name: "Mrs. Ananya Sen",
    author_role: "Senior Math Faculty",
    duration: "20 mins",
    target_grade_min: 1,
    target_grade_max: 12,
    url: "https://www.youtube.com/watch?v=NybHckSEQBI",
    body: "",
    tags: "Math, STEM, Conceptual",
  };
}

export default function TeacherContentPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [materials, setMaterials] = useState(SEED_EDUCATIONAL_MATERIALS);
  const [loading, setLoading] = useState(false);
  const [activePlayerItem, setActivePlayerItem] = useState(null);

  const [form, setForm] = useState(defaultFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");

  // Student Perspective Simulator
  const [simulatorGrade, setSimulatorGrade] = useState("all"); // 'all' | 'class_5' | 'class_9'

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    fetchUserRole(user.id).then((doc) => {
      if (doc) setRoleDoc(doc);
    });
  }, [user, isLoaded]);

  // Load Content from API
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMaterials(data);
        } else {
          setMaterials(SEED_EDUCATIONAL_MATERIALS);
        }
      }
    } catch (e) {
      console.warn("Failed to load content from API, using fallback:", e);
      setMaterials(SEED_EDUCATIONAL_MATERIALS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      const sanitizedTags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        createdBy: user?.id || "faculty_user",
        tags: sanitizedTags,
      };

      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadMaterials();
        setIsDialogOpen(false);
        setForm(defaultFormState());
      }
    } catch (err) {
      console.error("Save material error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = useMemo(() => {
    return materials.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const itemSource = item.source_type || "teacher";
      const matchesSource = selectedSource === "all" || itemSource === selectedSource;

      return matchesSearch && matchesSource;
    });
  }, [materials, searchTerm, selectedSource]);

  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  if (!isSignedIn && isLoaded && !isOffline) {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    return null;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 py-1 font-semibold text-xs">
                🏛️ Institutional Resource Repository
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 font-semibold text-xs">
                Multi-Contributor Architecture
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Educational Material &amp; Video Lecture Hub
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Publish and tag educational resources across 5 contributor tracks: Faculty, Alumni Mentors, Senior Scholars, Retired Veteran Teachers, and Community Experts with automated Grade 1–6 access control enforcement.
            </p>
          </div>

          <Button
            onClick={() => {
              setEditingId(null);
              setForm(defaultFormState());
              setIsDialogOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-lg shadow-violet-600/30 shrink-0 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Publish New Educational Material
          </Button>
        </div>
      </div>

      {/* Access Rule & Simulator Bar */}
      <div className="bg-white/95 border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">Enforced Access Policy:</span> Students in{" "}
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Class 1–6
            </span>{" "}
            are restricted strictly to official Teacher resources. Community &amp; Alumni materials are accessible to{" "}
            <span className="font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-200">
              Class 7–12
            </span>.
          </div>
        </div>

        {/* Student View Simulator */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200 shrink-0">
          <span className="text-[11px] font-bold text-slate-600 pl-1.5 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-violet-600" /> Preview as:
          </span>
          <select
            value={simulatorGrade}
            onChange={(e) => setSimulatorGrade(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-800"
          >
            <option value="all">Faculty Admin (All Unlocked)</option>
            <option value="class_5">Class 5 Student (Junior Protected)</option>
            <option value="class_9">Class 9 Student (Senior Full Access)</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/95 border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, teacher, alumni, or topic tag..."
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
              All ({materials.length})
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
            <Button
              size="sm"
              variant={selectedSource === "community" ? "default" : "outline"}
              onClick={() => setSelectedSource("community")}
              className={`text-xs h-8 ${selectedSource === "community" ? "bg-cyan-700 text-white" : "border-cyan-200 text-cyan-800 bg-cyan-50/50"}`}
            >
              Community
            </Button>
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((item) => {
          const itemSource = item.source_type || "teacher";
          const sourceDef = SOURCE_TYPES[itemSource] || SOURCE_TYPES.teacher;

          // Simulator logic
          const isSimulatedJunior = simulatorGrade === "class_5";
          const isSimulatedLocked = isSimulatedJunior && itemSource !== "teacher";

          return (
            <Card
              key={item.id}
              className={`bg-white/95 border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative ${
                isSimulatedLocked ? "border-dashed border-amber-300 bg-amber-50/20 opacity-80" : ""
              }`}
            >
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${sourceDef.badgeColor}`}>
                    {sourceDef.badgeText}
                  </Badge>

                  {isSimulatedLocked ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked in Class 5
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.duration || "20 mins"}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 mt-2 bg-slate-50/50">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {item.author_name?.[0] || "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.author_name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.author_role}</div>
                  </div>
                </div>

                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[9px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Grade {item.target_grade_min || 1}–{item.target_grade_max || 12}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setActivePlayerItem(item)}
                    className="ml-auto text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold h-7 px-3 rounded-lg flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" /> Watch Inbuilt Stream
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Inbuilt Video Player Theatre Modal */}
      {activePlayerItem && (
        <InbuiltVideoPlayer
          item={activePlayerItem}
          isOpen={Boolean(activePlayerItem)}
          onClose={() => setActivePlayerItem(null)}
        />
      )}

      {/* Publish Material Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white text-slate-900 p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Publish Educational Material or Video Lecture
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Publish curriculum or community content with author affiliation and grade access rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdate} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Lecture / Resource Title *</label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Masterclass on Calculus & Applications in Machine Learning"
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contributor Source Track *</label>
                <select
                  value={form.source_type}
                  onChange={(e) => setForm({ ...form, source_type: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-slate-800 font-semibold"
                >
                  <option value="teacher">🏫 Official Teacher / Faculty (Unlocked Grades 1–12)</option>
                  <option value="alumni">🎓 Alumni Mentor (Unlocked Grade 7+)</option>
                  <option value="senior">⭐ Senior Student Peer (Unlocked Grade 7+)</option>
                  <option value="retired_teacher">🎖️ Retired Veteran Faculty (Unlocked Grade 7+)</option>
                  <option value="community">🌐 Community &amp; Guest (Unlocked Grade 7+)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Material Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg h-9 px-3 text-slate-800 font-medium"
                >
                  <option value="video">🎥 Video Lecture (YouTube / Stream)</option>
                  <option value="material">📄 Study Material / Notes PDF</option>
                  <option value="article">📰 Conceptual Article</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Author / Contributor Name *</label>
                <Input
                  required
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                  placeholder="e.g. Siddharth Nambiar (Class of '21)"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Author Role / Credential</label>
                <Input
                  value={form.author_role}
                  onChange={(e) => setForm({ ...form, author_role: e.target.value })}
                  placeholder="e.g. Alumni | Aerospace Engineer @ ISRO"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Video / Resource Stream URL</label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duration / Length</label>
                <Input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 35 mins"
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Description &amp; Key Concepts</label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Comprehensive summary of learning objectives and covered topics..."
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Topic Tags (comma-separated)</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Physics, SpaceTech, Olympiad, BoardExam"
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
                disabled={submitting}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                {submitting ? "Publishing..." : "Publish Material"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
