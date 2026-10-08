"use client";

import React, { memo, Component } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Error boundary to gracefully catch any unexpected Markdown rendering issues
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
        <div className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#172033]">
          {this.props.fallbackText}
        </div>
      );
    }
    return this.props.children;
  }
}

// Static component definitions outside render to prevent React 19 reconciliation churn
const staticComponents = {
  // Use div instead of p to avoid HTML parser ejecting nested block elements like <ul>/<ol>
  p: ({ children }) => <div className="mb-1.5 last:mb-0 leading-relaxed">{children}</div>,
  ul: ({ children }) => <ul className="mb-1.5 list-disc list-inside space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 list-decimal list-inside space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#635BFF]">{children}</strong>,
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded bg-slate-100 text-[#635BFF] font-mono text-[10px]">
      {children}
    </code>
  ),
};

const staticPlugins = [remarkGfm];

export const FormattedMarkdown = memo(function FormattedMarkdown({ content }) {
  if (!content) return null;

  return (
    <MarkdownErrorBoundary fallbackText={content}>
      <div className="space-y-1 text-[11px] leading-relaxed">
        <ReactMarkdown remarkPlugins={staticPlugins} components={staticComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </MarkdownErrorBoundary>
  );
});

export default FormattedMarkdown;
