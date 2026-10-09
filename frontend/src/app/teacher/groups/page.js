"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { Textarea } from "@teacher/components/ui/textarea";
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
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Trophy,
  Sparkles,
  Send,
  ShieldCheck,
  UserCheck,
  Award,
  Filter,
  CheckCircle2,
  Calendar,
  Flame,
  Star,
  BookOpen,
  Trash2,
  UserPlus,
  Check,
} from "lucide-react";

const SCHOOL_CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

export default function StudentGroupsPage() {
  const { user } = useUser();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Enrolled students for class picker
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Group Creation Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "hackathon_team",
    target_class: "Class 10",
    mentor_name: user?.fullName || "Prof. Arvind Sharma",
    leader_name: "",
  });

  // 1. Fetch Groups from API
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/groups", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Fetch enrolled students when target class changes
  useEffect(() => {
    if (!formData.target_class) return;
    fetch(`/api/students?class=${encodeURIComponent(formData.target_class)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableStudents(data);
        } else {
          // Fallback sample students for quick selection
          setAvailableStudents([
            { id: "std_1", name: "Aarav Mehta", class: formData.target_class },
            { id: "std_2", name: "Priya Sharma", class: formData.target_class },
            { id: "std_3", name: "Rohan Varma", class: formData.target_class },
            { id: "std_4", name: "Ananya Iyer", class: formData.target_class },
            { id: "std_5", name: "Kabir Das", class: formData.target_class },
            { id: "std_6", name: "Tanvi Patel", class: formData.target_class },
          ]);
        }
      })
      .catch(() => {
        setAvailableStudents([]);
      });
  }, [formData.target_class]);

  // 3. Load Chat Messages when active group chat changes
  useEffect(() => {
    if (!activeGroupChat?.id) {
      setChatMessages([]);
      return;
    }
    let active = true;
    setLoadingMessages(true);
    fetch(`/api/groups/${encodeURIComponent(activeGroupChat.id)}/messages`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setChatMessages(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch group messages:", err);
      })
      .finally(() => {
        if (active) setLoadingMessages(false);
      });

    return () => {
      active = false;
    };
  }, [activeGroupChat?.id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudentIds((prev) =>
      prev.some((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, { id: student.id, name: student.name, class: student.class || formData.target_class, role: "member" }]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const leaderName = formData.leader_name.trim() || selectedStudentIds[0]?.name || "Student Lead";
    const leaderId = selectedStudentIds[0]?.id || `lead_${Date.now()}`;

    const members = selectedStudentIds.length
      ? selectedStudentIds.map((s, idx) => ({
          ...s,
          role: s.id === leaderId || s.name === leaderName ? "leader" : "member",
        }))
      : [
          { id: leaderId, name: leaderName, role: "leader", class: formData.target_class },
          { id: `m_${Date.now()}_1`, name: "Priya Sharma", role: "member", class: formData.target_class },
          { id: `m_${Date.now()}_2`, name: "Rohan Varma", role: "member", class: formData.target_class },
        ];

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || "Faculty-assigned project and study pod",
      category: formData.category,
      target_class: formData.target_class,
      mentor_name: formData.mentor_name.trim() || user?.fullName || "Faculty In-Charge",
      leader_name: leaderName,
      leader_id: leaderId,
      members,
      is_faculty_managed: true,
      is_student_created: false,
    };

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setGroups((prev) => [created, ...prev]);
        setIsDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          category: "hackathon_team",
          target_class: "Class 10",
          mentor_name: user?.fullName || "Prof. Arvind Sharma",
          leader_name: "",
        });
        setSelectedStudentIds([]);
      }
    } catch (err) {
      alert("Failed to create group: " + err.message);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeGroupChat || sendingMessage) return;

    setSendingMessage(true);
    const text = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(activeGroupChat.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: user?.fullName || "Prof. Arvind Sharma (Mentor)",
          sender_role: "teacher",
          message: text,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setChatMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Failed to post mentor message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Are you sure you want to disband this student sub-group?")) return;
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`, { method: "DELETE" });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (activeGroupChat?.id === groupId) setActiveGroupChat(null);
      }
    } catch (err) {
      alert("Failed to delete group: " + err.message);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.mentor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.leader_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || g.category === selectedCategory;
      const matchesCls = selectedClass === "all" || g.target_class === selectedClass;
      return matchesSearch && matchesCat && matchesCls;
    });
  }, [groups, searchQuery, selectedCategory, selectedClass]);

  const stats = useMemo(() => {
    return {
      totalGroups: groups.length,
      hackathonTeams: groups.filter((g) => g.category === "hackathon_team").length,
      olympiadSquads: groups.filter((g) => g.category === "olympiad_squad").length,
      studyCircles: groups.filter((g) => g.category === "peer_tutoring" || g.category === "study_circle").length,
    };
  }, [groups]);

  const getCategoryBadge = (category) => {
    switch (category) {
      case "hackathon_team":
        return <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-[10px]"><Trophy className="w-3 h-3 mr-1 text-violet-600" /> Project Team</Badge>;
      case "olympiad_squad":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]"><Star className="w-3 h-3 mr-1 text-amber-600" /> Olympiad Squad</Badge>;
      case "science_club":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]"><Sparkles className="w-3 h-3 mr-1 text-emerald-600" /> Science & Tech Club</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]"><Users className="w-3 h-3 mr-1 text-blue-600" /> Study Circle</Badge>;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-violet-950 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-violet-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-violet-500/30 text-violet-200 border border-violet-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Peer Sub-Grouping & Collaboration Hub
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Student Sub-Groups & Competition Squads</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Group students into high-impact peer cohorts across all grades (Class 1–12), assign faculty mentors, and monitor student-initiated squads (Class 7+).
          </p>
        </div>

        {/* Create Group Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto cursor-pointer">
              <Plus className="w-4 h-4" /> Form New Student Squad
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-white text-slate-900 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" /> Create Student Sub-Group Cohort
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Configure student squad parameters, pick enrolled students from the roster, and assign mentor oversight.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateGroup} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Squad / Group Name *</label>
                <Input
                  placeholder="e.g., 🚀 Quantum AI Hackers or 📐 Class 9 Math Olympiad Elite"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Cohort Category</label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon_team">School Project & Science Fair Team</SelectItem>
                      <SelectItem value="olympiad_squad">Olympiad & Quiz Squad</SelectItem>
                      <SelectItem value="science_club">Science & Tech Project Club</SelectItem>
                      <SelectItem value="peer_tutoring">Peer Tutoring & Study Circle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Grade / Class</label>
                  <Select
                    value={formData.target_class}
                    onValueChange={(val) => handleInputChange("target_class", val)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Target Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHOOL_CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Faculty Mentor In-Charge</label>
                  <Input
                    placeholder="Prof. Arvind Sharma"
                    value={formData.mentor_name}
                    onChange={(e) => handleInputChange("mentor_name", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Student Team Leader</label>
                  <Input
                    placeholder="e.g., Aarav Mehta"
                    value={formData.leader_name}
                    onChange={(e) => handleInputChange("leader_name", e.target.value)}
                  />
                </div>
              </div>

              {/* Student Multi-Select Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Select Enrolled Students ({formData.target_class})
                  </label>
                  <span className="text-[11px] text-violet-600 font-bold">
                    {selectedStudentIds.length} students selected
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-40 overflow-y-auto space-y-1.5">
                  {availableStudents.map((st) => {
                    const isSelected = selectedStudentIds.some((s) => s.id === st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleStudentSelection(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                            {st.name?.[0]}
                          </span>
                          {st.name} ({st.rollNumber || st.id})
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mission & Purpose</label>
                <Textarea
                  placeholder="Describe the squad objectives, targeted competitions, meeting schedule..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={2}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                  Deploy Squad
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{stats.totalGroups}</div>
              <div className="text-xs text-slate-500 font-medium">Active Cohorts</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{stats.hackathonTeams}</div>
              <div className="text-xs text-slate-500 font-medium">Project Teams</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{stats.olympiadSquads}</div>
              <div className="text-xs text-slate-500 font-medium">Olympiad Pods</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900">86%</div>
              <div className="text-xs text-slate-500 font-medium">Peer Engagement</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search cohorts, mentors, students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px] text-xs h-9 bg-slate-50">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="hackathon_team">Project Squads</SelectItem>
              <SelectItem value="olympiad_squad">Olympiad Pods</SelectItem>
              <SelectItem value="science_club">Science & Tech</SelectItem>
              <SelectItem value="peer_tutoring">Study Circles</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[120px] text-xs h-9 bg-slate-50">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {SCHOOL_CLASSES.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing {filteredGroups.length} of {groups.length} squads
        </div>
      </div>

      {/* Main Content Grid: Groups List & Chat Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cohort Cards Column */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading student cohorts...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card className="bg-white border-dashed border-2 border-slate-200">
              <CardContent className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 text-sm">No Student Groups Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No groups match your current filters. Click &quot;Form New Student Squad&quot; above to create one.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map((group) => {
              const isSelected = activeGroupChat?.id === group.id;
              return (
                <Card
                  key={group.id}
                  className={`bg-white border transition-all cursor-pointer hover:shadow-md ${
                    isSelected ? "ring-2 ring-violet-500 border-violet-300 shadow-md" : "border-slate-200"
                  }`}
                  onClick={() => setActiveGroupChat(group)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{group.name}</h3>
                          {getCategoryBadge(group.category)}
                          <Badge variant="outline" className="text-[10px] font-bold bg-slate-50">
                            {group.target_class}
                          </Badge>
                          {group.is_student_created && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] border-amber-200">
                              Student Initiated (Class 7+)
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{group.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroupChat(group);
                          }}
                          className="text-xs h-8 text-violet-700 bg-violet-50 hover:bg-violet-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Discussion Feed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group.id);
                          }}
                          className="text-xs h-8 text-rose-600 hover:bg-rose-50 p-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Member Avatars & Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-violet-600" />
                          <span className="font-semibold text-slate-800">{group.mentor_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Lead: {group.leader_name || group.members?.[0]?.name || "Student Lead"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {group.member_count || group.members?.length || 1} Enrolled
                        </span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          {group.activity_score || 75}% Active
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Live Discussion & Collaboration Feed Panel */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-slate-200 shadow-xs h-[600px] flex flex-col">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-4 h-4 text-violet-600 shrink-0" />
                  {activeGroupChat ? activeGroupChat.name : "Cohort Discussion Channel"}
                </span>
                {activeGroupChat && (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] shrink-0">Live Channel</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-[11px]">
                {activeGroupChat
                  ? `${activeGroupChat.target_class} • Mentor: ${activeGroupChat.mentor_name}`
                  : "Select any squad on the left to monitor communication & provide faculty guidance."}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {loadingMessages ? (
                <div className="text-center py-12">
                  <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Loading discussion...</span>
                </div>
              ) : activeGroupChat ? (
                chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No messages yet</p>
                    <p className="text-[11px]">Send guidance or welcome the cohort members!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => {
                    const isMentor = msg.sender_role === "teacher" || msg.sender_role === "mentor";
                    return (
                      <div
                        key={msg.id || idx}
                        className={`p-3 rounded-xl text-xs space-y-1 ${
                          isMentor
                            ? "bg-violet-50 text-violet-950 border border-violet-200"
                            : "bg-white text-slate-800 border border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={`font-bold ${isMentor ? "text-violet-700" : "text-slate-700"}`}>
                            {msg.sender_name}
                          </span>
                          <span className="text-slate-400">
                            {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="leading-relaxed">{msg.message || msg.text}</p>
                      </div>
                    );
                  })
                )
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No Cohort Selected</p>
                  <p className="text-[11px] max-w-[200px] mx-auto">
                    Click any student squad to open the live discussion log.
                  </p>
                </div>
              )}
            </CardContent>

            {activeGroupChat && (
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <Input
                  placeholder="Post mentor guidance or note..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="text-xs h-9 bg-slate-50"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!chatInput.trim() || sendingMessage}
                  className="bg-violet-600 hover:bg-violet-700 text-white h-9 px-3"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
