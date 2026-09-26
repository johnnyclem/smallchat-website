import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Users, Share2, BadgeCheck, AlertTriangle, MessageSquare, ScrollText, AtSign } from "lucide-react";

export type MacChat = "direct" | "group" | "stenographer";

// Mirrors the app's Theme: busy is orange, idle is green, stenographer is purple.
const BUSY = "#fb923c";
const IDLE = "#4ade80";
const STENO = "#c084fc";

const STEPS = ["Read · Package.swift", "Grep · LOG_BUDGET", "Bash · Build the app", "Bash · Run the tests"];

/** Cycles through tool steps like the live activity feed on a busy session card. */
function useActivity() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % STEPS.length), 1800);
    return () => clearInterval(id);
  }, []);
  const done = [STEPS[(i + STEPS.length - 1) % STEPS.length], STEPS[(i + STEPS.length - 2) % STEPS.length]];
  return { current: STEPS[i], done };
}

const SESSIONS: { id: MacChat; handle: string; title: string; project: string; busy: boolean; when: string }[] = [
  { id: "direct", handle: "@instrument-62", title: "Fix the flaky upload test", project: "smallchat-swift · main", busy: true, when: "now" },
  { id: "group", handle: "#release", title: "@instrument-62, @quill-7", project: "group chat", busy: false, when: "2 min" },
  { id: "stenographer", handle: "@stenographer", title: "Watching every chat", project: "ledger · 14 tombstones", busy: false, when: "1 min" },
];

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color }} />;
}

