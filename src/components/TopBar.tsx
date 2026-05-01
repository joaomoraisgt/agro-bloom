import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, Wallet, CalendarDays, TreeDeciduous, Cloud, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceCache } from "@/lib/voiceCache";

const NAV = [
  { to: "/app", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/app/arvores", label: "Castanheiros", icon: TreeDeciduous },
  { to: "/app/financas", label: "Finanças", icon: Wallet },
  { to: "/app/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/app/cache", label: "Cache de voz", icon: Cloud },
];

export function TopBar({ title }: { title?: string }) {
  const [open, setOpen] = useState(false);
  const cache = useVoiceCache();
  const pending = cache.filter((c) => !c.synced).length;
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/60">
        <div className="flex items-center justify-between px-5 h-14">
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="-ml-2 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <div className="font-display text-sm tracking-wider uppercase text-muted-foreground">
            {title ?? "Soutos"}
          </div>
          <Link
            to="/app/cache"
            className="relative -mr-2 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Cache"
          >
            <Cloud className="size-5" strokeWidth={1.5} />
            {pending > 0 && (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-honey animate-pulse" />
            )}
          </Link>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 animate-fade-up" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-[82%] max-w-sm bg-sidebar text-sidebar-foreground p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="font-display text-2xl tracking-tight">Soutos</div>
                <div className="text-xs text-sidebar-foreground/60 mt-1">Gestão Agrícola</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-sidebar-accent">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {NAV.map((n) => {
                const active = n.end ? pathname === n.to : pathname.startsWith(n.to);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors",
                      active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/60"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.5} />
                    <span className="font-medium">{n.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              to="/"
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="size-5" strokeWidth={1.5} />
              <span>Sair</span>
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
