"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, X, Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import FormattedMarkdown from "./FormattedMarkdown";

const SUGGESTED_TOPICS = [
  "Photosynthesis",
  "Pythagoras Theorem",
  "Fractions",
  "Water Cycle",
];

export default function FloatingGyanBot({
  query,
  setQuery,
  history = [],
  loading = false,
  error = null,
  onSubmit,
  onKeyDown,
  renderFormattedText,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSuggestionClick = (topic) => {
    if (typeof onSubmit === "function") {
      onSubmit(topic);
    }
  };

  return (
    <>
      {/* =========================================================
          FLOATING CHAT PANEL (EXPANDED VIEW)
         ========================================================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="fixed z-50 bottom-[148px] right-4 left-4 sm:left-auto sm:right-6 sm:bottom-24 w-auto sm:w-[385px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-170px)] bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl shadow-[#172033]/15 flex flex-col overflow-hidden text-[#172033]"
            role="dialog"
            aria-modal="true"
            aria-label="Gyan-Bot Chat Assistant"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F1EEFF] text-[#635BFF] flex items-center justify-center shadow-xs shrink-0">
                  <Brain className="w-5 h-5 text-[#635BFF]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-sm text-[#172033] tracking-tight leading-none">
                      Gyan-Bot
                    </h3>
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#22C55E] text-[9px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] font-medium mt-1">
                    Your AI Study Buddy
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-[#F1EEFF] flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#635BFF]/30"
                aria-label="Close Gyan-Bot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-[#FAFAFD]">
              {/* Empty / Welcome State */}
              {history.length === 0 && (
                <div className="py-6 px-3 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F1EEFF] to-[#E0DAFF] text-[#635BFF] flex items-center justify-center mx-auto shadow-xs">
                    <Sparkles className="w-6 h-6 text-[#635BFF]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#172033]">
                      How can I help you today?
                    </h4>
                    <p className="text-xs text-[#64748B] max-w-[260px] mx-auto leading-relaxed">
                      Ask me any question about Science, Math, English, or your school topics!
                    </p>
                  </div>
                </div>
              )}

              {/* Message History */}
              {history.map((entry, idx) => {
                const messageKey = entry.id || `${entry.role}-${idx}-${(entry.content || "").slice(0, 16)}`;
                return (
                  <div
                    key={messageKey}
                    className={`flex flex-col ${
                      entry.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1 px-1">
                      {entry.role === "user" ? "You" : "Gyan-Bot"}
                    </span>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[88%] shadow-2xs ${
                        entry.role === "user"
                          ? "bg-[#635BFF] text-white rounded-br-sm font-medium"
                          : "bg-white text-[#172033] border border-[#E2E8F0] rounded-bl-sm"
                      }`}
                    >
                      {entry.role === "user" ? (
                        entry.content
                      ) : (
                        <FormattedMarkdown content={entry.content} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing / Loading indicator */}
              {loading && (
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] px-1">
                    Gyan-Bot
                  </span>
                  <div className="p-3 rounded-2xl rounded-bl-sm bg-white border border-[#E2E8F0] text-xs text-[#64748B] flex items-center gap-2 shadow-2xs">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-[#64748B] font-medium">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="px-4 pt-2.5 pb-1 bg-white border-t border-[#F1F3F9]">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleSuggestionClick(topic)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#F1EEFF] hover:bg-[#E0DAFF] text-[#635BFF] transition-all hover:scale-[1.02] border border-[#E0DAFF]/40"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box Area */}
            <div className="p-3.5 bg-white space-y-2">
              <div className="relative flex items-center rounded-xl border border-[#E2E8F0] bg-[#F7F8FC] focus-within:border-[#635BFF] focus-within:ring-2 focus-within:ring-[#635BFF]/20 transition-all p-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask about Science, Math, etc..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-transparent pl-3 pr-9 py-1.5 text-xs text-[#172033] focus:outline-none placeholder:text-[#94A3B8]"
                  aria-label="Ask Gyan-Bot a question"
                />
                <button
                  onClick={() => onSubmit()}
                  disabled={loading || !query.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-[#635BFF] hover:bg-[#5148E5] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs"
                  aria-label="Send question"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Footer link: Open Full Screen Chat */}
              <div className="flex items-center justify-between px-1 pt-0.5">
                <Link
                  href="/student/study-buddy"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] hover:text-[#5148E5] hover:underline transition-colors"
                >
                  <span>Open Full Screen Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-[10px] text-[#94A3B8]">Powered by AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          FLOATING ASSISTANT BUTTON TRIGGER (ALWAYS VISIBLE)
         ========================================================= */}
      <div
        className="fixed z-50 bottom-[84px] right-5 sm:bottom-6 sm:right-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Desktop Tooltip */}
        <AnimatePresence>
          {!isOpen && isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#172033] text-white text-xs font-semibold shadow-lg pointer-events-none"
            >
              Ask Gyan-Bot
              <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-[#172033]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Floating Button */}
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          animate={
            isOpen
              ? { scale: 1, y: 0 }
              : {
                  y: [0, -3.5, 0],
                }
          }
          transition={
            isOpen
              ? { duration: 0.2 }
              : {
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-white via-[#FAF9FF] to-[#F1EEFF] border-2 border-[#E2E8F0] hover:border-[#635BFF]/50 shadow-lg shadow-[#635BFF]/20 hover:shadow-xl hover:shadow-[#635BFF]/30 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-[#635BFF]/20 cursor-pointer"
          aria-label="Ask Gyan-Bot - AI Study Buddy"
          aria-expanded={isOpen}
        >
          {/* Subtle soft pulse glow ring */}
          <span className="absolute inset-0 rounded-full bg-[#635BFF]/10 animate-ping opacity-40 pointer-events-none" />

          {/* Icon morph: Brain when closed, X when open */}
          {isOpen ? (
            <X className="w-6 h-6 text-[#635BFF]" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-[#635BFF]" />
              {/* Mini Sparkle Accent */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#635BFF] text-white flex items-center justify-center">
                <Sparkles className="w-2 h-2" />
              </span>
            </div>
          )}
        </motion.button>
      </div>
    </>
  );
}