function Sidebar({ chat, onSelect }: { chat: MacChat; onSelect: (c: MacChat) => void }) {
  const { current, done } = useActivity();
  return (
    <div className="hidden sm:flex flex-col w-60 shrink-0 border-r border-white/5 bg-white/[0.02] p-2 gap-1">
      <p className="px-2 pt-1 pb-2 text-[11px] font-semibold text-muted-foreground/70">Sessions</p>
      {SESSIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`text-left rounded-lg px-2.5 py-2 space-y-1 transition-colors cursor-pointer ${
            chat === s.id ? "bg-primary/20" : "hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Dot color={s.id === "stenographer" ? STENO : s.busy ? BUSY : IDLE} />
            {s.busy ? "busy" : "idle"}
          </div>
          <p className="text-[13px] font-semibold text-white truncate">{s.handle}</p>
          <p className="text-[11px] text-muted-foreground truncate">{s.title}</p>
          {s.busy && (
            <div className="space-y-0.5 font-mono text-[10px] pt-0.5">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={current}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 truncate"
                  style={{ color: BUSY }}
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin shrink-0" />
                  {current}
                </motion.p>
              </AnimatePresence>
              {done.map((d) => (
                <p key={d} className="flex items-center gap-1.5 text-muted-foreground/60 truncate">
                  <Check className="w-2.5 h-2.5 text-green-400 shrink-0" />
                  {d}
                </p>
              ))}
            </div>
          )}
          <p className="flex justify-between text-[10px] text-muted-foreground/50">
            <span className="truncate">{s.project}</span>
            <span className="shrink-0 pl-2">{s.when}</span>
          </p>
        </button>
      ))}
    </div>
  );
}

function Bubble({ from, children, mine = false, color }: { from?: string; children: React.ReactNode; mine?: boolean; color?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      {from && (
        <span className="text-[11px] font-semibold px-1" style={{ color: color ?? "rgb(163 163 163)" }}>
          {from}
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
          mine ? "bg-primary text-white rounded-br-md" : "bg-white/[0.07] text-white/90 rounded-bl-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Direct() {
  const { current } = useActivity();
  return (
    <>
      <Bubble mine>The upload test fails about one run in five. Can you find out why?</Bubble>
      <Bubble from="@instrument-62" color={BUSY}>
        It races the progress callback. I'm pinning the queue and running the suite ten times to be sure.
      </Bubble>
      <div className="flex items-center gap-1.5 px-1 font-mono text-[11px]" style={{ color: BUSY }}>
        <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent animate-spin" />
        {current}
      </div>
    </>
  );
}

function Group() {
  const [shared, setShared] = useState<null | boolean>(null);
  return (
    <>
      <Bubble mine>
        <span className="font-semibold">@all</span> what's left before we tag 0.4?
      </Bubble>
      <Bubble from="@quill-7" color="#2dd4bf">
        Changelog is drafted. Waiting on the upload fix.
      </Bubble>
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-semibold px-1" style={{ color: BUSY }}>
          @instrument-62
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px] leading-relaxed bg-white/[0.07] text-white/90 border border-dashed border-white/15">
          Fix is in, 10/10 green. One note for you: the old test hid a real timeout on slow disks.
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 text-[11px]">
          {shared === null ? (
            <>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Lock className="w-3 h-3" /> Only you
              </span>
              <button
                onClick={() => setShared(true)}
                className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-medium text-white hover:bg-primary/85 cursor-pointer"
              >
                <Share2 className="w-3 h-3" /> Share with group
              </button>
              <button
                onClick={() => setShared(false)}
                className="rounded-md border border-white/15 px-2 py-1 text-white/80 hover:bg-white/5 cursor-pointer"
              >
                Keep private
              </button>
            </>
          ) : shared ? (
            <span className="flex items-center gap-1 text-primary">
              <Users className="w-3 h-3" /> Shared with group
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Lock className="w-3 h-3" /> Only you
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function Stenographer() {
  const [ruling, setRuling] = useState<null | "approved" | "declined">(null);
  return (
    <>
      <div className="rounded-xl border border-orange-400/25 bg-orange-400/[0.06] p-3 space-y-1.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-300">
          <AlertTriangle className="w-3.5 h-3.5" /> Objection · @instrument-62
        </p>
        <p className="text-[13px] text-white/90">
          <span className="font-mono text-orange-200">LOG_BUDGET = 30</span> is tombstoned. The budget is{" "}
          <span className="font-mono">100</span> since a1b2c3.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
        <p className="text-[11px] font-semibold text-muted-foreground">Awaiting your approval</p>
        <p className="text-[13px] text-white/90">
          <span style={{ color: STENO }}>@quill-7</span> drafted a tombstone: the staging bucket is gone, use{" "}
          <span className="font-mono">uploads-v2</span>.
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {ruling === null ? (
            <motion.div key="ask" exit={{ opacity: 0 }} className="flex flex-wrap gap-2 text-[11px]">
              <button
                onClick={() => setRuling("approved")}
                className="rounded-md bg-primary px-2.5 py-1 font-medium text-white hover:bg-primary/85 cursor-pointer"
              >
                Approve as johnny
              </button>
              <button
                onClick={() => setRuling("declined")}
                className="rounded-md border border-white/15 px-2.5 py-1 text-white/80 hover:bg-white/5 cursor-pointer"
              >
                Decline…
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-1.5 text-[11px] ${ruling === "approved" ? "text-green-400" : "text-muted-foreground"}`}
            >
              {ruling === "approved" ? (
                <>
                  <BadgeCheck className="w-3.5 h-3.5" /> Notarized as johnny
                </>
              ) : (
                "Declined. The draft stays in the ledger's history."
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const HEADERS: Record<MacChat, { title: string; sub: string }> = {
  direct: { title: "@instrument-62", sub: "Claude Code · smallchat-swift" },
  group: { title: "#release", sub: "Replies come to you first" },
  stenographer: { title: "Stenographer", sub: "Tombstones, objections, approvals" },
};

export const MAC_TABS: { id: MacChat; label: string; icon: React.ReactNode }[] = [
  { id: "direct", label: "Direct", icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: "group", label: "Group chat", icon: <AtSign className="w-3.5 h-3.5" /> },
  { id: "stenographer", label: "Stenographer", icon: <ScrollText className="w-3.5 h-3.5" /> },
];

/** A faux macOS window of the smallchat messenger. */
export function MacAppShowcase({ chat, onSelect }: { chat: MacChat; onSelect: (c: MacChat) => void }) {
  return (
    <div className="relative">
      <div className="absolute -inset-x-10 -inset-y-6 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-2xl border border-white/10 bg-[#141416]/95 shadow-2xl overflow-hidden">
        <div className="h-10 flex items-center gap-2 px-4 border-b border-white/5 bg-white/[0.03]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="flex-1 text-center text-xs font-medium text-muted-foreground pr-12">smallchat</span>
        </div>
        <div className="flex h-[420px]">
          <Sidebar chat={chat} onSelect={onSelect} />
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-sm font-semibold text-white truncate">{HEADERS[chat].title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{HEADERS[chat].sub}</p>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={chat}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3"
                >
                  {chat === "direct" && <Direct />}
                  {chat === "group" && <Group />}
                  {chat === "stenographer" && <Stenographer />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="m-3 mt-0 rounded-xl border border-white/10 px-3 py-2 text-[12px] text-muted-foreground/60">
              Message {HEADERS[chat].title}…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
