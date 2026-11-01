import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CircleDashed, Lock, Users, Share2, BadgeCheck, AlertTriangle } from "lucide-react";
import { EASE, Icon, StatusDot } from "@/components/site";
import { cn } from "@/lib/utils";

export type MacChat = "direct" | "group" | "stenographer";

// One frozen moment of the busy session, shared by the sidebar card and the chat so they tell one story:
// the agent is running the tests, and the build and the search before it are done.
const RUNNING = "Bash · Run the tests";
const DONE = ["Bash · Build the app", "Grep · LOG_BUDGET"];

const SESSIONS: { id: MacChat; handle: string; title: string; project: string; busy: boolean; when: string }[] = [
  { id: "direct", handle: "@instrument-62", title: "Fix the flaky upload test", project: "smallchat-swift · main", busy: true, when: "now" },
  { id: "group", handle: "#release", title: "@instrument-62, @quill-7", project: "group chat", busy: false, when: "2 min" },
  { id: "stenographer", handle: "@stenographer", title: "Watching every chat", project: "ledger · 14 tombstones", busy: false, when: "1 min" },
];

function Sidebar({ chat, onSelect }: { chat: MacChat; onSelect: (c: MacChat) => void }) {
  return (
    <nav aria-label="Sessions" className="hidden w-60 shrink-0 flex-col gap-1 border-r bg-deep p-2 sm:flex">
      <p className="px-3 pb-2 pt-2 text-xs text-muted-foreground">Sessions</p>
      {SESSIONS.map((s) => {
        const active = chat === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "w-full cursor-pointer space-y-1 rounded-lg px-3 py-3 text-left transition-colors",
              active ? "lit bg-raised" : "hover:bg-card",
            )}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusDot className={s.busy ? "bg-caution" : "bg-positive"} />
              {s.busy ? "busy" : "idle"}
            </div>
            <p className="truncate text-sm font-medium text-foreground">{s.handle}</p>
            <p className="truncate text-xs text-subtle">{s.title}</p>
            {s.busy && (
              <div className="space-y-1 pt-1 font-mono text-xs">
                <p className="flex items-center gap-2 truncate text-caution">
                  <Icon as={CircleDashed} />
                  {RUNNING}
                </p>
                {DONE.map((d) => (
                  <p key={d} className="flex items-center gap-2 truncate text-muted-foreground">
                    <Icon as={Check} className="text-positive" />
                    {d}
                  </p>
                ))}
              </div>
            )}
            <p className="flex justify-between pt-1 text-xs text-muted-foreground">
              <span className="truncate">{s.project}</span>
              <span className="shrink-0 pl-2">{s.when}</span>
            </p>
          </button>
        );
      })}
    </nav>
  );
}

function Bubble({ from, children, mine = false }: { from?: string; children: ReactNode; mine?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      {from && (
        <span className="px-1 text-xs font-medium text-subtle">{from}</span>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed text-foreground",
          mine ? "rounded-br-md bg-raised" : "rounded-bl-md border bg-deep",
        )}
      >
        {children}
      </div>
    </div>
  );
}

const SMALL_PRIMARY =
  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-colors hover:bg-foreground/90";
const SMALL_OUTLINE =
  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-3 text-xs text-foreground transition-colors hover:bg-raised-hover";

function Direct() {
  return (
    <>
      <Bubble mine>The upload test fails about one run in five. Can you find out why?</Bubble>
      <Bubble from="@instrument-62">
        It races the progress callback. I'm pinning the queue and running the suite ten times to be sure.
      </Bubble>
      <div className="space-y-1 px-1 font-mono text-xs">
        {[...DONE].reverse().map((d) => (
          <p key={d} className="flex items-center gap-2 text-muted-foreground">
            <Icon as={Check} className="text-positive" />
            {d}
          </p>
        ))}
        <p className="flex items-center gap-2 text-caution">
          <Icon as={CircleDashed} />
          {RUNNING}
        </p>
      </div>
    </>
  );
}

