"use client";

import { useState, useMemo } from "react";
import { useStudentGroups, useGroupMessages } from "@/hooks/useDashboardFeatures";
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
} from "lucide-react";

export default function StudentGroupsPage() {
  const { user } = useUser();
  const { groups, loading, addGroup } = useStudentGroups();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  const [chatInput, setChatInput] = useState("");

  // Group Creation Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "hackathon_team",
    target_class: "Class 10",
    mentor_name: user?.fullName || "Prof. Arvind Sharma",
    leader_name: "Aarav Mehta",
    member_names: "Priya Sharma, Rohan Varma, Ananya Iyer",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const memberList = formData.member_names
      .split(",")
      .map((name, idx) => ({
        id: `m_${Date.now()}_${idx}`,
        name: name.trim(),
        role: "member",
        class: formData.target_class,
      }))
      .filter((m) => m.name.length > 0);

    const leaderMember = {
      id: `m_lead_${Date.now()}`,
      name: formData.leader_name.trim() || "Student Lead",
      role: "leader",
      class: formData.target_class,
    };

    const payload = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      target_class: formData.target_class,
      mentor_name: formData.mentor_name,
      members: [leaderMember, ...memberList],
    };

    await addGroup(payload);
    setIsDialogOpen(false);
    setFormData({
      name: "",
      description: "",
      category: "hackathon_team",
      target_class: "Class 10",
      mentor_name: user?.fullName || "Prof. Arvind Sharma",
      leader_name: "",
      member_names: "",
    });
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.mentor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description?.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Mock initial chat messages for selected group
  const [messagesMap, setMessagesMap] = useState({
    group_1: [
      { id: "msg_1", sender: "Prof. Arvind Sharma", role: "mentor", text: "Great work on the ML model prototype squad! Don't forget to submit the pitch deck before Friday.", time: "10:30 AM" },
      { id: "msg_2", sender: "Aarav Mehta", role: "leader", text: "Thanks Professor! Priya and Rohan are polishing the slide transitions right now.", time: "10:35 AM" },
      { id: "msg_3", sender: "Priya Sharma", role: "member", text: "Tested the real-time inference latency, down to 180ms! Ready for demo.", time: "10:42 AM" },
    ],
  });

  const activeMessages = activeGroupChat ? messagesMap[activeGroupChat.id] || [
    { id: "msg_init", sender: activeGroupChat.mentor_name || "Faculty Mentor", role: "mentor", text: `Welcome to the ${activeGroupChat.name} squad workspace! Use this channel to coordinate projects, discuss competition tactics, and solve doubts.`, time: "Just now" }
  ] : [];

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeGroupChat) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      sender: user?.fullName || "Faculty In-Charge",
      role: "mentor",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeGroupChat.id]: [...(prev[activeGroupChat.id] || []), newMsg],
    }));
    setChatInput("");
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "hackathon_team":
        return <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-[10px]"><Trophy className="w-3 h-3 mr-1 text-violet-600" /> Hackathon Team</Badge>;
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
            Group students into high-impact peer cohorts, assign faculty mentors, monitor peer discussion channels, and track competition readiness.
          </p>
        </div>

        {/* Create Group Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/25 px-5 py-2.5 rounded-xl flex items-center gap-2 self-start md:self-auto">
              <Plus className="w-4 h-4" /> Form New Student Squad
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-2xl bg-white text-slate-900">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" /> Create Student Sub-Group Cohort
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">
                Configure student squad parameters, mentor oversight, and competition track focus.
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
                      <SelectItem value="hackathon_team">Hackathon & Innovation Team</SelectItem>
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Initial Student Members (Comma-separated)</label>
                <Input
                  placeholder="Priya Sharma, Rohan Varma, Ananya Iyer, Kabir Das"
                  value={formData.member_names}
                  onChange={(e) => handleInputChange("member_names", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Mission & Purpose</label>
                <Textarea
                  placeholder="Describe the squad objectives, targeted competitions, meeting schedule..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold">
                  Form Sub-Group
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
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Cohorts</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalGroups}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hackathon Squads</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{stats.hackathonTeams}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Olympiad Teams</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{stats.olympiadSquads}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Peer Circles</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.studyCircles}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search squad name, mentor, description..."
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
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Squad Types</SelectItem>
              <SelectItem value="hackathon_team">Hackathon Teams</SelectItem>
              <SelectItem value="olympiad_squad">Olympiad Squads</SelectItem>
              <SelectItem value="science_club">Science Clubs</SelectItem>
              <SelectItem value="peer_tutoring">Study Circles</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32 text-xs h-8">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
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

      {/* Main Content Area: Groups Grid + Live Peer Channel Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Squad Cards */}
        <div className="lg:col-span-2 space-y-4">
          {filteredGroups.map((group) => {
            const isSelected = activeGroupChat?.id === group.id;
            return (
              <Card
                key={group.id}
                className={`bg-white transition-all duration-200 hover:shadow-md cursor-pointer ${
                  isSelected ? "ring-2 ring-violet-600 border-transparent shadow-md" : "border-slate-200/80"
                }`}
                onClick={() => setActiveGroupChat(group)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(group.category)}
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {group.target_class}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-600" /> {group.activity_score || 85}% Activity
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">{group.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{group.description}</p>
                    </div>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`text-xs self-start shrink-0 ${isSelected ? "bg-violet-600 text-white" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGroupChat(group);
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      {isSelected ? "Channel Active" : "Open Channel"}
                    </Button>
                  </div>

                  {/* Members and Leadership Strip */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Faculty Mentor:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-violet-600" /> {group.mentor_name || "Assigned Faculty"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Team Roster:</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(group.members || []).slice(0, 4).map((member, i) => (
                          <div
                            key={i}
                            title={`${member.name} (${member.role || "member"})`}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-[9px] font-bold text-center leading-6"
                          >
                            {member.name?.[0] || "M"}
                          </div>
                        ))}
                        {(group.members?.length || 0) > 4 && (
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 text-[9px] font-bold text-center leading-6">
                            +{(group.members?.length || 0) - 4}
                          </div>
                        )}
                      </div>
                      <span className="text-slate-500 font-semibold text-[11px]">
                        ({group.members?.length || group.member_count || 1} members)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Col: Live Peer Discussion & Mentorship Workspace */}
        <div className="lg:col-span-1">
          <Card className="bg-white border-slate-200/80 shadow-md h-[600px] flex flex-col sticky top-24">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-slate-900 leading-tight">
                      {activeGroupChat ? activeGroupChat.name : "Peer Discussion Channel"}
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      {activeGroupChat ? `Mentor Channel • ${activeGroupChat.target_class}` : "Select a group to join discussion"}
                    </CardDescription>
                  </div>
                </div>
                {activeGroupChat && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">Live</Badge>
                )}
              </div>
            </CardHeader>

            {/* Chat Messages Feed */}
            <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeGroupChat ? (
                activeMessages.map((msg) => {
                  const isMentor = msg.role === "mentor";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMentor ? "items-end" : "items-start"} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className={`font-bold ${isMentor ? "text-violet-600" : "text-slate-700"}`}>
                          {msg.sender}
                        </span>
                        {msg.role === "leader" && (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1 rounded">Lead</span>
                        )}
                        <span>• {msg.time}</span>
                      </div>
                      <div
                        className={`text-xs p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          isMentor
                            ? "bg-violet-600 text-white rounded-tr-none shadow-sm"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No Squad Selected</p>
                  <p className="text-[11px] text-slate-400 mt-1">Click on any peer group card on the left to monitor discussion and post guidance prompts.</p>
                </div>
              )}
            </CardContent>

            {/* Chat Input Footer */}
            {activeGroupChat && (
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <Input
                  placeholder="Post mentor guidance or prompt..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 focus:bg-white flex-1"
                />
                <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white h-9 px-3">
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
