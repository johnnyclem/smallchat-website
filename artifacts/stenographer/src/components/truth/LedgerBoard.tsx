import { useMemo, useState } from "react";
import type { ReadModel, EntryView } from "@/lib/truth/read";
import { EntryCard, type EntryAct } from "./EntryCard";
import { ChainStrip } from "./pieces";

type Filter = "all" | "truth" | "docket" | "history";

/** One ledger, as a person reads it: the docket, current truth, history, and the chain underneath. */
export function LedgerBoard({
  model,
  highlight,
  onAct,
  canAct,
  emptyText = "Nothing on the record yet.",
  defaultFilter = "all",
  actorName,
}: {
  model: ReadModel;
  highlight?: Set<string>;
  onAct?: (act: EntryAct, entry: EntryView) => void;
  canAct?: (act: EntryAct, entry: EntryView) => boolean;
  actorName?: string;
  emptyText?: string;
  defaultFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(defaultFilter);
  const byId = useMemo(() => new Map(model.entries.map((e) => [e.id, e])), [model.entries]);
  const docketIds = useMemo(() => new Set([...model.docket.open, ...model.docket.appeals.map((a) => a.tb)]), [model.docket]);
  const shown = useMemo(() => {
    switch (filter) {
      case "truth":
        return model.entries.filter((e) => e.type === "TB" && e.current);
      case "docket": {
        const order = [...model.docket.appeals.map((a) => a.tb), ...model.docket.open];
        return order.map((id) => byId.get(id)!).filter(Boolean);
      }
      case "history":
        return model.entries.filter((e) => !e.current);
      default:
        return model.entries;
    }
  }, [filter, model, byId]);
  const tabs: Array<{ id: Filter; label: string; n: number }> = [
    { id: "all", label: "Everything", n: model.entries.length },
    { id: "truth", label: "Ground truth", n: model.entries.filter((e) => e.type === "TB" && e.current).length },
    { id: "docket", label: "Docket", n: docketIds.size },
    { id: "history", label: "History", n: model.entries.filter((e) => !e.current).length },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${filter === t.id ? "text-white bg-white/[0.08] border-white/15" : "text-muted-foreground border-transparent hover:text-white/70"}`}
          >
            {t.label} <span className="font-mono text-[10px] opacity-70">{t.n}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2.5 max-h-[34rem] overflow-y-auto pr-1">
        {shown.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">{filter === "all" ? emptyText : "Nothing here."}</p>}
        {shown.map((e) => (
          <EntryCard key={e.id} entry={e} byId={byId} highlight={highlight?.has(e.id)} onAct={onAct} canAct={canAct} actorName={actorName} />
        ))}
      </div>
      <ChainStrip lines={model.lines} highlight={highlight} />
    </div>
  );
}
