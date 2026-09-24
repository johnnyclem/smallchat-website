import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

type Mode = "off" | "shadow" | "deliver";

const MODES: {
  id: Mode;
  label: string;
  position: string;
  color: string;
  ring: string;
  tagline: string;
  flag: string;
  traits: { label: string; on: boolean }[];
}[] = [
  {
    id: "off",
    label: "off",
    position: "Silent",
    color: "text-zinc-400",
    ring: "border-zinc-400",
    tagline: "The detector doesn't run. The ledger still does.",
    flag: "--objections off",
    traits: [
      { label: "Records objections", on: false },
      { label: "Pushed to channels & webhooks", on: false },
      { label: "Reaches the agent mid-task", on: false },
    ],
  },
  {
    id: "shadow",
    label: "shadow",
    position: "Default",
    color: "text-primary",
    ring: "border-primary",
    tagline: "Record everything, interrupt nobody. Judge it against real review catches first.",
    flag: "--objections shadow",
    traits: [
      { label: "Records objections", on: true },
      { label: "Pushed to channels & webhooks", on: false },
      { label: "Reaches the agent mid-task", on: false },
    ],
  },
  {
    id: "deliver",
    label: "deliver",
    position: "In the room",
    color: "text-red-400",
    ring: "border-red-400",
    tagline: "Objections reach the agent while it's still working.",
    flag: "--objections deliver --objection-channel http://127.0.0.1:7337",
    traits: [
      { label: "Records objections", on: true },
      { label: "Pushed to channels & webhooks", on: true },
      { label: "Reaches the agent mid-task", on: true },
    ],
  },
];

/** smallchat's safety spectrum, applied to objection rollout. */
export function RolloutSpectrum() {
  const [mode, setMode] = useState<Mode>("shadow");
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="space-y-8">
      <div className="relative max-w-3xl mx-auto">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-zinc-600 via-primary to-red-500 opacity-80" />
        <div className="absolute inset-x-0 -top-[7px] flex justify-between">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-label={m.label}
              className={`size-5 rounded-full border-2 bg-background transition-all cursor-pointer ${
                m.id === mode ? `${m.ring} scale-125 shadow-[0_0_12px_currentColor] ${m.color}` : "border-white/25 hover:border-white/50"
              }`}
            />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-3 text-center">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`cursor-pointer ${i === 0 ? "text-left" : i === 2 ? "text-right" : ""}`}
            >
              <div className={`text-xs font-bold tracking-[0.15em] uppercase ${m.id === mode ? m.color : "text-muted-foreground"}`}>
                {m.position}
              </div>
              <div className={`mt-1 font-mono text-sm ${m.id === mode ? "text-white" : "text-muted-foreground"}`}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="glass-panel rounded-2xl p-5 sm:p-8 max-w-3xl mx-auto"
        >
          <p className={`text-lg sm:text-xl italic ${active.color}`}>{active.tagline}</p>
          <div className="mt-5 divide-y divide-white/5">
            {active.traits.map((t) => (
              <div key={t.label} className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">{t.label}</span>
                {t.on ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-white/20" />}
              </div>
            ))}
          </div>
          <code className="mt-5 block overflow-x-auto whitespace-nowrap rounded-lg bg-black/40 px-4 py-3 font-mono text-xs sm:text-sm text-white/80">
            stenographer start ./session.jsonl {active.flag}
          </code>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
