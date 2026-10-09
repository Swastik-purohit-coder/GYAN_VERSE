"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole, saveUserRole } from "@/lib/users";
import { getVideoType } from "@/lib/videoHelpers";
import { useSubjects, useTeacherModules, useTeacherStudentProgress } from "@/hooks/useApi";
import apiClient from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@teacher/components/ui/card";
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
import { Progress } from "@teacher/components/ui/progress";
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  Video,
  BookOpen,
  Layers,
  Upload,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Filter,
  Youtube,
  Headphones,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const SCHOOL_CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

function defaultModuleForm() {
  return {
    title: "",
    description: "",
    class: "Class 4",
    subjectId: "",
    thumbnailUrl: "",
    published: true,
  };
}

function defaultLessonForm() {
  return {
    title: "",
    description: "",
    videoType: "youtube",
    videoFile: null,
    videoPath: "",
    videoUrl: "",
    audioSource: "none", // 'none' | 'url' | 'uploaded'
    audioFile: null,
    audioPath: "",
    audioUrl: "",
    duration: 300,
    orderIndex: 1,
    isRequired: true,
    published: true,
  };
}

function ModuleManager() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState(null);

  // Filters & State
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState("all");

  // Form States
  const [moduleForm, setModuleForm] = useState(defaultModuleForm());
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [submittingModule, setSubmittingModule] = useState(false);
  const [moduleError, setModuleError] = useState(null);
  const [moduleSuccess, setModuleSuccess] = useState(null);

  // Selected Module for Lesson Management
  const [activeModule, setActiveModule] = useState(null);
  const [activeModuleLessons, setActiveModuleLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Lesson Form State
  const [lessonForm, setLessonForm] = useState(defaultLessonForm());
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [submittingLesson, setSubmittingLesson] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [lessonError, setLessonError] = useState(null);
  const [lessonSuccess, setLessonSuccess] = useState(null);

  // Fetch teacher role & school
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) {
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    fetchUserRole(user.id)
      .then((doc) => {
        if (!active) return;
        const roleVal = typeof doc === "string" ? doc : doc?.role;
        if (roleVal === "unassigned") {
          router.replace("/role-select");
          return;
        }
        if (roleVal === "student") {
          router.replace("/student");
          return;
        }
        setRoleDoc(doc);
      })
      .catch((err) => {
        if (!active) return;
        setRoleDoc(null);
        setRoleError(err?.message || null);
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, router]);

  const schoolId = roleDoc?.schoolId || roleDoc?.school_id || user?.unsafeMetadata?.schoolId || (typeof window !== "undefined" ? localStorage.getItem("schoolId") : null) || "default_school";
  const rawRole = typeof roleDoc === "string" ? roleDoc : roleDoc?.role;
  const role = (rawRole && rawRole !== "unassigned")
    ? rawRole
    : user?.unsafeMetadata?.role || (typeof window !== "undefined" ? localStorage.getItem("userRole") : null) || "teacher";

  // Fetch subjects for school & class
  const { subjects } = useSubjects({
    schoolId,
    enabled: Boolean(schoolId),
  });

  // Fetch learning modules
  const {
    modules,
    loading: modulesLoading,
    error: modulesError,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
  } = useTeacherModules({
    class: selectedClassFilter === "all" ? null : selectedClassFilter,
    subjectId: selectedSubjectFilter === "all" ? null : selectedSubjectFilter,
  });

  // Fetch real-time student lesson progress reports
  const {
    reports: progressReports,
    loading: progressReportsLoading,
    refetch: refetchProgress,
  } = useTeacherStudentProgress();

  // Set default subject on form if subjects available
  useEffect(() => {
    if (subjects && subjects.length > 0 && !moduleForm.subjectId) {
      setModuleForm((prev) => ({ ...prev, subjectId: subjects[0].id }));
    }
  }, [subjects, moduleForm.subjectId]);

  // Load lessons when activeModule changes
  const loadModuleLessons = async (modId) => {
    if (!modId) {
      setActiveModuleLessons([]);
      return;
    }
    setLoadingLessons(true);
    try {
      const data = await apiClient.request(`/teacher/modules/${modId}/lessons`);
      setActiveModuleLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load lessons:", err);
      setActiveModuleLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSelectModuleForLessons = (mod) => {
    setActiveModule(mod);
    setLessonForm({
      ...defaultLessonForm(),
      orderIndex: (mod.lessons?.length || 0) + 1,
    });
    setEditingLessonId(null);
    setLessonError(null);
    setLessonSuccess(null);
    loadModuleLessons(mod.id);
  };

  // Submit Learning Module (Create or Update)
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) {
      setModuleError("Module title is required");
      return;
    }
    if (!moduleForm.subjectId) {
      setModuleError("Please select a subject");
      return;
    }
    setSubmittingModule(true);
    setModuleError(null);
    setModuleSuccess(null);

    try {
      const payload = {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        class: moduleForm.class,
        subjectId: moduleForm.subjectId,
        thumbnailUrl: moduleForm.thumbnailUrl.trim() || null,
        published: moduleForm.published,
      };

      if (editingModuleId) {
        await updateModule(editingModuleId, payload);
        setModuleSuccess("Learning module updated successfully");
      } else {
        await createModule(payload);
        setModuleSuccess("Learning module created successfully");
      }

      setModuleForm((prev) => ({ ...defaultModuleForm(), subjectId: prev.subjectId }));
      setEditingModuleId(null);
    } catch (err) {
      setModuleError(err?.message || "Failed to save module");
    } finally {
      setSubmittingModule(false);
    }
  };

  const startEditModule = (mod) => {
    setEditingModuleId(mod.id);
    setModuleForm({
      title: mod.title || "",
      description: mod.description || "",
      class: mod.class || "Class 4",
      subjectId: mod.subject_id || mod.subjectId || "",
      thumbnailUrl: mod.thumbnail_url || mod.thumbnailUrl || "",
      published: Boolean(mod.published),
    });
    setModuleError(null);
    setModuleSuccess(null);
  };

  const handleTogglePublishModule = async (mod) => {
    try {
      await updateModule(mod.id, { published: !mod.published });
      if (activeModule?.id === mod.id) {
        setActiveModule((prev) => ({ ...prev, published: !mod.published }));
      }
    } catch (err) {
      alert("Failed to toggle publish: " + err.message);
    }
  };

  const handleDeleteModule = async (modId) => {
    if (!confirm("Are you sure you want to delete this module and all its lessons?")) return;
    try {
      await deleteModule(modId);
      if (activeModule?.id === modId) {
        setActiveModule(null);
        setActiveModuleLessons([]);
      }
    } catch (err) {
      alert("Failed to delete module: " + err.message);
    }
  };

  // Upload video to Supabase Storage
  const handleUploadVideo = async (file) => {
    if (!file) return null;
    setUploadProgress(10);
    setUploadStatus("Requesting upload ticket...");

    try {
      // 1. Fetch signed upload URL from backend
      const { signedUploadUrl, storagePath, publicUrl } = await apiClient.getSignedVideoUploadUrl(
        file.name,
        file.type
      );

      setUploadProgress(40);
      setUploadStatus("Uploading video to Supabase Storage (learning-videos bucket)...");

      if (signedUploadUrl) {
        // Direct signed upload
        const response = await fetch(signedUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "video/mp4",
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Storage upload failed (${response.status})`);
        }
      } else {
        throw new Error('Upload configuration failed: Missing signed upload URL. Ensure Supabase storage bucket exists.');
      }

      setUploadProgress(100);
      setUploadStatus("Upload complete!");

      return {
        storagePath,
        publicUrl,
      };
    } catch (err) {
      setUploadStatus("");
      setUploadProgress(0);
      throw err;
    }
  };

  // Upload audio to Supabase Storage
  const handleUploadAudio = async (file) => {
    if (!file) return null;
    setUploadProgress(10);
    setUploadStatus("Requesting audio upload ticket...");

    try {
      const mime = file.type || "audio/mpeg";
      const { signedUploadUrl, storagePath, publicUrl } = await apiClient.getSignedVideoUploadUrl(
        file.name,
        mime
      );

      setUploadProgress(40);
      setUploadStatus("Uploading audio lecture to Supabase Storage...");

      if (signedUploadUrl) {
        const response = await fetch(signedUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": mime,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Audio storage upload failed (${response.status})`);
        }
      } else {
        throw new Error("Upload configuration failed: Missing signed upload URL.");
      }

      setUploadProgress(100);
      setUploadStatus("Audio upload complete!");

      return {
        storagePath,
        publicUrl,
      };
    } catch (err) {
      setUploadStatus("");
      setUploadProgress(0);
      throw err;
    }
  };

  // Submit Lesson (Create or Update)
  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!activeModule) return;
    if (!lessonForm.title.trim()) {
      setLessonError("Lesson title is required");
      return;
    }

    setSubmittingLesson(true);
    setLessonError(null);
    setLessonSuccess(null);

    try {
      let finalVideoPath = lessonForm.videoPath;
      let finalVideoUrl = lessonForm.videoUrl;
      let finalAudioPath = lessonForm.audioPath;
      let finalAudioUrl = lessonForm.audioUrl;

      // Handle video file upload if file selected
      if (lessonForm.videoFile) {
        const uploadResult = await handleUploadVideo(lessonForm.videoFile);
        if (uploadResult) {
          finalVideoPath = uploadResult.storagePath;
          finalVideoUrl = uploadResult.publicUrl || finalVideoUrl;
        }
      }

      // Handle audio file upload if file selected
      if (lessonForm.audioFile) {
        const audioUploadResult = await handleUploadAudio(lessonForm.audioFile);
        if (audioUploadResult) {
          finalAudioPath = audioUploadResult.storagePath;
          finalAudioUrl = audioUploadResult.publicUrl || finalAudioUrl;
        }
      }

      const payload = {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || null,
        videoType: lessonForm.videoType,
        videoPath: finalVideoPath || null,
        videoUrl: finalVideoUrl ? finalVideoUrl.trim() : null,
        audioPath: finalAudioPath || null,
        audioUrl: finalAudioUrl ? finalAudioUrl.trim() : null,
        duration: Number(lessonForm.duration) || 0,
        orderIndex: Number(lessonForm.orderIndex) || 1,
        isRequired: Boolean(lessonForm.isRequired),
        published: Boolean(lessonForm.published),
      };

      if (editingLessonId) {
        await apiClient.updateLesson(editingLessonId, payload);
        setLessonSuccess("Lesson updated successfully");
      } else {
        await apiClient.createLesson(activeModule.id, payload);
        setLessonSuccess("Lesson added successfully");
      }

      setLessonForm({
        ...defaultLessonForm(),
        orderIndex: activeModuleLessons.length + 2,
      });
      setEditingLessonId(null);
      setUploadProgress(0);
      setUploadStatus("");
      await loadModuleLessons(activeModule.id);
      await fetchModules();
    } catch (err) {
      setLessonError(err?.message || "Failed to save lesson");
    } finally {
      setSubmittingLesson(false);
    }
  };

  const startEditLesson = (les) => {
    setEditingLessonId(les.id);
    const resolvedType = getVideoType(les);
    const formVideoType = resolvedType === "youtube" ? "youtube" : "uploaded";
    const hasAudio = Boolean(les.audio_url || les.audio_path || les.audioUrl || les.audioPath);
    const audioUrlVal = les.audio_url || les.audioUrl || "";
    const audioPathVal = les.audio_path || les.audioPath || "";
    const audioSrc = hasAudio ? (audioPathVal ? "uploaded" : "url") : "none";

    setLessonForm({
      title: les.title || "",
      description: les.description || "",
      videoType: formVideoType,
      videoFile: null,
      videoPath: les.video_path || les.videoPath || "",
      videoUrl: les.video_url || les.videoUrl || "",
      audioSource: audioSrc,
      audioFile: null,
      audioPath: audioPathVal,
      audioUrl: audioUrlVal,
      duration: les.duration || 300,
      orderIndex: les.order_index || les.orderIndex || 1,
      isRequired: les.is_required ?? true,
      published: les.published ?? true,
    });
    setLessonError(null);
    setLessonSuccess(null);
  };

  const handleTogglePublishLesson = async (les) => {
    try {
      await apiClient.updateLesson(les.id, { published: !les.published });
      await loadModuleLessons(activeModule.id);
    } catch (err) {
      alert("Failed to update lesson: " + err.message);
    }
  };

  const handleDeleteLesson = async (lesId) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await apiClient.deleteLesson(lesId);
      await loadModuleLessons(activeModule.id);
      await fetchModules();
    } catch (err) {
      alert("Failed to delete lesson: " + err.message);
    }
  };

  if (!isSignedIn) return null;

  if (roleLoading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center text-slate-600">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#635BFF]" />
        <p className="text-sm font-medium">Loading faculty workspace...</p>
      </div>
    );
  }

  const isAllowed = ["teacher", "principal", "admin", "higher_body"].includes(role) || role !== "student";
  if (!isAllowed) {
    return (
      <Card className="max-w-xl mx-auto mt-10 bg-white border-slate-200 shadow-sm rounded-2xl">
        <CardContent className="p-8 text-center text-slate-700">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">Faculty Access Only</div>
          <div className="text-sm text-slate-500">You need faculty or administrative privileges to manage learning modules.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#635BFF]/10 text-[#635BFF] rounded-2xl border border-[#635BFF]/20 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Learning Module Management
              </h1>
              <p className="text-sm text-[#64748B]">
                Create structured courses, video lessons, and order curriculum for your school
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-36">
            <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 rounded-xl h-10 font-medium">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg rounded-xl">
                <SelectItem value="all">All Classes</SelectItem>
                {SCHOOL_CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={selectedSubjectFilter} onValueChange={setSelectedSubjectFilter}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-700 shadow-2xs hover:border-slate-300 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 rounded-xl h-10 font-medium">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 shadow-lg rounded-xl">
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name} ({sub.class || 'K-12'})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Create / Edit Module Form & Module List (2 Cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create/Edit Module Form */}
          <Card className="bg-white border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-[#E2E8F0] py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[#172033] text-base font-bold flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                  {editingModuleId ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                </div>
                <span>{editingModuleId ? "Edit Learning Module" : "Create New Learning Module"}</span>
              </CardTitle>
              {editingModuleId && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                  Editing Mode
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveModule} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Target Class *
                    </label>
                    <Select
                      value={moduleForm.class}
                      onValueChange={(val) => setModuleForm((p) => ({ ...p, class: val }))}
                    >
                      <SelectTrigger className="bg-slate-50/60 hover:bg-slate-50 border-slate-200 text-slate-800 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 rounded-xl h-10">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg rounded-xl">
                        {SCHOOL_CLASSES.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Subject *
                    </label>
                    <Select
                      value={moduleForm.subjectId}
                      onValueChange={(val) => setModuleForm((p) => ({ ...p, subjectId: val }))}
                    >
                      <SelectTrigger className="bg-slate-50/60 hover:bg-slate-50 border-slate-200 text-slate-800 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 rounded-xl h-10">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg rounded-xl">
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name} ({sub.class || 'K-12'})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Module Title *
                  </label>
                  <Input
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Chapter 1: Introduction to Matter & Energy"
                    className="bg-slate-50/60 hover:bg-slate-50 focus:bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 rounded-xl h-10 placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Description
                  </label>
                  <Textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief summary of module learning objectives..."
                    className="bg-slate-50/60 hover:bg-slate-50 focus:bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 rounded-xl placeholder:text-slate-400"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={moduleForm.published}
                      onChange={(e) => setModuleForm((p) => ({ ...p, published: e.target.checked }))}
                      className="w-4 h-4 rounded text-[#635BFF] focus:ring-[#635BFF] accent-[#635BFF] cursor-pointer"
                    />
                    Publish module to students immediately
                  </label>

                  <div className="flex items-center gap-2">
                    {editingModuleId && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingModuleId(null);
                          setModuleForm(defaultModuleForm());
                        }}
                        className="border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={submittingModule}
                      size="sm"
                      className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl text-xs font-semibold px-4 shadow-xs"
                    >
                      {submittingModule ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </span>
                      ) : editingModuleId ? (
                        "Update Module"
                      ) : (
                        "Create Module"
                      )}
                    </Button>
                  </div>
                </div>

                {moduleError && (
                  <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{moduleError}</span>
                  </div>
                )}
                {moduleSuccess && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{moduleSuccess}</span>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Modules List */}
          <Card className="bg-white border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b border-[#E2E8F0] py-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[#172033] text-base font-bold flex items-center gap-2">
                <span>School Learning Modules</span>
                <span className="bg-[#635BFF]/10 text-[#635BFF] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {modules.length}
                </span>
              </CardTitle>
              {modulesLoading && <Loader2 className="w-4 h-4 animate-spin text-[#635BFF]" />}
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {modulesError && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">{modulesError}</div>}

              {modulesLoading && !modules.length ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading learning modules...</div>
              ) : !modules.length ? (
                <div className="py-12 text-center text-sm text-slate-500 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-6">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 mb-1">No learning modules yet</p>
                  <p className="text-xs text-slate-400">Use the form above to create your school&apos;s first curriculum module.</p>
                </div>
              ) : (
                modules.map((mod) => {
                  const isSelected = activeModule?.id === mod.id;
                  const subjectName = subjects.find((s) => s.id === (mod.subject_id || mod.subjectId))?.name || "Subject";

                  return (
                    <div
                      key={mod.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected
                          ? "border-[#635BFF] bg-gradient-to-r from-violet-50/70 to-indigo-50/30 shadow-xs ring-1 ring-[#635BFF]/20"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                            <Badge className="bg-[#635BFF]/10 text-[#635BFF] border-0 text-xs font-semibold px-2 py-0.5">
                              {mod.class}
                            </Badge>
                            <Badge variant="outline" className="text-slate-600 border-slate-200 text-xs">
                              {subjectName}
                            </Badge>
                            {mod.published ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs flex items-center gap-1 font-medium">
                                <Eye className="w-3 h-3" /> Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 text-xs flex items-center gap-1 font-medium">
                                <EyeOff className="w-3 h-3" /> Draft
                              </Badge>
                            )}
                          </div>
                          {mod.description && <p className="text-xs text-slate-500 line-clamp-2">{mod.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={
                              isSelected
                                ? "bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl text-xs font-semibold shadow-xs"
                                : "border-slate-200 text-slate-700 hover:border-[#635BFF] hover:text-[#635BFF] bg-white rounded-xl text-xs font-semibold"
                            }
                            onClick={() => handleSelectModuleForLessons(mod)}
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            {isSelected ? "Managing Lessons" : "Manage Lessons"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            onClick={() => startEditModule(mod)}
                            title="Edit Module"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            onClick={() => handleTogglePublishModule(mod)}
                            title={mod.published ? "Unpublish Module" : "Publish Module"}
                          >
                            {mod.published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            onClick={() => handleDeleteModule(mod.id)}
                            title="Delete Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Lesson Manager Panel for Selected Module (1 Col) */}
        {/* ============================================================ */}
        <div className="space-y-6">
          <Card className="bg-white border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden sticky top-6">
            <CardHeader className="bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-white border-b border-[#E2E8F0] py-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#635BFF] text-white rounded-xl shadow-xs">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-[#172033] leading-snug">
                      {activeModule ? `Lessons in: ${activeModule.title}` : "Lesson Manager"}
                    </CardTitle>
                    <p className="text-[11px] text-[#64748B]">
                      {activeModule ? "Add and configure video lessons" : "Select a module to manage content"}
                    </p>
                  </div>
                </div>
                {activeModule && (
                  <Badge className="bg-[#635BFF]/10 text-[#635BFF] border-0 text-xs font-semibold shrink-0">
                    {activeModule.class}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {!activeModule ? (
                <div className="py-14 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-[#635BFF] mx-auto flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">No Module Selected</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Select a learning module on the left to add video lessons and curriculum content.
                  </p>
                </div>
              ) : (
                <>
                  {/* Add / Edit Lesson Form */}
                  <form onSubmit={handleSaveLesson} className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#635BFF] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {editingLessonId ? "Edit Lesson" : "Add Lesson to Module"}
                      </h4>
                      {editingLessonId && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                          Editing
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Title *</label>
                      <Input
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="e.g. Lesson 1: States of Matter"
                        className="bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 text-xs h-9 rounded-xl placeholder:text-slate-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Lesson Description</label>
                      <Textarea
                        value={lessonForm.description}
                        onChange={(e) => setLessonForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Video summary or key concepts..."
                        className="bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 text-xs rounded-xl placeholder:text-slate-400"
                        rows={2}
                      />
                    </div>

                    {/* Lesson Video Source Selector (Pill Switcher) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Video Source</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLessonForm((p) => ({ ...p, videoType: "youtube" }))}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            lessonForm.videoType === "youtube"
                              ? "bg-white text-red-600 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Youtube className="w-3.5 h-3.5 text-red-600" />
                          <span>YouTube URL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonForm((p) => ({ ...p, videoType: "uploaded" }))}
                          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            lessonForm.videoType === "uploaded"
                              ? "bg-white text-[#635BFF] shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-[#635BFF]" />
                          <span>Upload Video</span>
                        </button>
                      </div>
                    </div>

                    {lessonForm.videoType === "youtube" ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          YouTube Video URL *
                        </label>
                        <Input
                          value={lessonForm.videoUrl}
                          onChange={(e) => setLessonForm((p) => ({ ...p, videoUrl: e.target.value }))}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          className="bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 text-xs h-9 rounded-xl placeholder:text-slate-400"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Paste any YouTube link. It will automatically convert to an embeddable format for online playback.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Upload Video File (Supabase Storage)
                        </label>
                        <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:border-[#635BFF] transition-colors">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLessonForm((p) => ({ ...p, videoFile: file }));
                              }
                            }}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#635BFF] file:text-white hover:file:bg-[#5148E5] cursor-pointer"
                          />
                        </div>

                        {uploadStatus && (
                          <div className="space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                            <div className="text-[11px] text-[#635BFF] font-medium flex items-center justify-between">
                              <span>{uploadStatus}</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5 bg-slate-100" />
                          </div>
                        )}

                        <div className="pt-1">
                          <label className="block text-[11px] text-slate-500 mb-1">Direct Storage Video URL (Optional Override)</label>
                          <Input
                            value={lessonForm.videoUrl}
                            onChange={(e) => setLessonForm((p) => ({ ...p, videoUrl: e.target.value }))}
                            placeholder="https://... direct .mp4 video URL"
                            className="bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 text-xs h-9 rounded-xl placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* Lesson Audio Lecture Selector (Pill Switcher) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Headphones className="w-3.5 h-3.5 text-[#635BFF]" />
                          <span>Audio Track (Optional / Alternative)</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">OR operation supported</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setLessonForm((p) => ({ ...p, audioSource: "none" }))}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            lessonForm.audioSource === "none"
                              ? "bg-white text-slate-800 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span>None</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonForm((p) => ({ ...p, audioSource: "url" }))}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            lessonForm.audioSource === "url"
                              ? "bg-white text-[#635BFF] shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span>Audio Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLessonForm((p) => ({ ...p, audioSource: "uploaded" }))}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            lessonForm.audioSource === "uploaded"
                              ? "bg-white text-violet-600 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <span>Upload File</span>
                        </button>
                      </div>
                    </div>

                    {lessonForm.audioSource === "url" && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Audio Stream / Podcast URL</label>
                        <Input
                          value={lessonForm.audioUrl}
                          onChange={(e) => setLessonForm((p) => ({ ...p, audioUrl: e.target.value }))}
                          placeholder="https://... direct .mp3 or audio stream URL"
                          className="bg-white border-slate-200 focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 text-slate-900 text-xs h-9 rounded-xl placeholder:text-slate-400"
                        />
                      </div>
                    )}

                    {lessonForm.audioSource === "uploaded" && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Upload Audio Lecture (.mp3, .wav, .m4a, .aac)
                        </label>
                        <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-white hover:border-[#635BFF] transition-colors">
                          <input
                            type="file"
                            accept="audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac,audio/ogg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLessonForm((p) => ({ ...p, audioFile: file }));
                              }
                            }}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer"
                          />
                        </div>
                        <div className="pt-1">
                          <label className="block text-[11px] text-slate-500 mb-1">Direct Storage Audio URL (Optional Override)</label>
                          <Input
                            value={lessonForm.audioUrl}
                            onChange={(e) => setLessonForm((p) => ({ ...p, audioUrl: e.target.value }))}
                            placeholder="https://... direct .mp3 URL"
                            className="bg-white border-slate-200 focus:border-[#635BFF] text-slate-900 text-xs h-9 rounded-xl placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Duration (seconds)</label>
                        <Input
                          type="number"
                          value={lessonForm.duration}
                          onChange={(e) => setLessonForm((p) => ({ ...p, duration: e.target.value }))}
                          className="bg-white border-slate-200 focus:border-[#635BFF] text-slate-900 text-xs h-9 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Order Index</label>
                        <Input
                          type="number"
                          value={lessonForm.orderIndex}
                          onChange={(e) => setLessonForm((p) => ({ ...p, orderIndex: e.target.value }))}
                          className="bg-white border-slate-200 focus:border-[#635BFF] text-slate-900 text-xs h-9 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-700 pt-1 bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
                        <input
                          type="checkbox"
                          checked={lessonForm.isRequired}
                          onChange={(e) => setLessonForm((p) => ({ ...p, isRequired: e.target.checked }))}
                          className="rounded text-[#635BFF] focus:ring-[#635BFF] accent-[#635BFF] cursor-pointer"
                        />
                        <span>Required</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
                        <input
                          type="checkbox"
                          checked={lessonForm.published}
                          onChange={(e) => setLessonForm((p) => ({ ...p, published: e.target.checked }))}
                          className="rounded text-[#635BFF] focus:ring-[#635BFF] accent-[#635BFF] cursor-pointer"
                        />
                        <span>Published</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {editingLessonId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLessonId(null);
                            setLessonForm(defaultLessonForm());
                          }}
                          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        disabled={submittingLesson}
                        size="sm"
                        className="w-full bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl text-xs font-semibold py-2 shadow-xs transition-all"
                      >
                        {submittingLesson ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                          </span>
                        ) : editingLessonId ? (
                          "Update Lesson"
                        ) : (
                          "Add Lesson"
                        )}
                      </Button>
                    </div>

                    {lessonError && (
                      <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{lessonError}</span>
                      </div>
                    )}
                    {lessonSuccess && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{lessonSuccess}</span>
                      </div>
                    )}
                  </form>

                  {/* Lessons List */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Module Lessons
                      </h4>
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {activeModuleLessons.length}
                      </span>
                    </div>

                    {loadingLessons ? (
                      <div className="py-6 text-center text-xs text-slate-500">Loading lessons...</div>
                    ) : !activeModuleLessons.length ? (
                      <div className="py-6 text-center text-xs text-slate-500 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4">
                        No lessons added yet. Use the form above to add your first lesson video!
                      </div>
                    ) : (
                      activeModuleLessons.map((les, index) => {
                        const vType = getVideoType(les);
                        return (
                          <div
                            key={les.id}
                            className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs space-y-2 text-xs transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-900 leading-snug">
                                  {index + 1}. {les.title}
                                </div>
                                {les.description && <div className="text-[11px] text-slate-500 mt-0.5">{les.description}</div>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                  onClick={() => handleTogglePublishLesson(les)}
                                  title={les.published ? "Unpublish Lesson" : "Publish Lesson"}
                                >
                                  {les.published ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                                  onClick={() => startEditLesson(les)}
                                  title="Edit Lesson"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                  onClick={() => handleDeleteLesson(les.id)}
                                  title="Delete Lesson"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2 flex-wrap gap-1">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {les.duration || 0}s
                              </span>
                              {les.is_required ? (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                  Required
                                </span>
                              ) : (
                                <span className="text-slate-400">Optional</span>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {les.video_url && (
                                  <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                    vType === 'youtube'
                                      ? 'bg-red-50 text-red-600 border border-red-200'
                                      : 'bg-violet-50 text-[#635BFF] border border-violet-200'
                                  }`}>
                                    {vType === 'youtube' ? '📹 YouTube' : '📁 Video'}
                                  </span>
                                )}
                                {(les.audio_url || les.audio_path) && (
                                  <span className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                                    <Headphones className="w-2.5 h-2.5" /> Audio
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-Time Student Lesson Progress Tracker */}
      <Card className="bg-white border-[#E2E8F0] shadow-2xs rounded-2xl overflow-hidden mt-8">
        <CardHeader className="border-b border-[#E2E8F0] bg-white py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-[#172033] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Student Lesson Progress Tracker</span>
            </CardTitle>
            <p className="text-xs text-[#64748B] mt-0.5">
              Real-time completion data calculated from student video lesson views across your school
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={refetchProgress}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold px-3 py-1.5 flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Progress</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {progressReportsLoading && (!progressReports || progressReports.length === 0) ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#635BFF]" />
              <p className="text-xs font-medium">Loading student progress reports...</p>
            </div>
          ) : (!progressReports || progressReports.length === 0) ? (
            <div className="py-12 text-center text-slate-500 p-6">
              <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm mb-1">No student progress recorded yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Progress will update automatically as students watch videos and complete learning modules.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Learning Module</th>
                    <th className="py-3 px-4 text-center">Completed Lessons</th>
                    <th className="py-3 px-4">Module Progress</th>
                    <th className="py-3 px-4 text-right">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progressReports.map((item, idx) => (
                    <tr key={`${item.studentId}-${item.moduleId}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.studentName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[11px] font-medium">
                          {item.class}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {item.moduleTitle}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {item.completedLessons} / {item.totalLessons}
                      </td>
                      <td className="py-3 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className={item.progressPercent === 100 ? "text-emerald-600" : "text-slate-700"}>
                              {item.progressPercent}%
                            </span>
                            {item.isCompleted && (
                              <span className="text-emerald-600 text-[10px] font-bold">✓ COMPLETED</span>
                            )}
                          </div>
                          <Progress
                            value={item.progressPercent}
                            className={`h-2 ${item.progressPercent === 100 ? "bg-emerald-100" : "bg-slate-100"}`}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-[11px] text-slate-500">
                        {item.lastUpdatedAt
                          ? new Date(item.lastUpdatedAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Not started"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ModulesPage() {
  return <ModuleManager />;
}
