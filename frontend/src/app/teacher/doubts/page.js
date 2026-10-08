"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  GraduationCap,
  Search,
  Filter,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import TeacherDoubtChatModal from "@/teacher/components/TeacherDoubtChatModal";
import { subscribeToEvent } from "@/lib/realtime";

export default function TeacherDoubtsPage() {
  const [doubts, setDoubts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // "all" | "open" | "answered" | "closed"
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoubtId, setSelectedDoubtId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDoubts = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/doubts");
      if (!res.ok) return;
      const data = await res.json();
      setDoubts(data?.doubts || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.warn("[TeacherDoubtsPage] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  useEffect(() => {
    const unsubMsg = subscribeToEvent("doubt:message", () => fetchDoubts());
    const unsubCreated = subscribeToEvent("doubt:created", () => fetchDoubts());
    const unsubStatus = subscribeToEvent("doubt:status", () => fetchDoubts());

    return () => {
      if (typeof unsubMsg === "function") unsubMsg();
      if (typeof unsubCreated === "function") unsubCreated();
      if (typeof unsubStatus === "function") unsubStatus();
    };
  }, [fetchDoubts]);

  const filteredDoubts = doubts.filter((d) => {
    if (filter === "open" && d.status !== "open") return false;
    if (filter === "answered" && d.status !== "answered") return false;
    if (filter === "closed" && d.status !== "closed") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (d.title || "").toLowerCase().includes(q);
      const matchName = (d.student_name || "").toLowerCase().includes(q);
      const matchSub = (d.subject || "").toLowerCase().includes(q);
      return matchTitle || matchName || matchSub;
    }
    return true;
  });

  const waitingCount = doubts.filter((d) => d.status === "open").length;
  const answeredCount = doubts.filter((d) => d.status === "answered").length;
  const closedCount = doubts.filter((d) => d.status === "closed").length;

  const getStatusBadge = (status) => {
    if (status === "answered") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Answered
        </Badge>
      );
    }
    if (status === "closed") {
      return (
        <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
          Closed
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        Waiting for Reply
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Student Doubt Sessions</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-rose-500 text-white font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review academic questions asked by your students, provide replies, and guide concepts in real time.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white/95 border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Doubts</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{doubts.length}</p>
        </Card>
        <Card className="bg-white/95 border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-amber-600">Waiting for Reply</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{waitingCount}</p>
        </Card>
        <Card className="bg-white/95 border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600">Answered</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{answeredCount}</p>
        </Card>
        <Card className="bg-white/95 border-slate-200 p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Resolved & Closed</span>
          <p className="text-2xl font-black text-slate-600 mt-1">{closedCount}</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: `All (${doubts.length})` },
            { id: "open", label: `Waiting (${waitingCount})` },
            { id: "answered", label: `Answered (${answeredCount})` },
            { id: "closed", label: `Closed (${closedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab.id
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doubt or student..."
            className="pl-9 bg-white border-slate-200 text-xs h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Doubts List */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500 animate-pulse bg-white rounded-2xl border border-slate-200">
          Loading student doubts...
        </div>
      ) : filteredDoubts.length === 0 ? (
        <Card className="p-12 text-center bg-white border-dashed border-slate-300 rounded-2xl">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No doubt sessions found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {filter === "open"
              ? "No doubts waiting for faculty reply right now."
              : "No doubts match your search filter."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDoubts.map((d) => (
            <Card
              key={d.id}
              className="bg-white border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900">
                    {d.student_name || "Student"}
                  </span>
                  <span className="text-xs text-slate-500">
                    • {d.student_class || "Class 8"}
                  </span>
                  <Badge className="bg-slate-100 text-slate-700 border-none text-[11px] font-semibold">
                    {d.subject || "General"}
                  </Badge>
                  {getStatusBadge(d.status)}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  &ldquo;{d.title}&rdquo;
                </h3>
                {d.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {d.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => {
                    setSelectedDoubtId(d.id);
                    setModalOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs"
                >
                  Open & Reply
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      <TeacherDoubtChatModal
        doubtId={selectedDoubtId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onDoubtUpdated={fetchDoubts}
      />
    </div>
  );
}
