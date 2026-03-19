import React from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: React.ReactNode;
  language?: string;
  className?: string;
  filename?: string;
}

export function CodeBlock({ code, className, filename }: CodeBlockProps) {
  return (
    <div className={cn("rounded-xl overflow-hidden glass-panel border-white/10", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        {filename && (
          <div className="text-xs text-muted-foreground font-mono">{filename}</div>
        )}
      </div>
      <div className="p-4 overflow-x-auto bg-black/50">
        <pre className="font-mono text-sm leading-relaxed text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
