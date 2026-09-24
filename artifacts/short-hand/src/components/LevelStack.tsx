import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { LEVELS } from "./levels";

/** Messages sink from L0 to L4, shrinking as they go. Loops. */
export function LevelStack() {
  const order = [...LEVELS].reverse(); // L0 at the top
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % order.length), 1100);
    return () => clearInterval(id);
  }, [order.length]);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 text-left space-y-2.5">
      {order.map((l, i) => {
        const width = 100 - i * 19;
        const lit = i === active;
        return (
          <div key={l.level} className="flex items-center gap-3 sm:gap-4">
            <span className={`font-mono text-xs w-6 shrink-0 ${lit ? l.text : "text-muted-foreground"}`}>L{l.level}</span>
            <div className="flex-1 min-w-0">
              <motion.div
                className="h-9 sm:h-10 rounded-lg border flex items-center px-3 overflow-hidden"
                animate={{
                  borderColor: lit ? l.color : "rgba(255,255,255,0.08)",
                  backgroundColor: lit ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                }}
                transition={{ duration: 0.35 }}
                style={{ width: `${width}%` }}
              >
                <span className={`text-sm font-medium truncate ${lit ? "text-white" : "text-white/60"}`}>{l.name}</span>
              </motion.div>
            </div>
            <span className="hidden sm:block text-xs text-muted-foreground w-48 shrink-0">{l.fidelity}</span>
          </div>
        );
      })}
    </div>
  );
}
