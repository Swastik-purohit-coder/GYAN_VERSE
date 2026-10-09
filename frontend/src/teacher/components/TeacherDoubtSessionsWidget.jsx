"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  ChevronRight,
  User,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@teacher/components/ui/card";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import TeacherDoubtChatModal from "./TeacherDoubtChatModal";
import { subscribeToEvent } from "@/lib/realtime";

export default function TeacherDoubtSessionsWidget() {
  const [doubts, setDoubts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      console.warn("[TeacherDoubtSessionsWidget] fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

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

  const handleOpenDoubt = (id) => {
    setSelectedDoubtId(id);
    setModalOpen(true);
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
        Waiting
      </Badge>
    );
  };

  return (
    <>
      <Card className="bg-white/95 border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 text-violet-700">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Student Doubt Sessions
                </CardTitle>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                    🔴 {unreadCount} Waiting
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Questions submitted by assigned students needing faculty explanation
              </p>
            </div>
          </div>

          <Link
            href="/teacher/doubts"
            className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            View All ({doubts.length}) →
          </Link>
        </CardHeader>

        <CardContent className="p-5 pt-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
              Loading student doubts...
            </div>
          ) : doubts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No pending student doubts. All caught up!
            </div>
          ) : (
            <div className="space-y-3">
              {doubts.slice(0, 3).map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {d.student_name || "Student"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        • {d.student_class || "Class 8"}
                      </span>
                      <Badge className="bg-white border-slate-200 text-slate-700 text-[10px]">
                        {d.subject || "General"}
                      </Badge>
                      {getStatusBadge(d.status)}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      &ldquo;{d.title}&rdquo;
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenDoubt(d.id)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0 shadow-xs"
                  >
                    Open & Reply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeacherDoubtChatModal
        doubtId={selectedDoubtId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onDoubtUpdated={fetchDoubts}
      />
    </>
  );
}
