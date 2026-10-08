"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  User,
  GraduationCap,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@teacher/components/ui/dialog";
import { Button } from "@teacher/components/ui/button";
import { Badge } from "@teacher/components/ui/badge";
import { Input } from "@teacher/components/ui/input";
import { subscribeToEvent } from "@/lib/realtime";

export default function TeacherDoubtChatModal({
  doubtId,
  open,
  onOpenChange,
  onDoubtUpdated = () => {},
}) {
  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const loadDoubt = async () => {
    if (!doubtId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teacher/doubts/${encodeURIComponent(doubtId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load doubt conversation");
      }
      const data = await res.json();
      setDoubt(data);
      setMessages(data.messages || []);
    } catch (err) {
      console.warn("[TeacherDoubtChatModal] load error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && doubtId) {
      loadDoubt();
    } else {
      setDoubt(null);
      setMessages([]);
    }
  }, [open, doubtId]);

  // Realtime updates
  useEffect(() => {
    if (!open || !doubtId) return;

    const unsubMsg = subscribeToEvent("doubt:message", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.doubtId === doubtId && payload?.message) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.message.id);
            if (exists) return prev;
            return [...prev, payload.message];
          });
          onDoubtUpdated();
        }
      } catch (e) {}
    });

    const unsubStatus = subscribeToEvent("doubt:status", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.doubtId === doubtId && payload?.status) {
          setDoubt((prev) => (prev ? { ...prev, status: payload.status } : prev));
          onDoubtUpdated();
        }
      } catch (e) {}
    });

    return () => {
      if (typeof unsubMsg === "function") unsubMsg();
      if (typeof unsubStatus === "function") unsubStatus();
    };
  }, [open, doubtId, onDoubtUpdated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendReply = async (e) => {
    e?.preventDefault();
    const text = replyText.trim();
    if (!text || sending || !doubtId) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/teacher/doubts/${encodeURIComponent(doubtId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send faculty reply");
      }

      const newMsg = await res.json();
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
      setDoubt((prev) => (prev ? { ...prev, status: "answered" } : prev));
      setReplyText("");
      onDoubtUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!doubtId || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/teacher/doubts/${encodeURIComponent(doubtId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDoubt((prev) => ({ ...prev, status: updated.status }));
        onDoubtUpdated();
      }
    } catch (err) {
      console.warn("Status change error:", err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge className="bg-violet-100 text-violet-800 border-none text-[11px] font-bold">
                {doubt?.subject || "Curriculum Doubt"}
              </Badge>
              <span className="text-xs font-bold text-slate-700">
                Student: {doubt?.student_name || "Student"} ({doubt?.student_class || "Class 8"})
              </span>
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {doubt?.title || "Doubt Session"}
            </DialogTitle>
            {doubt?.description && doubt.description !== doubt.title && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {doubt.description}
              </p>
            )}
          </div>

          {/* Quick status actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {doubt?.status !== "answered" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("answered")}
                disabled={updatingStatus}
                className="text-xs h-8 rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Mark Answered
              </Button>
            )}
            {doubt?.status !== "closed" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("closed")}
                disabled={updatingStatus}
                className="text-xs h-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Close Doubt
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("open")}
                disabled={updatingStatus}
                className="text-xs h-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reopen
              </Button>
            )}
          </div>
        </div>

        {/* Conversation Thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[460px] bg-white"
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Loading doubt history...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isTeacher = msg.sender_role === "teacher";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isTeacher ? "justify-end" : "justify-start"}`}
                >
                  {!isTeacher && (
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-slate-200">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 shadow-xs text-xs leading-relaxed ${
                      isTeacher
                        ? "bg-violet-600 text-white rounded-tr-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold ${
                          isTeacher ? "text-violet-200" : "text-violet-700"
                        }`}
                      >
                        {msg.sender_name || (isTeacher ? "You (Teacher)" : "Student")}
                      </span>
                      <span
                        className={`text-[9px] ${
                          isTeacher ? "text-violet-200/80" : "text-slate-400"
                        }`}
                      >
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap font-medium">{msg.message}</div>
                  </div>

                  {isTeacher && (
                    <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Teacher Reply Input */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write an explanation, example, or guidance for the student..."
              className="flex-1 bg-white border-slate-200 rounded-xl text-xs h-10 px-3.5 focus-visible:ring-violet-600"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Sending..." : "Reply"}</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
