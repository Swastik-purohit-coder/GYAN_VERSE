"use client";

import React, { memo, Component, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

// Graceful Error Boundary
class MarkdownErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Markdown rendering error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#172033]">
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

// Interactive Code Block with Copy Button
function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeText = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Copy failed", e);
    }
  };

  // Inline code
  if (!match && !codeText.includes("\n")) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-[#F1EEFF] text-[#635BFF] font-mono text-[12px] font-semibold">
        {children}
      </code>
    );
  }

  // Multi-line block code
  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#1E293B] text-slate-100 text-xs shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0F172A] border-b border-slate-700/60 text-[11px] font-mono text-slate-400">
        <span className="uppercase tracking-wider">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

const customComponents = {
  // Use div to avoid invalid nested p tag issues with block children
  p: ({ children }) => <div className="mb-2.5 last:mb-0 leading-relaxed text-[#1E293B]">{children}</div>,
  h1: ({ children }) => <h1 className="text-lg font-bold text-[#0F172A] mt-4 mb-2 pb-1 border-b border-slate-200">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold text-[#0F172A] mt-3.5 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold text-[#635BFF] mt-3 mb-1.5 flex items-center gap-1.5">{children}</h3>,
  h4: ({ children }) => <h4 className="text-xs font-bold text-[#0F172A] mt-2.5 mb-1 uppercase tracking-wider">{children}</h4>,
  ul: ({ children }) => <ul className="mb-3 list-disc list-outside pl-5 space-y-1 text-[#334155]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal list-outside pl-5 space-y-1 text-[#334155]">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#172033]">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-3.5 py-2 border-l-3 border-[#635BFF] bg-[#F1EEFF]/60 rounded-r-xl text-xs text-[#334155] italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-[#E2E8F0] shadow-xs">
      <table className="w-full text-left text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A] font-bold">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-[#E2E8F0] bg-white">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-3.5 py-2 font-semibold text-[#0F172A]">{children}</th>,
  td: ({ children }) => <td className="px-3.5 py-2 text-[#334155] align-top">{children}</td>,
  code: CodeBlock,
};

const gfmPlugins = [remarkGfm];

export const EnhancedAiMarkdown = memo(function EnhancedAiMarkdown({ content }) {
  if (!content) return null;

  return (
    <MarkdownErrorBoundary fallbackText={content}>
      <div className="text-xs sm:text-sm leading-relaxed break-words">
        <ReactMarkdown remarkPlugins={gfmPlugins} components={customComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
});

export default EnhancedAiMarkdown;