function Group() {
  const [shared, setShared] = useState<null | boolean>(null);
  return (
    <>
      <Bubble mine>
        <span className="font-medium">@all</span> what's left before we tag 1.0?
      </Bubble>
      <Bubble from="@quill-7">
        Changelog is drafted. Waiting on the upload fix.
      </Bubble>
      <div className="flex flex-col items-start gap-1">
        <span className="px-1 text-xs font-medium text-subtle">@instrument-62</span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-dashed border-border-strong bg-deep px-4 py-2 text-sm leading-relaxed text-foreground">
          Fix is in, 10/10 green. One note for you: the old test hid a real timeout on slow disks.
        </div>
        <div className="flex flex-wrap items-center gap-2 px-1 pt-2 text-xs">
          {shared === null ? (
            <>
              <span className="flex items-center gap-2 text-muted-foreground">
                <Icon as={Lock} /> Only you
              </span>
              <button onClick={() => setShared(true)} className={SMALL_PRIMARY}>
                <Icon as={Share2} /> Share with group
              </button>
              <button onClick={() => setShared(false)} className={SMALL_OUTLINE}>
                Keep private
              </button>
            </>
          ) : shared ? (
            <span className="flex items-center gap-2 text-foreground">
              <Icon as={Users} /> Shared with group
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Icon as={Lock} /> Only you
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
      <div className="space-y-2 rounded-xl border bg-deep p-4">
        <p className="flex items-center gap-2 text-xs font-medium text-caution">
          <Icon as={AlertTriangle} /> Objection · @instrument-62
        </p>
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-mono">LOG_BUDGET = 30</span> is tombstoned. The budget is <span className="font-mono">100</span> since a1b2c3.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border bg-deep p-4">
        <p className="text-xs font-medium text-muted-foreground">Awaiting your approval</p>
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-medium">@quill-7</span> drafted a tombstone: the staging bucket is gone, use{" "}
          <span className="font-mono">uploads-v2</span>.
        </p>
        <AnimatePresence mode="wait" initial={false}>
          {ruling === null ? (
            <motion.div key="ask" exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: EASE }} className="flex flex-wrap gap-2">
              <button onClick={() => setRuling("approved")} className={SMALL_PRIMARY}>
                Approve as johnny
              </button>
              <button onClick={() => setRuling("declined")} className={SMALL_OUTLINE}>
                Decline…
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="done"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className={cn("flex items-center gap-2 text-xs", ruling === "approved" ? "text-positive" : "text-muted-foreground")}
            >
              {ruling === "approved" ? (
                <>
                  <Icon as={BadgeCheck} /> Notarized as johnny
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

export const MAC_TABS: { id: MacChat; label: string }[] = [
  { id: "direct", label: "Direct" },
  { id: "group", label: "Group chat" },
  { id: "stenographer", label: "Stenographer" },
];

/** A faux macOS window of the smallchat messenger. Surface steps carry the depth. */
export function MacAppShowcase({ chat, onSelect }: { chat: MacChat; onSelect: (c: MacChat) => void }) {
  return (
    <div role="group" aria-label="smallchat for Mac, interactive preview" className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex h-10 items-center gap-2 border-b bg-raised px-4">
        <span className="h-3 w-3 rounded-full bg-border-strong" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-border-strong" aria-hidden />
        <span className="h-3 w-3 rounded-full bg-border-strong" aria-hidden />
        <span className="flex-1 pr-12 text-center text-xs text-muted-foreground">smallchat</span>
      </div>
      <div className="flex h-[448px]">
        <Sidebar chat={chat} onSelect={onSelect} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">{HEADERS[chat].title}</p>
            <p className="truncate text-xs text-muted-foreground">{HEADERS[chat].sub}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={chat}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="space-y-4"
              >
                {chat === "direct" && <Direct />}
                {chat === "group" && <Group />}
                {chat === "stenographer" && <Stenographer />}
              </motion.div>
            </AnimatePresence>
          </div>
          <div aria-hidden className="m-4 mt-0 rounded-xl border px-4 py-3 text-xs text-muted-foreground">
            Message {HEADERS[chat].title}…
          </div>
        </div>
      </div>
    </div>
  );
}
