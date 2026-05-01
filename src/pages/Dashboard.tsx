import { Link } from "react-router-dom";
import { TreeDeciduous, Wallet, CalendarDays, ArrowUpRight, TrendingUp, TrendingDown, Mic } from "lucide-react";
import { financeEntries, tasksMock, getAllTrees } from "@/lib/mockData";
import { useMemo } from "react";

export default function Dashboard() {
  const stats = useMemo(() => {
    const trees = getAllTrees();
    const alive = trees.filter((t) => t.state === "alive").length;
    const sick = trees.filter((t) => t.state === "sick").length;
    const producing = trees.filter((t) => t.producing).length;

    const month = new Date(); month.setDate(1); month.setHours(0,0,0,0);
    const monthEntries = financeEntries.filter((e) => new Date(e.date) >= month);
    const income = monthEntries.filter((e) => e.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = monthEntries.filter((e) => e.type === "expense").reduce((a, b) => a + b.amount, 0);

    const today = new Date(); today.setHours(0,0,0,0);
    const upcoming = tasksMock
      .filter((t) => !t.done && new Date(t.date) >= today)
      .sort((a,b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, 3);

    return { trees: trees.length, alive, sick, producing, income, expense, upcoming };
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="px-5 pt-4 space-y-5">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Boa tarde</p>
        <h1 className="font-display text-3xl mt-1">João</h1>
      </section>

      {/* Voice CTA */}
      <Link to="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLButtonElement>('[aria-label="Falar"]')?.click(); }}
        className="block relative overflow-hidden rounded-3xl bg-gradient-forest text-primary-foreground p-6 shadow-elevated">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-6 bottom-6 size-12 rounded-full bg-white/10 flex items-center justify-center">
          <Mic className="size-5" strokeWidth={1.75} />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] opacity-70">Acesso rápido</p>
        <h2 className="font-display text-2xl mt-1 max-w-[80%] leading-tight">Fale o que fez, nós organizamos.</h2>
        <p className="text-sm opacity-75 mt-2 max-w-[78%]">Funciona offline. Sincroniza quando houver rede.</p>
      </Link>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Receitas (mês)" value={fmt(stats.income)} trend="up" />
        <StatCard label="Despesas (mês)" value={fmt(stats.expense)} trend="down" />
        <StatCard label="Castanheiros" value={stats.trees.toLocaleString("pt-PT")} sub={`${stats.producing.toLocaleString("pt-PT")} em produção`} />
        <StatCard label="A precisar atenção" value={stats.sick.toString()} sub="doentes / a verificar" tone="warn" />
      </section>

      {/* Shortcuts */}
      <section className="space-y-2">
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground px-1">Atalhos</h3>
        <Shortcut to="/app/arvores" icon={TreeDeciduous} title="Mapa de castanheiros" sub="6 160 árvores · 7 setores" />
        <Shortcut to="/app/financas" icon={Wallet} title="Finanças" sub="Receitas e despesas categorizadas" />
        <Shortcut to="/app/calendario" icon={CalendarDays} title="Calendário & tarefas" sub={`${stats.upcoming.length} próximas`} />
      </section>

      {/* Upcoming */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Próximas tarefas</h3>
          <Link to="/app/calendario" className="text-xs text-primary">Ver todas</Link>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 divide-y divide-border/60 overflow-hidden">
          {stats.upcoming.map((t) => (
            <div key={t.id} className="flex items-center gap-4 p-4">
              <div className="text-center min-w-12">
                <div className="font-display text-2xl leading-none">{new Date(t.date).getDate()}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {new Date(t.date).toLocaleDateString("pt-PT", { month: "short" })}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  {t.recurrence !== "none" && ` · ${t.recurrence}`}
                </p>
              </div>
            </div>
          ))}
          {stats.upcoming.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem tarefas pendentes 🌿</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, trend, tone }: { label: string; value: string; sub?: string; trend?: "up" | "down"; tone?: "warn" }) {
  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        {trend === "up" && <TrendingUp className="size-3.5 text-success" />}
        {trend === "down" && <TrendingDown className="size-3.5 text-destructive" />}
      </div>
      <p className={`font-display text-2xl mt-2 ${tone === "warn" ? "text-warning" : ""}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Shortcut({ to, icon: Icon, title, sub }: any) {
  return (
    <Link to={to} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 hover:bg-muted/40 transition-colors">
      <div className="size-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
