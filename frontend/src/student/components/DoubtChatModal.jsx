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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { subscribeToEvent } from "@/lib/realtime";

export default function DoubtChatModal({
  doubtId,
  open,
  onOpenChange,
  onDoubtUpdated = () => {},
}) {
  const [doubt, setDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Fetch doubt details and message thread
  const loadDoubt = async () => {
    if (!doubtId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/student/doubts/${encodeURIComponent(doubtId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load doubt conversation");
      }
      const data = await res.json();
      setDoubt(data);
      setMessages(data.messages || []);
    } catch (err) {
      console.warn("[DoubtChatModal] load error:", err.message);
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

  // Realtime listener for incoming replies & status changes
  useEffect(() => {
    if (!open || !doubtId) return;

    const unsubscribeMsg = subscribeToEvent("doubt:message", (data) => {
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
      } catch (e) {
        // ignore parse error
      }
    });

    const unsubscribeStatus = subscribeToEvent("doubt:status", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.doubtId === doubtId && payload?.status) {
          setDoubt((prev) => (prev ? { ...prev, status: payload.status } : prev));
          onDoubtUpdated();
        }
      } catch (e) {}
    });

    return () => {
      if (typeof unsubscribeMsg === "function") unsubscribeMsg();
      if (typeof unsubscribeStatus === "function") unsubscribeStatus();
    };
  }, [open, doubtId, onDoubtUpdated]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text || sending || !doubtId) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/student/doubts/${encodeURIComponent(doubtId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to send message");
      }

      const newMsg = await res.json();
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
      setInputMessage("");
      onDoubtUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleToggleStatus = async (newStatus) => {
    if (!doubtId) return;
    try {
      const res = await fetch(`/api/student/doubts/${encodeURIComponent(doubtId)}`, {
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
      console.warn("Toggle status error:", err.message);
    }
  };

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
        Waiting for Teacher
      </Badge>
    );
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#FAF8F5]/80 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge className="bg-[#F1EEFF] text-[#635BFF] border-none text-[11px] font-bold">
                {doubt?.subject || "Subject Doubt"}
              </Badge>
              {getStatusBadge(doubt?.status)}
              {doubt?.teacher_name && (
                <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#635BFF]" />
                  Mentor: {doubt.teacher_name}
                </span>
              )}
            </div>
            <DialogTitle className="text-base font-extrabold text-[#172033] tracking-tight leading-snug">
              {doubt?.title || "Doubt Session"}
            </DialogTitle>
            {doubt?.description && doubt.description !== doubt.title && (
              <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                {doubt.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {doubt?.status === "answered" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus("closed")}
                className="text-xs h-8 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Mark Resolved
              </Button>
            )}
            {doubt?.status === "closed" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus("open")}
                className="text-xs h-8 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reopen
              </Button>
            )}
          </div>
        </div>

        {/* Message Thread Body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[460px] bg-white"
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-[#64748B] animate-pulse">
              Loading conversation thread...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center mx-auto mb-3">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#172033]">
                Doubt Session Opened
              </h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Your assigned mentor has received this question and will reply shortly.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isStudent = msg.sender_role === "student";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isStudent ? "justify-end" : "justify-start"}`}
                >
                  {!isStudent && (
                    <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 shadow-xs text-xs leading-relaxed ${
                      isStudent
                        ? "bg-[#635BFF] text-white rounded-tr-xs"
                        : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] rounded-tl-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold ${
                          isStudent ? "text-indigo-200" : "text-[#635BFF]"
                        }`}
                      >
                        {msg.sender_name || (isStudent ? "You" : "Teacher")}
                        {!isStudent && (
                          <span className="ml-1 text-[9px] bg-indigo-100 text-[#635BFF] px-1 py-0.2 rounded font-semibold">
                            Faculty
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[9px] ${
                          isStudent ? "text-indigo-200/80" : "text-[#94A3B8]"
                        }`}
                      >
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap font-medium">{msg.message}</div>
                  </div>

                  {isStudent && (
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Reply Input Bar */}
        <div className="p-4 border-t border-[#E2E8F0] bg-slate-50">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or follow-up question..."
              className="flex-1 bg-white border-[#E2E8F0] rounded-xl text-xs h-10 px-3.5 focus-visible:ring-[#635BFF]"
              disabled={sending || doubt?.status === "closed"}
            />
            <Button
              type="submit"
              disabled={!inputMessage.trim() || sending || doubt?.status === "closed"}
              className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? "Sending..." : "Send"}</span>
            </Button>
          </form>
          {doubt?.status === "closed" && (
            <p className="text-[10px] text-slate-500 mt-1.5 text-center">
              This doubt session is closed. Click "Reopen" in the header to continue the conversation.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
