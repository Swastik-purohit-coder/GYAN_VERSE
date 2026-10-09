"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  Mail,
  Phone,
  BookOpen,
  School,
  Sparkles,
  MessageSquarePlus,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import AskDoubtDialog from "./AskDoubtDialog";
import DoubtChatModal from "./DoubtChatModal";
import { subscribeToEvent } from "@/lib/realtime";

export default function MyMentorCard({ onAskDoubt = null }) {
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doubt sessions state
  const [mentorDoubts, setMentorDoubts] = useState([]);
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const fetchMentor = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/mentor");
      if (!res.ok) throw new Error("Failed to load mentor details");
      const data = await res.json();
      setMentor(data?.mentor || null);
    } catch (err) {
      console.warn("[MyMentorCard] fetch error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDoubts = useCallback(async () => {
    try {
      const res = await fetch("/api/student/doubts");
      if (!res.ok) return;
      const data = await res.json();
      const list = data?.doubts || [];
      setMentorDoubts(list);
      // Pick the most recent active or answered doubt
      const current = list.find((d) => d.status === "open") || list[0] || null;
      setActiveDoubt(current);
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchMentor();
    fetchDoubts();
  }, [fetchMentor, fetchDoubts]);

  // Realtime updates
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

  const handleAskDoubtClick = () => {
    if (onAskDoubt && typeof onAskDoubt === "function") {
      onAskDoubt(mentor);
    }
    setAskDialogOpen(true);
  };

  const handleDoubtCreated = (newDoubt) => {
    fetchDoubts();
    if (newDoubt?.id) {
      setActiveChatId(newDoubt.id);
      setChatModalOpen(true);
    }
  };

  const handleOpenActiveChat = () => {
    if (activeDoubt?.id) {
      setActiveChatId(activeDoubt.id);
      setChatModalOpen(true);
    } else {
      setAskDialogOpen(true);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-[#E2E8F0] shadow-xs bg-white p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
          </div>
        </div>
        <div className="h-8 bg-slate-200 rounded-xl" />
      </Card>
    );
  }

  if (!mentor && !error) return null;

  const initials = mentor?.name
    ? mentor.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "FM";

  return (
    <>
      <Card className="rounded-2xl border border-[#E2E8F0] shadow-xs bg-white overflow-hidden hover:shadow-md transition-all">
        <div className="p-5">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-black tracking-wider text-[#64748B] uppercase">
                MY MENTOR
              </h4>
            </div>
            <Badge className="bg-[#EEF2FF] text-[#4F46E5] border-none text-[10px] font-semibold">
              Assigned Guide
            </Badge>
          </div>

          {/* Mentor Profile Overview */}
          <div className="flex items-start gap-3.5 mb-4">
            {mentor?.avatarUrl ? (
              <img
                src={mentor.avatarUrl}
                alt={mentor.name}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#635BFF]/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#635BFF] to-[#877fff] text-white flex items-center justify-center text-base font-black shadow-xs shrink-0">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-sm text-[#172033] tracking-tight truncate">
                {mentor?.name || "Assigned Faculty Guide"}
              </h3>
              <p className="text-xs text-[#635BFF] font-semibold truncate mt-0.5">
                {mentor?.role || "Subject Specialist"}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-[#64748B] mt-1 font-medium truncate">
                <span className="flex items-center gap-1 truncate">
                  <BookOpen className="w-3 h-3 shrink-0 text-slate-400" />
                  {mentor?.subject || "Curriculum"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 truncate">
                  <School className="w-3 h-3 shrink-0 text-slate-400" />
                  {mentor?.school || "School Faculty"}
                </span>
              </div>
            </div>
          </div>

          {/* Bio quote if available */}
          {mentor?.bio && (
            <p className="text-[11px] text-[#64748B] leading-relaxed mb-4 bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100 italic">
              &ldquo;{mentor.bio}&rdquo;
            </p>
          )}

          {/* Safe Contact details */}
          <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] mb-4 text-xs">
            {mentor?.email && (
              <div className="flex items-center gap-2 text-[#475569]">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-[11px] truncate">{mentor.email}</span>
              </div>
            )}
            {mentor?.phone && (
              <div className="flex items-center gap-2 text-[#475569]">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-[11px]">{mentor.phone}</span>
              </div>
            )}
          </div>

          {/* Active Doubt Session Status Banner (if exists) */}
          {activeDoubt && (
            <div className="mb-3.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2E8F0] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">
                    Active Session:
                  </span>
                  {activeDoubt.status === "answered" ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-bold">
                      Answered
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-bold">
                      Waiting for Reply
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-bold text-[#172033] truncate">
                  &ldquo;{activeDoubt.title}&rdquo;
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleOpenActiveChat}
                className="text-[#635BFF] hover:bg-[#F1EEFF] text-xs font-bold h-7 px-2 shrink-0"
              >
                Chat →
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {activeDoubt ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleOpenActiveChat}
                  className="bg-[#635BFF] hover:bg-[#5148E5] text-white font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAskDoubtClick}
                  className="border-[#E2E8F0] text-[#172033] hover:bg-slate-50 font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-[#635BFF]" />
                  New Doubt
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAskDoubtClick}
                className="w-full bg-[#635BFF] hover:bg-[#5148E5] text-white font-bold text-xs h-9 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Ask a Doubt
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Interactive Doubt Creation Dialog */}
      <AskDoubtDialog
        open={askDialogOpen}
        onOpenChange={setAskDialogOpen}
        mentor={mentor}
        onDoubtCreated={handleDoubtCreated}
      />

      {/* Live Threaded Doubt Chat Modal */}
      <DoubtChatModal
        doubtId={activeChatId}
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        onDoubtUpdated={fetchDoubts}
      />
    </>
  );
}
