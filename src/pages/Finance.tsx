import { useMemo, useState } from "react";
import { financeEntries, FinanceEntry } from "@/lib/mockData";
import { ArrowDownRight, ArrowUpRight, Filter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "all" | "30" | "90" | "365";
type TypeF = "all" | "income" | "expense";

const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(n);

export default function Finance() {
  const [period, setPeriod] = useState<Period>("90");
  const [typeF, setTypeF] = useState<TypeF>("all");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    const now = Date.now();
    return financeEntries.filter((e) => {
      if (typeF !== "all" && e.type !== typeF) return false;
      if (cat !== "all" && e.category !== cat) return false;
      if (period !== "all") {
        const days = parseInt(period, 10);
        if (now - +new Date(e.date) > days * 86400000) return false;
      }
      return true;
    });
  }, [period, typeF, cat]);

  const totals = useMemo(() => {
    const inc = filtered.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0);
    const exp = filtered.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0);
    return { inc, exp, net: inc - exp };
  }, [filtered]);

  const cats = useMemo(() => Array.from(new Set(financeEntries.map((e) => e.category))), []);

  const grouped = useMemo(() => {
    const m = new Map<string, FinanceEntry[]>();
    filtered.forEach((e) => {
      const k = new Date(e.date).toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    });
    return Array.from(m.entries());
  }, [filtered]);

  return (
    <div className="px-5 pt-4 space-y-5">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Finanças</p>
        <h1 className="font-display text-3xl mt-1">Movimentos</h1>
      </section>

      {/* Summary */}
      <div className="rounded-3xl bg-gradient-forest text-primary-foreground p-6 shadow-elevated">
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">Saldo do período</p>
        <p className="font-display text-4xl mt-2">{fmt(totals.net)}</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="flex items-center gap-1.5 text-[11px] opacity-80"><ArrowUpRight className="size-3" /> Entradas</div>
            <p className="font-display text-lg mt-1">{fmt(totals.inc)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <div className="flex items-center gap-1.5 text-[11px] opacity-80"><ArrowDownRight className="size-3" /> Saídas</div>
            <p className="font-display text-lg mt-1">{fmt(totals.exp)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <Chips value={period} onChange={setPeriod} options={[
          { v: "30", l: "30 dias" }, { v: "90", l: "3 meses" }, { v: "365", l: "1 ano" }, { v: "all", l: "Tudo" },
        ]} />
        <Chips value={typeF} onChange={setTypeF} options={[
          { v: "all", l: "Todos" }, { v: "income", l: "Receitas" }, { v: "expense", l: "Despesas" },
        ]} />
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CatChip active={cat === "all"} onClick={() => setCat("all")}>Todas categorias</CatChip>
          {cats.map((c) => (
            <CatChip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</CatChip>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-5">
        {grouped.map(([day, items]) => {
          const dayTotal = items.reduce((a, b) => a + (b.type === "income" ? b.amount : -b.amount), 0);
          return (
            <section key={day}>
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{day}</p>
                <p className={cn("text-xs font-medium", dayTotal >= 0 ? "text-success" : "text-destructive")}>
                  {dayTotal >= 0 ? "+" : ""}{fmt(dayTotal)}
                </p>
              </div>
              <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
                {items.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-4">
                    <div className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0",
                      e.type === "income" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {e.type === "income" ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.category}</p>
                    </div>
                    <p className={cn("font-display tabular-nums", e.type === "income" ? "text-success" : "text-foreground")}>
                      {e.type === "income" ? "+" : "−"}{fmt(e.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {grouped.length === 0 && (
          <div className="rounded-2xl bg-card border border-border/60 p-10 text-center text-sm text-muted-foreground">
            Sem movimentos com estes filtros.
          </div>
        )}
      </div>

      <button className="fixed bottom-28 right-5 z-30 h-12 px-5 rounded-full bg-card border border-border shadow-soft flex items-center gap-2 text-sm font-medium">
        <Plus className="size-4" /> Movimento
      </button>
    </div>
  );
}

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/40 w-full">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
            value === o.v ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function CatChip({ active, children, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-colors",
      active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 text-muted-foreground"
    )}>{children}</button>
  );
}
