"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import DoubtChatModal from "./DoubtChatModal";
import AskDoubtDialog from "./AskDoubtDialog";
import { subscribeToEvent } from "@/lib/realtime";

function formatRelativeTime(dateString) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function MyDoubtSessionsSection({ mentor = null, onMentorAsk = null }) {
  const [doubts, setDoubts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDoubtId, setSelectedDoubtId] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [askDialogOpen, setAskDialogOpen] = useState(false);

  const fetchDoubts = useCallback(async () => {
    try {
      const res = await fetch("/api/student/doubts");
      if (!res.ok) return;
      const data = await res.json();
      setDoubts(data?.doubts || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.warn("[MyDoubtSessionsSection] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  // Realtime updates when a teacher replies or status updates
  useEffect(() => {
    const unsubMsg = subscribeToEvent("doubt:message", () => {
      fetchDoubts();
    });
    const unsubStatus = subscribeToEvent("doubt:status", () => {
      fetchDoubts();
    });
    const unsubCreated = subscribeToEvent("doubt:created", () => {
      fetchDoubts();
    });

    return () => {
      if (typeof unsubMsg === "function") unsubMsg();
      if (typeof unsubStatus === "function") unsubStatus();
      if (typeof unsubCreated === "function") unsubCreated();
    };
  }, [fetchDoubts]);

  const handleOpenChat = (doubtId) => {
    setSelectedDoubtId(doubtId);
    setChatModalOpen(true);
  };

  const handleDoubtCreated = (newDoubt) => {
    fetchDoubts();
    if (newDoubt?.id) {
      setSelectedDoubtId(newDoubt.id);
      setChatModalOpen(true);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "answered") {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Answered
        </Badge>
      );
    }
    if (status === "closed") {
      return (
        <Badge className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
          Closed
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
        Waiting for Teacher
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#172033] tracking-tight leading-none">
                My Doubt Sessions
              </h2>
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                  🔴 {unreadCount} {unreadCount === 1 ? "reply" : "replies"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-1">
              Ask questions and get personalized 1-on-1 guidance from your assigned teacher
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setAskDialogOpen(true)}
          className="bg-[#635BFF] hover:bg-[#5148E5] text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Doubt</span>
        </Button>
      </div>

      {/* Doubts Grid / List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0] animate-pulse">
          Loading your doubt sessions...
        </div>
      ) : doubts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {doubts.map((d) => (
            <div
              key={d.id}
              onClick={() => handleOpenChat(d.id)}
              className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:border-[#635BFF]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Subject tag and status badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge className="bg-[#FAF8F5] text-[#172033] border border-slate-200 text-[10px] font-bold">
                    {d.subject || "General"}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {d.unread_by_student && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                    )}
                    {getStatusBadge(d.status)}
                  </div>
                </div>

                {/* Question title */}
                <h3 className="font-extrabold text-sm text-[#172033] tracking-tight group-hover:text-[#635BFF] transition-colors line-clamp-2 mb-1.5">
                  {d.title}
                </h3>

                {/* Description snippet */}
                {d.description && (
                  <p className="text-xs text-[#64748B] line-clamp-2 mb-3">
                    {d.description}
                  </p>
                )}
              </div>

              {/* Bottom footer: Mentor name + Updated time */}
              <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                <div className="flex items-center gap-1.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-[#635BFF] shrink-0" />
                  <span className="truncate font-semibold text-slate-700">
                    {d.teacher_name || "Faculty Mentor"}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 font-medium text-slate-500">
                  <span>Updated {formatRelativeTime(d.updated_at || d.created_at)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-[#172033]">
            No doubts submitted yet
          </h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto mb-4">
            Stuck on a tricky homework problem or curiosity question? Ask your teacher and get guidance in real time.
          </p>
          <Button
            size="sm"
            onClick={() => setAskDialogOpen(true)}
            className="bg-[#635BFF] hover:bg-[#5148E5] text-white font-bold text-xs h-8 px-4 rounded-xl shadow-xs"
          >
            + Ask Your First Doubt
          </Button>
        </Card>
      )}

      {/* Interactive Doubt Chat Thread Modal */}
      <DoubtChatModal
        doubtId={selectedDoubtId}
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        onDoubtUpdated={fetchDoubts}
      />

      {/* Ask Doubt Dialog */}
      <AskDoubtDialog
        open={askDialogOpen}
        onOpenChange={setAskDialogOpen}
        mentor={mentor}
        onDoubtCreated={handleDoubtCreated}
      />
    </div>
  );
}
