import { AnimatePresence, motion } from "framer-motion";
import { Braces, FileText, Grid3x3 } from "lucide-react";
import { useEffect, useState } from "react";
import demo from "@/data/demo.json";

type Shape = "markdown" | "thoughtform" | "vector";

const SHAPES: { id: Shape; label: string; icon: typeof FileText }[] = [
  { id: "markdown", label: "markdown", icon: FileText },
  { id: "thoughtform", label: "ThoughtForm", icon: Braces },
  { id: "vector", label: "vector", icon: Grid3x3 },
];

const { hero } = demo;
const entityText = new Map(hero.thoughtform.entities.map((e) => [e.id, e.text]));
const maxAbs = Math.max(...hero.vector.map(Math.abs));

/** One stored concept, read back in each of its three shapes. Cycles until touched. */
export function ShapeSwitcher() {
  const [shape, setShape] = useState<Shape>("markdown");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setShape((s) => SHAPES[(SHAPES.findIndex((x) => x.id === s) + 1) % SHAPES.length].id);
    }, 3200);
    return () => clearInterval(id);
  }, [auto]);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden text-left">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-white/5">
        <span className="font-mono text-xs text-muted-foreground truncate">read_concept · {hero.id}</span>
        <div className="ml-auto flex gap-1">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setAuto(false);
                setShape(s.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                shape === s.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-white/80"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-6 min-h-[260px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={shape}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {shape === "markdown" && (
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl text-white/90 leading-snug">{hero.markdown}</p>
                <div className="flex gap-2">
                  {hero.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-xs text-muted-foreground">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {shape === "thoughtform" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  {hero.thoughtform.relationships.map((r, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 font-mono text-sm">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-white">{entityText.get(r.subjectId)}</span>
                      <span className="text-primary">—{r.predicate}→</span>
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-white">{entityText.get(r.objectId)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {hero.thoughtform.entities.map((e) => (
                    <div key={e.id} className="flex gap-3 text-muted-foreground">
                      <span className="text-primary w-12">{e.id}</span>
                      <span className="text-white/80 flex-1 truncate">{e.text}</span>
                      <span>{e.type}</span>
                      <span className="w-10 text-right">{e.confidence}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Rule-based pipeline, no LLM. Plug one in for richer graphs.</p>
              </div>
            )}

            {shape === "vector" && (
              <div className="space-y-4">
                <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}>
                  {hero.vector.map((v, i) => (
                    <div
                      key={i}
                      title={`${i}: ${v}`}
                      className="aspect-square rounded-[2px]"
                      style={{
                        background: v >= 0 ? "hsl(var(--primary))" : "rgb(56,189,248)",
                        opacity: 0.12 + 0.88 * (Math.abs(v) / maxAbs),
                      }}
                    />
                  ))}
                </div>
                <p className="font-mono text-xs text-muted-foreground truncate">
                  float[{demo.dims}] · {demo.model} · [{hero.vector.slice(0, 5).join(", ")}, …]
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
