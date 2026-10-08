"use client";

import { useState, useMemo } from "react";
import { useNoticeboard } from "@/hooks/useDashboardFeatures";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { Textarea } from "@teacher/components/ui/textarea";
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
  Bell,
  Plus,
  Search,
  Pin,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Trash2,
  Paperclip,
  Share2,
  Filter,
  Sparkles,
  Layers,
} from "lucide-react";

export default function NoticeboardPage() {
  const { user } = useUser();
  const { notices, loading, error, addNotice, removeNotice } = useNoticeboard();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "academic",
    target_audience: "all",
    target_class: "all",
    priority: "normal",
    is_pinned: false,
    author_name: user?.fullName || "Principal / Academic Dean",
    author_role: user?.unsafeMetadata?.role || "principal",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      await addNotice({
        ...formData,
        target_class: formData.target_class === "all" ? null : formData.target_class,
        author_name: user?.fullName || "Principal Dr. Evelyn Reed",
        author_role: user?.unsafeMetadata?.role || "principal",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        content: "",
        category: "academic",
        target_audience: "all",
        target_class: "all",
        priority: "normal",
        is_pinned: false,
        author_name: user?.fullName || "Principal Dr. Evelyn Reed",
        author_role: user?.unsafeMetadata?.role || "principal",
      });
    } catch (err) {
      console.error("Failed to post notice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchesPriority = selectedPriority === "all" || item.priority === selectedPriority;
      return matchesSearch && matchesCat && matchesPriority;
    });
  }, [notices, searchQuery, selectedCategory, selectedPriority]);

  const stats = useMemo(() => {
    return {
      total: notices.length,
      pinned: notices.filter((n) => n.is_pinned).length,
      urgent: notices.filter((n) => n.priority === "urgent" || n.priority === "high").length,
      academic: notices.filter((n) => n.category === "academic" || n.category === "exam").length,
    };
  }, [notices]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-rose-500 text-white hover:bg-rose-600 font-semibold uppercase text-[10px]">Urgent Alert</Badge>;
      case "high":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600 font-semibold uppercase text-[10px]">High Priority</Badge>;
      case "medium":
      case "normal":
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">General Notice</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "competition":
        return <span className="text-[11px] font-semibold text-fuchsia-600 bg-fuchsia-50 border border-fuchsia-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Sparkles className="w-3 h-3" /> Competition</span>;
      case "exam":
        return <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Layers className="w-3 h-3" /> Assessments</span>;
      case "circular":
        return <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Megaphone className="w-3 h-3" /> Circular</span>;
      default:
        return <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1"><Tag className="w-3 h-3" /> Academic</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-violet-700/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-violet-500/30 text-violet-200 border border-violet-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Megaphone className="w-3.5 h-3.5" /> Official Broadcast Center
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Institutional Noticeboard & Circulars</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Publish, broadcast, and prioritize school-wide notices, academic deadlines, olympiad circulars, and executive directives.
          </p>
        </div>

        {/* Publish Dialog Trigger */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto">
              <Plus className="w-4 h-4" /> Create Circular / Notice
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" /> Issue New Directive or Notice
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Broadcast official updates to students, classrooms, and faculty across the institution.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNotice} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Notice Title / Subject *</label>
                <Input
                  placeholder="e.g., 📢 Monthly STEM Robotics Registration or Final Assessment Timetable"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic & Curriculum</SelectItem>
                      <SelectItem value="competition">Competition & Events</SelectItem>
                      <SelectItem value="exam">Examinations & Tests</SelectItem>
                      <SelectItem value="circular">Administrative Circular</SelectItem>
                      <SelectItem value="general">General Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Audience</label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(val) => handleInputChange("target_audience", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Target Audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Entire Institution (All)</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="faculty">Faculty & Staff</SelectItem>
                      <SelectItem value="parents">Parents & Guardians</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Class</label>
                  <Select
                    value={formData.target_class}
                    onValueChange={(val) => handleInputChange("target_class", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes (6–12)</SelectItem>
                      <SelectItem value="Class 6">Class 6</SelectItem>
                      <SelectItem value="Class 7">Class 7</SelectItem>
                      <SelectItem value="Class 8">Class 8</SelectItem>
                      <SelectItem value="Class 9">Class 9</SelectItem>
                      <SelectItem value="Class 10">Class 10</SelectItem>
                      <SelectItem value="Class 11">Class 11</SelectItem>
                      <SelectItem value="Class 12">Class 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => handleInputChange("priority", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent / Critical Directive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned}
                      onChange={(e) => handleInputChange("is_pinned", e.target.checked)}
                      className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                    />
                    <Pin className="w-3.5 h-3.5 text-amber-600" /> Pin to Top of Dashboard
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Detailed Message Body *</label>
                <Textarea
                  placeholder="Provide full details, schedules, submission links, instructions or guidelines for students & teachers..."
                  rows={5}
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  className="text-xs leading-relaxed"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4"
                >
                  {isSubmitting ? "Publishing..." : "Broadcast Notice"}
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
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Notices</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pinned Directives</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pinned}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Pin className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Alerts</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">{stats.urgent}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic & Exams</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.academic}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search circulars, keywords, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-36 text-xs h-8">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="competition">Competitions</SelectItem>
              <SelectItem value="exam">Examinations</SelectItem>
              <SelectItem value="circular">Circulars</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32 text-xs h-8">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-medium">Loading institutional noticeboard feed...</p>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No notices found matching criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting your filters or post a new notice above.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <Card
              key={notice.id}
              className={`bg-white transition-all duration-200 hover:shadow-md ${
                notice.is_pinned
                  ? "border-l-4 border-l-amber-500 border-slate-200 shadow-sm"
                  : "border-slate-200/80 shadow-sm"
              }`}
            >
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {notice.is_pinned && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-600" /> Pinned Notice
                        </Badge>
                      )}
                      {getCategoryBadge(notice.category)}
                      {getPriorityBadge(notice.priority)}
                      {notice.target_class && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded border border-slate-200">
                          {notice.target_class}
                        </span>
                      )}
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-100">
                        Audience: {notice.target_audience.toUpperCase()}
                      </span>
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {notice.title}
                    </h2>

                    <p className="text-slate-600 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                      {notice.content}
                    </p>

                    {notice.attachments && notice.attachments.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 flex-wrap">
                        {notice.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 border border-indigo-200/70 px-2.5 py-1 rounded-lg font-medium transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{att.name || "Attachment"}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Action & Author Meta */}
                  <div className="flex md:flex-col items-end justify-between md:justify-start gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 shrink-0 text-right">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-semibold text-slate-800 flex items-center md:justify-end gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {notice.author_name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center md:justify-end gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(notice.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotice(notice.id)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
