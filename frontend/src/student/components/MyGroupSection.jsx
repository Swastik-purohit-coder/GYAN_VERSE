"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, MessageSquare, Paperclip, ChevronRight, Sparkles, FileText } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import GroupChatModal from "./GroupChatModal";
import { subscribeToEvent } from "@/lib/realtime";

export default function MyGroupSection() {
  const [groupInfo, setGroupInfo] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGroupData = useCallback(async () => {
    try {
      const [grpRes, msgRes] = await Promise.all([
        fetch("/api/student/group"),
        fetch("/api/student/group/messages"),
      ]);

      if (grpRes.ok) {
        const grp = await grpRes.json();
        setGroupInfo(grp?.group || null);
      }
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setRecentMessages(Array.isArray(msgs) ? msgs.slice(-3) : []);
      }
    } catch (err) {
      console.warn("[MyGroupSection] fetch warning:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  // Realtime updates
  useEffect(() => {
    const unsubMsg = subscribeToEvent("group:message", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.message) {
          setRecentMessages((prev) => [...prev.slice(-2), payload.message]);
          setUnreadCount((c) => c + 1);
        }
      } catch (e) {}
    });

    const unsubRes = subscribeToEvent("group:resource", () => {
      setUnreadCount((c) => c + 1);
    });

    return () => {
      if (typeof unsubMsg === "function") unsubMsg();
      if (typeof unsubRes === "function") unsubRes();
    };
  }, []);

  const handleOpenModal = () => {
    setUnreadCount(0);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-[#E2E8F0] shadow-xs bg-white p-5 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-3" />
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        onClick={handleOpenModal}
        className="rounded-2xl border border-[#E2E8F0] shadow-xs bg-white overflow-hidden hover:border-[#635BFF]/40 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black tracking-wider text-[#64748B] uppercase">
                    MY GROUP
                  </h4>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                      🔴 {unreadCount}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-sm text-[#172033] tracking-tight group-hover:text-[#635BFF] transition-colors mt-0.5">
                  {groupInfo?.name || "Class Learning Group"}
                </h3>
              </div>
            </div>

            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {groupInfo?.member_count || 24} Online
            </Badge>
          </div>

          {/* Recent Snippet Conversation Preview */}
          <div className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E2E8F0] mb-3 space-y-2">
            {recentMessages.length > 0 ? (
              recentMessages.map((m) => (
                <div key={m.id} className="text-xs">
                  <span className="font-bold text-[#172033]">
                    {m.sender_name?.split(" ")[0] || "Student"}:
                  </span>{" "}
                  <span className="text-[#64748B] line-clamp-1 inline">
                    {m.message?.startsWith("📎 Shared") ? (
                      <span className="text-[#635BFF] font-semibold inline-flex items-center gap-1">
                        <FileText className="w-3 h-3 inline" />
                        {m.message.replace(/^📎 Shared educational resource:\s*/, "")}
                      </span>
                    ) : (
                      m.message
                    )}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#64748B] italic">
                Active study channel for notes & lesson discussions.
              </p>
            )}
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9] text-xs">
            <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F59E0B]" />
              Class Study Squad
            </span>
            <span className="text-xs font-bold text-[#635BFF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Open Group Chat
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Card>

      {/* Realtime Modal */}
      <GroupChatModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        groupInfo={groupInfo}
        onActivity={fetchGroupData}
      />
    </>
  );
}
