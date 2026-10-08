"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { fetchUserRole } from "@/lib/users";
import apiClient from "@/lib/api";
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
  CheckCircle2,
  Lock,
  Flame,
  Star,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Clock,
  Info,
  Layers,
  HelpCircle,
} from "lucide-react";

function extractGradeNumber(classStr) {
  if (!classStr) return null;
  const match = String(classStr).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

const CATEGORY_MAP = {
  study_circle: { label: "Study Circle", color: "bg-blue-50 text-blue-700 border-blue-200", icon: BookOpen },
  hackathon_team: { label: "Hackathon Squad", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Trophy },
  olympiad_squad: { label: "Olympiad Team", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Star },
  science_club: { label: "Science & Tech Club", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Sparkles },
  peer_tutoring: { label: "Peer Revision Pod", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: Users },
};

export default function StudentGroupsPage() {
  const { user, isLoaded } = useUser();
  const [roleDoc, setRoleDoc] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [activeTab, setActiveTab] = useState("my_groups"); // 'my_groups' | 'explore'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Create Group Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // Group Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "study_circle",
    memberNames: "",
  });

  // Active Chat State
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // 1. Fetch Student Profile & Grade
  useEffect(() => {
    if (!isLoaded || !user?.id) {
      setRoleLoading(false);
      return;
    }
    let active = true;
    fetchUserRole(user.id)
      .then((doc) => {
        if (active) setRoleDoc(doc);
      })
      .catch(() => {
        if (active) setRoleDoc(null);
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isLoaded, user?.id]);

  const studentClass =
    roleDoc?.class ||
    user?.unsafeMetadata?.class ||
    (typeof window !== "undefined" ? localStorage.getItem("studentClass") : null) ||
    "Class 8";

  const studentName =
    roleDoc?.name ||
    user?.fullName ||
    user?.firstName ||
    "Student";

  const gradeNumber = extractGradeNumber(studentClass) ?? 8;
  const isEligibleForPersonalGroups = gradeNumber > 6;

  // 2. Fetch Groups from API
  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await fetch("/api/groups", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Failed to fetch student groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // 3. Load Messages when an active group is opened
  useEffect(() => {
    if (!activeGroup?.id) {
      setMessages([]);
      return;
    }
    let active = true;
    setChatLoading(true);

    fetch(`/api/groups/${encodeURIComponent(activeGroup.id)}/messages`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setMessages(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.warn("Failed to load group messages:", err);
      })
      .finally(() => {
        if (active) setChatLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeGroup?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeGroup?.id || sendingMessage) return;

    setSendingMessage(true);
    const tempText = chatInput.trim();
    setChatInput("");

    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(activeGroup.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_name: studentName,
          sender_role: "student",
          message: tempText,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // 4. Handle Personal Group Creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || creating) return;

    if (!isEligibleForPersonalGroups) {
      setCreateError("Students in Class 6 or below can only access faculty-assigned groups.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const peerList = formData.memberNames
        .split(",")
        .map((n, idx) => ({
          id: `peer_${Date.now()}_${idx}`,
          name: n.trim(),
          role: "member",
          class: studentClass,
        }))
        .filter((m) => m.name.length > 0);

      const leader = {
        id: user?.id || `std_${Date.now()}`,
        name: studentName,
        role: "leader",
        class: studentClass,
      };

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || "Student peer study group",
        category: formData.category,
        target_class: studentClass,
        mentor_name: "Self-Governed Peer Squad",
        leader_name: studentName,
        leader_id: user?.id || "student_me",
        members: [leader, ...peerList],
        is_student_created: true,
      };

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to create group");
      }

      const created = await res.json();
      setGroups((prev) => [created, ...prev]);
      setCreateSuccess(`Squad "${created.name}" created successfully!`);
      setFormData({
        name: "",
        description: "",
        category: "study_circle",
        memberNames: "",
      });
      setTimeout(() => {
        setIsCreateOpen(false);
        setCreateSuccess(null);
        setActiveGroup(created);
      }, 1000);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Filter groups
  const myGroups = useMemo(() => {
    return groups.filter((g) => {
      if (g.created_by === user?.id || g.leader_id === user?.id) return true;
      if (Array.isArray(g.members)) {
        return g.members.some(
          (m) =>
            m.id === user?.id ||
            m.userId === user?.id ||
            (m.name && m.name.toLowerCase() === studentName.toLowerCase())
        );
      }
      return false;
    });
  }, [groups, user?.id, studentName]);

  const displayedGroups = useMemo(() => {
    let list = activeTab === "my_groups" ? (myGroups.length ? myGroups : groups) : groups;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.mentor_name?.toLowerCase().includes(q) ||
          g.target_class?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "all") {
      list = list.filter((g) => g.category === selectedCategory);
    }

    return list;
  }, [activeTab, myGroups, groups, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* =========================================
          HEADER SECTION & STATS
         ========================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-7 h-7 text-[#635BFF]" />
              Peer Study Groups & Squads
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F1EEFF] text-[#635BFF] border border-[#635BFF]/20">
              {studentClass}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Collaborate on STEM projects, prepare for Olympiads, and solve doubts together with your classmates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isEligibleForPersonalGroups ? (
            <button
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
                setIsCreateOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#635BFF] text-white hover:bg-[#5249ea] transition-all flex items-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Study Circle
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Faculty-Curated Pods Mode (Class 1–6)</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          PARENTAL / GRADE POLICY BANNER
         ========================================= */}
      {!isEligibleForPersonalGroups ? (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-amber-900">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950 text-sm">
              Parental Safety & Guided Collaboration Active (Class {gradeNumber})
            </p>
            <p className="text-amber-800 leading-relaxed">
              As per Gyanaratna Child Safety Policies, students enrolled in <strong>Class 6 or below</strong> participate exclusively in verified, teacher-mentored study pods. You can access all group discussions, review notes, and collaborate with designated group members safely. Independent student-led squads unlock upon entering Class 7!
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-indigo-950">
          <Sparkles className="w-5 h-5 text-[#635BFF] shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-[#635BFF] text-sm">
              Senior Peer Squads Unlocked (Class {gradeNumber})
            </p>
            <p className="text-slate-600 leading-relaxed">
              You have authorization to launch personal study circles, build hackathon squads with your peers, and assign collaboration topics across {studentClass}.
            </p>
          </div>
        </div>
      )}

      {/* =========================================
          CONTROLS: TABS, SEARCH, CATEGORY FILTER
         ========================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("my_groups")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "my_groups"
                ? "bg-[#635BFF] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            My Squads & Study Pods ({myGroups.length})
          </button>
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "explore"
                ? "bg-[#635BFF] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            All School Groups ({groups.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search groups or mentors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            <option value="study_circle">Study Circles</option>
            <option value="hackathon_team">Hackathon Squads</option>
            <option value="olympiad_squad">Olympiad Cohorts</option>
            <option value="science_club">Science & Tech Clubs</option>
            <option value="peer_tutoring">Peer Tutoring</option>
          </select>
        </div>
      </div>

      {/* =========================================
          MAIN CONTENT: GROUPS GRID & CHAT DRAWER
         ========================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Group Cards */}
        <div className="lg:col-span-2 space-y-4">
          {loadingGroups ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-[#635BFF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-500">Loading student groups & study pods...</p>
            </div>
          ) : displayedGroups.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Peer Groups Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isEligibleForPersonalGroups
                  ? "You haven't joined or created any peer squads matching this filter. Start one above!"
                  : "Your teacher has not assigned you to a study pod in this category yet. Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedGroups.map((group) => {
                const catInfo = CATEGORY_MAP[group.category] || CATEGORY_MAP.study_circle;
                const IconComponent = catInfo.icon;
                const isSelected = activeGroup?.id === group.id;
                const isLeader = group.leader_id === user?.id || group.created_by === user?.id;

                return (
                  <div
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={`p-5 rounded-2xl bg-white border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-[#635BFF] ring-2 ring-[#635BFF]/20 shadow-md"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.color}`}
                        >
                          <IconComponent className="w-3 h-3" />
                          {catInfo.label}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {group.target_class}
                        </span>
                      </div>

                      {/* Group Title & Description */}
                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1.5">
                        {group.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {group.description || "Collaborative peer learning & problem-solving pod."}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          {group.mentor_name || (group.is_student_created ? "Peer Led" : "Faculty Guided")}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {group.member_count || group.members?.length || 1} Members
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{group.activity_score || 75}% Squad Activity</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroup(group);
                          }}
                          className="text-xs font-bold text-[#635BFF] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          Open Channel
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Integrated Group Discussion Channel / Chat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[580px] overflow-hidden">
          {activeGroup ? (
            <>
              {/* Channel Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {activeGroup.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeGroup.mentor_name} • {activeGroup.member_count || activeGroup.members?.length || 1} active members
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1EEFF] text-[#635BFF]">
                  Live
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAFAFC]">
                {chatLoading ? (
                  <div className="text-center py-8">
                    <div className="w-5 h-5 border-2 border-[#635BFF] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs text-slate-400">Loading channel messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">No messages yet</p>
                    <p className="text-[11px] text-slate-400">
                      Say hello to start the discussion with your squad!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.sender_name === studentName || msg.sender_id === user?.id;
                    const isMentor = msg.sender_role === "teacher" || msg.sender_role === "mentor";

                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400 font-medium">
                          <span className={isMentor ? "font-bold text-[#635BFF]" : "text-slate-600"}>
                            {msg.sender_name || "Member"}
                          </span>
                          {isMentor && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-700 font-bold">
                              Faculty
                            </span>
                          )}
                        </div>

                        <div
                          className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-[#635BFF] text-white rounded-tr-xs"
                              : isMentor
                              ? "bg-purple-50 text-purple-950 border border-purple-200 rounded-tl-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs"
                          }`}
                        >
                          {msg.message || msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or doubt..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingMessage}
                  className="p-2 rounded-xl bg-[#635BFF] text-white hover:bg-[#5249ea] disabled:opacity-40 transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Select a Squad</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Click any study circle on the left to view group announcements, collaborative notes, and chat with team members.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          MODAL: CREATE PEER GROUP (CLASS 7+)
         ========================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Peer Study Circle</h3>
                  <p className="text-xs text-slate-500">Form a study squad with your {studentClass} classmates</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum AI Explorers, Math Olympiad Circle"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30 font-medium"
                  >
                    <option value="study_circle">Study Circle</option>
                    <option value="hackathon_team">Hackathon Squad</option>
                    <option value="olympiad_squad">Olympiad Prep</option>
                    <option value="science_club">Science & Robotics Club</option>
                    <option value="peer_tutoring">Peer Revision Pod</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Grade
                  </label>
                  <input
                    type="text"
                    disabled
                    value={studentClass}
                    className="w-full px-3 py-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Squad Purpose / Objectives
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what this squad will learn, build, or practice together..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Invite Peer Classmates (Comma-separated names)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma, Rohan Varma, Ananya Iyer"
                  value={formData.memberNames}
                  onChange={(e) => setFormData((prev) => ({ ...prev, memberNames: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  You will be automatically designated as the Squad Captain.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !formData.name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#635BFF] text-white hover:bg-[#5249ea] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  {creating ? "Launching Squad..." : "Launch Peer Squad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
