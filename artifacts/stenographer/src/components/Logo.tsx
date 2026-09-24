/**
 * Typewriter mark, drawn on lucide's 24px grid with the same 2px round
 * stroke as smallchat's MessageSquare so the two sit together as a family.
 */
export function TypewriterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7 10V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6" />
      <path d="M10 6.5h4" />
      <rect x="3" y="10" width="18" height="11" rx="2" />
      <path d="M7 14h.01M10.33 14h.01M13.67 14h.01M17 14h.01" />
      <path d="M8 17.5h8" />
    </svg>
  );
}
