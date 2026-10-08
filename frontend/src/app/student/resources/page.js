"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import { useSchoolContent } from "@/hooks/useApi";
import { useTheme } from "@/components/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@student/components/ui/card";
import { Badge } from "@student/components/ui/badge";
import { Button } from "@student/components/ui/button";
import { Input } from "@student/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@teacher/components/ui/dialog";
import {
  Search,
  BookOpen,
  GraduationCap,
  Award,
  Sparkles,
  ShieldCheck,
  Globe,
  Lock,
  Play,
  Clock,
  Tag,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Video,
  Info,
} from "lucide-react";
import InbuiltVideoPlayer from "@/components/InbuiltVideoPlayer";
import {
  SOURCE_TYPES,
  parseStudentGrade,
  isGradeUpTo6,
  canStudentAccessResource,
  SEED_EDUCATIONAL_MATERIALS,
} from "@/lib/resourceAccess";

function buildYoutubeEmbed(url) {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const youtubePatterns = [
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    ];
    for (const pattern of youtubePatterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }
  } catch (error) {
    console.error("Failed to build YouTube embed", error);
  }
  return null;
}

export default function StudentResourcesPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { theme } = useTheme();

  const [studentRole, setStudentRole] = useState(null);
  const [studentClass, setStudentClass] = useState(null);
  const [schoolId, setSchoolId] = useState(null);
  const [materials, setMaterials] = useState(SEED_EDUCATIONAL_MATERIALS);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Active Video Modal State
  const [activeMediaModal, setActiveMediaModal] = useState(null);
  const [lockedNoticeModal, setLockedNoticeModal] = useState(null);

  // Load User Profile & Class
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const metaRole = user?.unsafeMetadata?.role;
    const metaClass = user?.unsafeMetadata?.class;
    const localClass = typeof window !== "undefined" ? localStorage.getItem("studentClass") : null;

    setStudentRole(metaRole || "student");
    setStudentClass(metaClass || localClass || "Class 8");

    fetchUserRole(user.id)
      .then((doc) => {
        if (doc) {
          if (doc.role) setStudentRole(doc.role);
          if (doc.class) setStudentClass(doc.class);
          if (doc.schoolId || doc.school_id) setSchoolId(doc.schoolId || doc.school_id);
        }
      })
      .catch((err) => console.warn("Failed to load user role in resources:", err));
  }, [user, isLoaded]);

  // Fetch Materials from API with fallback
  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (schoolId) queryParams.append("schoolId", schoolId);
        if (studentClass) queryParams.append("studentClass", studentClass);

        const res = await fetch(`/api/content?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMaterials(data);
          } else {
            setMaterials(SEED_EDUCATIONAL_MATERIALS);
          }
        } else {
          setMaterials(SEED_EDUCATIONAL_MATERIALS);
        }
      } catch (e) {
        console.warn("Using seed educational materials:", e);
        setMaterials(SEED_EDUCATIONAL_MATERIALS);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [schoolId, studentClass]);

  const numericGrade = useMemo(() => parseStudentGrade(studentClass), [studentClass]);
  const isJuniorStudent = useMemo(() => isGradeUpTo6(studentClass), [studentClass]);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      // Source Filter
      const itemSource = item.source_type || "teacher";
      const matchesSource = selectedSource === "all" || itemSource === selectedSource;

      // Type Filter
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesSource && matchesType;
    });
  }, [materials, searchTerm, selectedSource, selectedType]);

  const handleOpenResource = (item) => {
    const itemSource = item.source_type || "teacher";
    const access = canStudentAccessResource(studentClass, itemSource, studentRole);

    if (!access.allowed) {
      setLockedNoticeModal({
        item,
        reason: access.reason,
      });
      return;
    }

    // Unlocked: open modal
    setActiveMediaModal(item);
  };

  if (!isSignedIn && isLoaded) {
    return (
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 py-1 font-semibold text-xs">
              📚 Educational Material &amp; Video Lecture Library
            </Badge>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 font-semibold text-xs">
              {studentClass || "Grade 8"} Learning Space
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Multi-Source STEM &amp; Skill Lectures
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            Curated educational materials from official school faculty, esteemed alumni mentors, senior student scholars, retired master educators, and verified community experts.
          </p>

          {/* Access Policy Badge for Grades <= 6 */}
          {isJuniorStudent ? (
            <div className="mt-4 flex items-start gap-3 bg-amber-950/50 border border-amber-500/40 p-3.5 rounded-xl text-amber-200 text-xs">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Junior Scholar Safety Rule Active ({studentClass || "Class 1–6"}):</span>{" "}
                You have full access to official teacher-curated lectures and study resources. Community, alumni, and senior peer masterclasses will automatically unlock when you enter Class 7.
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-3 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300">Full Community &amp; Alumni Access ({studentClass || "Class 7+"}):</span>{" "}
                You have unrestricted access to official faculty lessons, alumni masterclasses, senior peer guides, and veteran teacher lectures.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/95 border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search lectures, topics, teachers, alumni, tags..."
              className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-700 w-full md:w-auto font-medium"
            >
              <option value="all">All Material Types</option>
              <option value="video">🎥 Video Lectures</option>
              <option value="material">📄 Study Materials &amp; Notes</option>
              <option value="article">📰 Conceptual Articles</option>
            </select>
          </div>
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Source:
          </span>

          <Button
            size="sm"
            variant={selectedSource === "all" ? "default" : "outline"}
            onClick={() => setSelectedSource("all")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "all" ? "bg-slate-900 text-white" : "border-slate-200 text-slate-700"
            }`}
          >
            All Contributors
          </Button>

          <Button
            size="sm"
            variant={selectedSource === "teacher" ? "default" : "outline"}
            onClick={() => setSelectedSource("teacher")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "teacher"
                ? "bg-emerald-700 text-white"
                : "border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/80"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 mr-1" /> Official Teachers
          </Button>

          <Button
            size="sm"
            variant={selectedSource === "alumni" ? "default" : "outline"}
            onClick={() => setSelectedSource("alumni")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "alumni"
                ? "bg-violet-700 text-white"
                : "border-violet-200 bg-violet-50/60 text-violet-800 hover:bg-violet-100/80"
            }`}
          >
            <Award className="w-3.5 h-3.5 mr-1" /> Alumni Mentors {isJuniorStudent && "🔒"}
          </Button>

          <Button
            size="sm"
            variant={selectedSource === "senior" ? "default" : "outline"}
            onClick={() => setSelectedSource("senior")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "senior"
                ? "bg-indigo-700 text-white"
                : "border-indigo-200 bg-indigo-50/60 text-indigo-800 hover:bg-indigo-100/80"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Senior Peers {isJuniorStudent && "🔒"}
          </Button>

          <Button
            size="sm"
            variant={selectedSource === "retired_teacher" ? "default" : "outline"}
            onClick={() => setSelectedSource("retired_teacher")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "retired_teacher"
                ? "bg-amber-700 text-white"
                : "border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100/80"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Retired Veterans {isJuniorStudent && "🔒"}
          </Button>

          <Button
            size="sm"
            variant={selectedSource === "community" ? "default" : "outline"}
            onClick={() => setSelectedSource("community")}
            className={`text-xs h-8 rounded-lg shrink-0 ${
              selectedSource === "community"
                ? "bg-cyan-700 text-white"
                : "border-cyan-200 bg-cyan-50/60 text-cyan-800 hover:bg-cyan-100/80"
            }`}
          >
            <Globe className="w-3.5 h-3.5 mr-1" /> Community {isJuniorStudent && "🔒"}
          </Button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMaterials.map((item) => {
          const itemSource = item.source_type || "teacher";
          const sourceDef = SOURCE_TYPES[itemSource] || SOURCE_TYPES.teacher;
          const access = canStudentAccessResource(studentClass, itemSource, studentRole);
          const isLocked = !access.allowed;

          return (
            <Card
              key={item.id}
              className={`bg-white/95 border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group ${
                isLocked ? "border-dashed border-amber-300 bg-amber-50/20" : ""
              }`}
            >
              {/* Top Source Banner */}
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <Badge className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${sourceDef.badgeColor}`}>
                    {sourceDef.badgeText}
                  </Badge>

                  {isLocked ? (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Class 7+ Content
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.duration || "20 mins"}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Author & Tags */}
              <div className="p-4 pt-2 border-t border-slate-100 mt-2 bg-slate-50/50">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {item.author_avatar || item.author_name?.[0] || "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{item.author_name || "Faculty In-Charge"}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.author_role || "Educator"}</div>
                  </div>
                </div>

                {/* Tags */}
                {Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[9px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => handleOpenResource(item)}
                  variant={isLocked ? "outline" : "default"}
                  className={`w-full text-xs font-semibold h-8 ${
                    isLocked
                      ? "border-amber-300 text-amber-800 hover:bg-amber-100/80"
                      : "bg-violet-600 hover:bg-violet-700 text-white shadow-xs"
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" /> Unlock Details (Class 7+)
                    </>
                  ) : item.type === "video" ? (
                    <>
                      <Play className="w-3.5 h-3.5 mr-1.5" /> Watch Video Lecture
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" /> View Educational Material
                    </>
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Inbuilt Video & Educational Material Theatre */}
      {activeMediaModal && (
        <InbuiltVideoPlayer
          item={activeMediaModal}
          isOpen={Boolean(activeMediaModal)}
          onClose={() => setActiveMediaModal(null)}
        />
      )}

      {/* Junior Safety Lock Notice Modal */}
      {lockedNoticeModal && (
        <Dialog open={Boolean(lockedNoticeModal)} onOpenChange={() => setLockedNoticeModal(null)}>
          <DialogContent className="max-w-md bg-white text-slate-900 p-6 rounded-2xl shadow-2xl border-amber-200">
            <DialogHeader className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto sm:mx-0 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Junior Scholar Safety Policy
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 mt-1">
                Resource: <span className="font-semibold text-slate-800">{lockedNoticeModal.item?.title}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-2 text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-200">
              <p className="font-semibold text-amber-900">
                🛡️ Why is this content restricted for {studentClass || "Class 1–6"}?
              </p>
              <p>
                To ensure foundational safety and pedagogical alignment, students up to Class 6 are restricted to official faculty-curated materials.
              </p>
              <p>
                Community contributions, alumni masterclasses, and senior peer discussions become fully unlocked starting in <strong>Class 7</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="default"
                onClick={() => setLockedNoticeModal(null)}
                className="text-xs bg-slate-900 text-white hover:bg-slate-800 font-semibold"
              >
                Understood, Browse Teacher Resources
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
