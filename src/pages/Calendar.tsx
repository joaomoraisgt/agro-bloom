import { useMemo, useState } from "react";
import { tasksMock, Task, Recurrence } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Plus, Repeat, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type View = "day" | "week" | "month" | "year";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAYS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

function startOfWeek(d: Date) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x;
}
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
function fmtDate(d: Date, opts: Intl.DateTimeFormatOptions) { return d.toLocaleDateString("pt-PT", opts); }

export default function Calendar() {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>(tasksMock);
  const [showAdd, setShowAdd] = useState(false);

  const toggleDone = (id: string) =>
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div className="px-5 pt-4 space-y-5">
      <section className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Calendário</p>
          <h1 className="font-display text-3xl mt-1">{titleFor(view, cursor)}</h1>
        </div>
        <div className="flex gap-1">
          <NavBtn onClick={() => setCursor(shift(view, cursor, -1))}><ChevronLeft className="size-4" /></NavBtn>
          <NavBtn onClick={() => setCursor(new Date())}>Hoje</NavBtn>
          <NavBtn onClick={() => setCursor(shift(view, cursor, 1))}><ChevronRight className="size-4" /></NavBtn>
        </div>
      </section>

      <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/40 w-full">
        {(["day","week","month","year"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cn(
            "flex-1 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all",
            view === v ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
          )}>{v === "day" ? "Dia" : v === "week" ? "Semana" : v === "month" ? "Mês" : "Ano"}</button>
        ))}
      </div>

      {view === "day" && <DayView date={cursor} tasks={tasks} toggle={toggleDone} />}
      {view === "week" && <WeekView date={cursor} tasks={tasks} setCursor={setCursor} setView={setView} />}
      {view === "month" && <MonthView date={cursor} tasks={tasks} setCursor={setCursor} setView={setView} />}
      {view === "year" && <YearView date={cursor} setCursor={setCursor} setView={setView} />}

      <button onClick={() => setShowAdd(true)} className="fixed bottom-28 right-5 z-30 h-12 px-5 rounded-full bg-card border border-border shadow-soft flex items-center gap-2 text-sm font-medium">
        <Plus className="size-4" /> Tarefa
      </button>

      {showAdd && <AddTask onClose={() => setShowAdd(false)} onAdd={(t) => setTasks((x) => [...x, t])} cursor={cursor} />}
    </div>
  );
}

function titleFor(v: View, d: Date) {
  if (v === "day") return fmtDate(d, { weekday: "long", day: "2-digit", month: "long" });
  if (v === "week") {
    const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate()+6);
    return `${s.getDate()} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
  }
  if (v === "month") return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getFullYear()}`;
}
function shift(v: View, d: Date, n: number): Date {
  const x = new Date(d);
  if (v === "day") x.setDate(x.getDate() + n);
  if (v === "week") x.setDate(x.getDate() + n * 7);
  if (v === "month") x.setMonth(x.getMonth() + n);
  if (v === "year") x.setFullYear(x.getFullYear() + n);
  return x;
}
function NavBtn({ children, onClick }: any) {
  return <button onClick={onClick} className="h-9 min-w-9 px-3 rounded-full bg-card border border-border/60 text-xs font-medium hover:bg-muted/40 flex items-center justify-center">{children}</button>;
}

