"use client";

import { useState } from "react";
import { HelpCircle, Send, Sparkles, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const POPULAR_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Robotics & AI",
  "Computer Science",
  "Social Science",
  "Analytical Logic",
];

export default function AskDoubtDialog({
  open,
  onOpenChange,
  mentor,
  onDoubtCreated = () => {},
}) {
  const [subject, setSubject] = useState("Mathematics");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/student/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to submit doubt");
      }

      const newDoubt = await res.json();
      setTitle("");
      setDescription("");
      onOpenChange(false);
      onDoubtCreated(newDoubt);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-[#172033] tracking-tight">
              Ask a Doubt
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#64748B]">
            Submit a question directly to your mentor. You can chat and receive guided explanations.
          </DialogDescription>
        </DialogHeader>

        {mentor && (
          <div className="mb-4 p-3 rounded-xl bg-[#FAF8F5] border border-[#E2E8F0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#172033] truncate">
                Mentor: {mentor.name}
              </p>
              <p className="text-[10px] text-[#64748B] truncate">
                {mentor.role} • {mentor.subject}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Selector */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1.5">
              Subject
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SUBJECTS.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    subject === sub
                      ? "bg-[#635BFF] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Doubt Title */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1.5">
              Question Title / Core Doubt *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Why is 1/2 equal to 2/4?"
              className="bg-white border-[#E2E8F0] rounded-xl text-xs h-10 px-3.5 focus-visible:ring-[#635BFF]"
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="text-xs font-bold text-[#172033] block mb-1.5">
              Details & What You Have Tried (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what part is confusing or what step you got stuck on..."
              rows={3}
              className="bg-white border-[#E2E8F0] rounded-xl text-xs p-3 focus-visible:ring-[#635BFF] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl h-9 border-[#E2E8F0] text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || loading}
              className="bg-[#635BFF] hover:bg-[#5148E5] text-white rounded-xl h-9 px-4 font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Submitting..." : "Submit Doubt"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
