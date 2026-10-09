"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users,
  Send,
  Paperclip,
  FileText,
  FileCode,
  Image as ImageIcon,
  Download,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
  FileCheck,
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

const DISALLOWED_EXTENSIONS = [
  "exe", "bat", "cmd", "sh", "bin", "msi", "vbs", "js", "py", "apk",
  "com", "scr", "jar", "ps1", "app",
];

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMessageTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChatModal({
  open,
  onOpenChange,
  groupInfo = null,
  onActivity = () => {},
}) {
  const [messages, setMessages] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "resources"
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Load group messages & shared resources
  const loadGroupData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [msgRes, resRes] = await Promise.all([
        fetch("/api/student/group/messages"),
        fetch("/api/student/group/resources"),
      ]);

      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setMessages(msgs || []);
      }
      if (resRes.ok) {
        const resData = await resRes.json();
        setResources(resData?.resources || []);
      }
    } catch (err) {
      console.warn("[GroupChatModal] Load error:", err.message);
      setErrorMessage("Failed to load group messages. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadGroupData();
    }
  }, [open]);

  // Realtime subscription for incoming group messages and shared educational resources
  useEffect(() => {
    if (!open) return;

    const unsubMsg = subscribeToEvent("group:message", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.message) {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.message.id);
            if (exists) return prev;
            return [...prev, payload.message];
          });
          onActivity();
        }
      } catch (e) {}
    });

    const unsubRes = subscribeToEvent("group:resource", (data) => {
      try {
        const payload = typeof data === "object" && data !== null ? data : JSON.parse(data || "{}");
        if (payload?.resource) {
          setResources((prev) => {
            const exists = prev.some((r) => r.id === payload.resource.id);
            if (exists) return prev;
            return [payload.resource, ...prev];
          });
          onActivity();
        }
      } catch (e) {}
    });

    return () => {
      if (typeof unsubMsg === "function") unsubMsg();
      if (typeof unsubRes === "function") unsubRes();
    };
  }, [open, onActivity]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current && activeTab === "chat") {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/student/group/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to post message");
      }

      const newMsg = await res.json();
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
      setInputText("");
      onActivity();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if needed
    e.target.value = "";

    const ext = file.name.split(".").pop().toLowerCase();
    if (DISALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(`Executable files (.${ext}) are not permitted for security.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("File exceeds the 25MB maximum limit.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/student/group/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          file_url: URL.createObjectURL(file), // Local preview url
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to share resource");
      }

      const newRes = await res.json();
      setResources((prev) => [newRes, ...prev]);
      onActivity();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName = "") => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FileText className="w-4 h-4 text-rose-500" />;
    if (lower.match(/\.(jpg|jpeg|png|webp|gif)$/)) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    return <FileCheck className="w-4 h-4 text-[#635BFF]" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#FAF8F5]/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#635BFF] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-extrabold text-[#172033] tracking-tight">
                  {groupInfo?.name || "Class Learning Group"}
                </DialogTitle>
                <Badge className="bg-[#EEF2FF] text-[#4F46E5] border-none text-[10px] font-bold">
                  {groupInfo?.target_class || "Your Class Cohort"}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {groupInfo?.member_count || 24} Students Online
                </span>
                <span>•</span>
                <span>Realtime Peer Discussion & Study Squad</span>
              </DialogDescription>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-white text-[#172033] shadow-xs"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              Group Chat
            </button>
            <button
              onClick={() => setActiveTab("resources")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "resources"
                  ? "bg-white text-[#172033] shadow-xs"
                  : "text-[#64748B] hover:text-[#172033]"
              }`}
            >
              <span>Resources</span>
              <span className="text-[10px] bg-[#635BFF] text-white px-1.5 py-0.2 rounded-full font-black">
                {resources.length}
              </span>
            </button>
          </div>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        {activeTab === "chat" ? (
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 bg-white"
          >
            {loading ? (
              <div className="py-16 text-center text-xs text-[#64748B] animate-pulse">
                Connecting to {groupInfo?.name || "Class Group"}...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#172033]">
                  Welcome to Your Class Group!
                </h4>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Say hi to your classmates, ask questions on today's lesson, or share notes.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_role === "student" && m.sender_id?.includes("current");
                const isFaculty = m.sender_role === "teacher";
                const isResourceNotice = m.resource_id || m.message?.startsWith("📎 Shared");

                return (
                  <div key={m.id} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-xs ${
                        isFaculty
                          ? "bg-[#635BFF] text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isFaculty ? (
                        <GraduationCap className="w-4 h-4" />
                      ) : (
                        (m.sender_name || "S").charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#172033]">
                          {m.sender_name || "Classmate"}
                        </span>
                        {isFaculty && (
                          <span className="text-[10px] bg-indigo-50 text-[#635BFF] font-extrabold px-1.5 py-0.2 rounded border border-indigo-200">
                            Teacher
                          </span>
                        )}
                        <span className="text-[10px] text-[#94A3B8]">
                          {formatMessageTime(m.created_at)}
                        </span>
                      </div>

                      {isResourceNotice ? (
                        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2E8F0] inline-flex items-center gap-3 max-w-md shadow-xs">
                          <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-rose-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#172033] truncate">
                              {m.message.replace(/^📎 Shared educational resource:\s*/, "")}
                            </p>
                            <p className="text-[10px] text-[#64748B]">
                              Educational Document • Shared with class
                            </p>
                          </div>
                          {m.file_url && (
                            <a
                              href={m.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#635BFF] hover:bg-slate-50 shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-[#334155] leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-2xl rounded-tl-xs inline-block max-w-[85%] whitespace-pre-wrap">
                          {m.message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Shared Resources Library Tab */
          <div className="flex-1 overflow-y-auto p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Class Shared Resources
                </h3>
                <p className="text-xs text-[#64748B]">
                  Download revision notes, solution keys, and study guides uploaded by your peers & mentor.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl text-xs font-bold h-8 px-3 shadow-xs flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{uploading ? "Sharing..." : "Share Resource"}</span>
              </Button>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-[#CBD5E1] rounded-2xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#172033]">No resources shared yet</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Be the first to share PDF revision notes with your class!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAF8F5] hover:border-[#635BFF]/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        {getFileIcon(res.file_name)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#172033] truncate">
                          {res.file_name}
                        </h4>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                          {formatFileSize(res.file_size)} • Shared by {res.sender_name || "Peer"}
                        </p>
                      </div>
                    </div>
                    {res.file_url && (
                      <a
                        href={res.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#635BFF] hover:text-[#5148E5] hover:bg-slate-50 shrink-0 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Bar (Only visible on chat tab) */}
        {activeTab === "chat" && (
          <div className="p-4 border-t border-[#E2E8F0] bg-slate-50">
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.ppt,.pptx,.txt"
            />

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Share educational resource (PDF, image, doc ≤ 25MB)"
                className="h-10 px-3 rounded-xl border-[#E2E8F0] bg-white text-slate-600 hover:text-[#635BFF] hover:bg-slate-100 shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message to your classmates..."
                className="flex-1 bg-white border-[#E2E8F0] rounded-xl text-xs h-10 px-3.5 focus-visible:ring-[#635BFF]"
                disabled={sending || uploading}
              />

              <Button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl h-10 px-4 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? "Sending..." : "Send"}</span>
              </Button>
            </form>
            <p className="text-[10px] text-slate-500 mt-1.5 text-center">
              Shared files must be educational (PDF, images, notes ≤ 25MB). Executables are prohibited.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