function DayView({ date, tasks, toggle }: { date: Date; tasks: Task[]; toggle: (id: string) => void }) {
  const items = tasks.filter((t) => sameDay(new Date(t.date), date)).sort((a,b) => +new Date(a.date) - +new Date(b.date));
  return (
    <div className="space-y-2">
      {items.length === 0 && <div className="rounded-2xl bg-card border border-border/60 p-10 text-center text-sm text-muted-foreground">Sem tarefas neste dia.</div>}
      {items.map((t) => (
        <button key={t.id} onClick={() => toggle(t.id)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 text-left">
          <div className={cn("size-10 rounded-full flex items-center justify-center shrink-0 border", t.done ? "bg-success text-primary-foreground border-success" : "border-border")}>
            {t.done && <Check className="size-4" strokeWidth={2.5} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium", t.done && "line-through text-muted-foreground")}>{t.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              {new Date(t.date).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
              {t.recurrence !== "none" && <span className="inline-flex items-center gap-1"><Repeat className="size-3" /> {t.recurrence}</span>}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

function WeekView({ date, tasks, setCursor, setView }: any) {
  const start = startOfWeek(date);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  return (
    <div className="space-y-2">
      {days.map((d) => {
        const items = tasks.filter((t: Task) => sameDay(new Date(t.date), d));
        return (
          <button key={d.toISOString()} onClick={() => { setCursor(d); setView("day"); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 text-left">
            <div className="text-center min-w-12">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{DAYS[(d.getDay()+6)%7]}</div>
              <div className="font-display text-2xl mt-0.5">{d.getDate()}</div>
            </div>
            <div className="flex-1 min-w-0">
              {items.length === 0 ? <p className="text-sm text-muted-foreground">Livre</p> :
                <div className="flex flex-wrap gap-1.5">
                  {items.slice(0,3).map((t: Task) => <span key={t.id} className="text-[11px] px-2 py-1 rounded-full bg-primary/8 text-primary">{t.title}</span>)}
                  {items.length > 3 && <span className="text-[11px] text-muted-foreground">+{items.length - 3}</span>}
                </div>
              }
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({ date, tasks, setCursor, setView }: any) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysIn = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let i = 1; i <= daysIn; i++) cells.push(new Date(date.getFullYear(), date.getMonth(), i));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-3">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />;
          const has = tasks.some((t: Task) => sameDay(new Date(t.date), d));
          const isToday = sameDay(d, today);
          return (
            <button key={i} onClick={() => { setCursor(d); setView("day"); }} className={cn(
              "aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative transition-colors",
              isToday ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
            )}>
              <span className={cn("font-display", isToday && "font-semibold")}>{d.getDate()}</span>
              {has && !isToday && <span className="absolute bottom-1.5 size-1 rounded-full bg-primary" />}
              {has && isToday && <span className="absolute bottom-1.5 size-1 rounded-full bg-primary-foreground" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ date, setCursor, setView }: any) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {MONTHS.map((m, i) => (
        <button key={m} onClick={() => { setCursor(new Date(date.getFullYear(), i, 1)); setView("month"); }}
          className="aspect-square rounded-2xl bg-card border border-border/60 flex flex-col items-center justify-center hover:bg-muted/40">
          <span className="font-display text-xl">{m}</span>
          <span className="text-xs text-muted-foreground mt-1">{date.getFullYear()}</span>
        </button>
      ))}
    </div>
  );
}

function AddTask({ onClose, onAdd, cursor }: { onClose: () => void; onAdd: (t: Task) => void; cursor: Date }) {
  const [title, setTitle] = useState("");
  const [rec, setRec] = useState<Recurrence>("none");
  const [date, setDate] = useState(cursor.toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const submit = () => {
    if (!title.trim()) return;
    const d = new Date(`${date}T${time}`);
    onAdd({ id: `t-${Date.now()}`, title, date: d.toISOString(), done: false, recurrence: rec });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-md" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl p-6 pb-10 safe-bottom animate-fade-up">
        <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-6" />
        <h3 className="font-display text-xl mb-4">Nova tarefa</h3>
        <input autoFocus placeholder="O que tem de fazer?" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full h-14 rounded-2xl bg-muted/60 px-4 outline-none focus:ring-2 focus:ring-primary/20" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-2xl bg-muted/60 px-4 outline-none" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12 rounded-2xl bg-muted/60 px-4 outline-none" />
        </div>
        <p className="text-xs text-muted-foreground mt-4 mb-2">Repetir</p>
        <div className="flex gap-2 flex-wrap">
          {(["none","daily","weekly","monthly","yearly"] as Recurrence[]).map((r) => (
            <button key={r} onClick={() => setRec(r)} className={cn(
              "px-3.5 py-1.5 rounded-full text-xs border",
              rec === r ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            )}>
              {r === "none" ? "Não" : r === "daily" ? "Diário" : r === "weekly" ? "Semanal" : r === "monthly" ? "Mensal" : "Anual"}
            </button>
          ))}
        </div>
        <button onClick={submit} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-medium mt-6">Adicionar</button>
      </div>
    </div>
  );
}
