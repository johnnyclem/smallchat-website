import React from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: React.ReactNode;
  language?: string;
  className?: string;
  filename?: string;
  wrap?: boolean;
}

/** A listing: a quiet file name above, the code on the deepest surface. Long lines scroll, they never break mid-token. */
export function CodeBlock({ code, className, filename, wrap = false }: CodeBlockProps) {
  return (
    <figure className={cn("overflow-hidden rounded-xl border bg-deep", className)}>
      {filename && (
        <figcaption className="flex h-10 items-center border-b bg-card px-4 font-mono text-xs text-muted-foreground">
          {filename}
        </figcaption>
      )}
      <div className="overflow-x-auto p-4" tabIndex={0}>
        <pre className={cn("font-mono text-[13px] leading-6 text-subtle", wrap && "whitespace-pre-wrap break-words")}>
          <code>{code}</code>
        </pre>
      </div>
    </figure>
  );
}
