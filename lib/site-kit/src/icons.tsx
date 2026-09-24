import { MessageSquare } from "lucide-react";
import type { ComponentType } from "react";

/*
 * Family marks, drawn on lucide's 24px grid with the same 2px round stroke
 * as smallchat's MessageSquare so they read as one set.
 */

type IconProps = { className?: string };

function Mark({ className, children }: IconProps & { children: React.ReactNode }) {
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
      {children}
    </svg>
  );
}

/** stenographer: a typewriter. */
export function TypewriterIcon({ className }: IconProps) {
  return (
    <Mark className={className}>
      <path d="M7 10V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6" />
      <path d="M10 6.5h4" />
      <rect x="3" y="10" width="18" height="11" rx="2" />
      <path d="M7 14h.01M10.33 14h.01M13.67 14h.01M17 14h.01" />
      <path d="M8 17.5h8" />
    </Mark>
  );
}

/** polytician: a lectern with a gooseneck mic. */
export function PodiumIcon({ className }: IconProps) {
  return (
    <Mark className={className}>
      <path d="M4 11 20 8.5" />
      <path d="M6 10.7V21h12V9" />
      <path d="M4 21h16" />
      <path d="M9.5 14.5h5" />
      <path d="M14 8.8C14 6 15 4.5 17 3.5" />
      <path d="M16.2 2.6l1.8 1.8" />
    </Mark>
  );
}

/** short-hand: a sticky note, curled at the corner, with a scribble. */
export function StickyNoteIcon({ className }: IconProps) {
  return (
    <Mark className={className}>
      <path d="M15 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
      <path d="M15 21v-4a2 2 0 0 1 2-2h4" />
      <path d="M7 9c1.2-1.6 2.4 1.6 3.6 0s2.4 1.6 3.6 0" />
      <path d="M7 13h4" />
    </Mark>
  );
}

export type FamilyId = "smallchat" | "stenographer" | "polytician" | "short-hand";

export const FAMILY: { id: FamilyId; name: string; url: string; color: string; Icon: ComponentType<IconProps> }[] = [
  { id: "smallchat", name: "smallchat", url: "https://www.smallchat.dev", color: "#3b9bff", Icon: MessageSquare },
  { id: "stenographer", name: "stenographer", url: "https://stenographer.smallchat.dev", color: "#f8a828", Icon: TypewriterIcon },
  { id: "polytician", name: "polytician", url: "https://polytician.smallchat.dev", color: "#a98bfa", Icon: PodiumIcon },
  { id: "short-hand", name: "short-hand", url: "https://short-hand.smallchat.dev", color: "#f472b6", Icon: StickyNoteIcon },
];
