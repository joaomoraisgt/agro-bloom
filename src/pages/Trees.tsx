import { useEffect, useMemo, useRef, useState } from "react";
import { getAllTrees, getTree, rowLabel, ROWS_COUNT, SECTOR_COUNT, Tree, TREES_PER_ROW_COUNT } from "@/lib/mockData";
import { Search, X, Filter as FilterIcon, ZoomIn, ZoomOut, Locate } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterMode = "estado" | "producao" | "enxertia";

interface ViewState { x: number; y: number; scale: number; }

const SECTOR_GAP = 60;
const ROW_GAP = 18;
const TREE_GAP = 14;
const TREE_R = 4.5;

export default function Trees() {
  const trees = useMemo(() => getAllTrees(), []);
  const [filter, setFilter] = useState<FilterMode>("estado");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Tree | null>(null);
  const [view, setView] = useState<ViewState>({ x: 0, y: 0, scale: 0.35 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout customizado:
  //   topo → setor 7 (full width)
  //          setor 6 (full width)
  //          setor 5 (full width)
  //   base → [ setor 4 | setor 3 | setor 2 | setor 1 ]
  const layout = useMemo(() => {
    const baseSectorWidth = TREES_PER_ROW_COUNT * TREE_GAP;
    const sectorHeight = ROWS_COUNT * ROW_GAP + 28; // + label
    const bottomRowWidth = 4 * baseSectorWidth + 3 * SECTOR_GAP;
    const fullSectorWidth = bottomRowWidth; // setores 5,6,7 esticados
    // Espaçamento horizontal das árvores nos setores full-width
    const fullTreeGap = fullSectorWidth / TREES_PER_ROW_COUNT;

    const totalWidth = bottomRowWidth;
    const totalHeight = 3 * (sectorHeight + SECTOR_GAP) + sectorHeight + 20;

    // Y de cada setor (de cima para baixo: 7,6,5,[4..1])
    const sectorY: Record<number, number> = {};
    sectorY[7] = 20;
    sectorY[6] = sectorY[7] + sectorHeight + SECTOR_GAP;
    sectorY[5] = sectorY[6] + sectorHeight + SECTOR_GAP;
    const bottomY = sectorY[5] + sectorHeight + SECTOR_GAP;
    sectorY[4] = bottomY; sectorY[3] = bottomY; sectorY[2] = bottomY; sectorY[1] = bottomY;

    // X e largura de cada setor
    const sectorX: Record<number, number> = {};
    const sectorW: Record<number, number> = {};
    [5, 6, 7].forEach((s) => { sectorX[s] = 0; sectorW[s] = fullSectorWidth; });
    // Bottom: 4 esquerda, depois 3, 2, 1 (1 à direita)
    const bottomOrder = [4, 3, 2, 1];
    bottomOrder.forEach((s, i) => {
      sectorX[s] = i * (baseSectorWidth + SECTOR_GAP);
      sectorW[s] = baseSectorWidth;
    });

    const positions = new Map<string, { x: number; y: number }>();
    for (const t of trees) {
      const isFull = t.sector >= 5;
      const gap = isFull ? fullTreeGap : TREE_GAP;
      const rowIdx = rowToIdx(t.row);
      const x = sectorX[t.sector] + (t.index - 1) * gap + gap / 2;
      const y = sectorY[t.sector] + rowIdx * ROW_GAP + ROW_GAP / 2 + 22;
      positions.set(t.code, { x, y });
    }
    return { sectorHeight, totalWidth, totalHeight, positions, sectorX, sectorY, sectorW };
  }, [trees]);

  function colorFor(t: Tree): string {
    if (filter === "estado") {
      if (t.state === "alive") return "hsl(var(--tree-alive))";
      if (t.state === "sick") return "hsl(var(--tree-sick))";
      return "hsl(var(--tree-dead))";
    }
    if (filter === "producao") {
      return t.producing ? "hsl(var(--tree-producing))" : "hsl(var(--tree-not-producing))";
    }
    if (t.graft === "bravo") return "hsl(var(--tree-bravo))";
    if (t.graft === "grafted") return "hsl(var(--tree-grafted))";
    if (t.graft === "martainha") return "hsl(var(--tree-martainha))";
    return "hsl(var(--tree-espanhol))";
  }

  // Pinch + pan
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    let pointers = new Map<number, { x: number; y: number }>();
    let lastDist = 0;
    let lastCenter = { x: 0, y: 0 };

    const onDown = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        lastDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        lastCenter = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      if (pointers.size === 1) {
        const dx = cur.x - prev.x; const dy = cur.y - prev.y;
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      } else if (pointers.size === 2) {
        const pts = Array.from(pointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        const factor = dist / (lastDist || dist);
        setView((v) => {
          const rect = el.getBoundingClientRect();
          const cx = center.x - rect.left; const cy = center.y - rect.top;
          const newScale = Math.min(2.5, Math.max(0.08, v.scale * factor));
          const k = newScale / v.scale;
          return {
            scale: newScale,
            x: cx - (cx - v.x) * k + (center.x - lastCenter.x),
            y: cy - (cy - v.y) * k + (center.y - lastCenter.y),
          };
        });
        lastDist = dist; lastCenter = center;
      }
    };
    const onUp = (e: PointerEvent) => { pointers.delete(e.pointerId); if (pointers.size < 2) lastDist = 0; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.min(2.5, Math.max(0.08, v.scale * factor));
        const k = newScale / v.scale;
        return { scale: newScale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
      });
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Initial centering
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    setView({
      scale: Math.min(rect.width / layout.totalWidth, (rect.height - 100) / layout.totalHeight) * 0.95,
      x: rect.width / 2 - (layout.totalWidth / 2) * 0.95 * Math.min(rect.width / layout.totalWidth, (rect.height - 100) / layout.totalHeight),
      y: 60,
    });
  }, [layout]);

  const focusTree = (code: string) => {
    const t = getTree(code); if (!t) return;
    const pos = layout.positions.get(t.code); if (!pos) return;
    const el = containerRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const newScale = 1.6;
    setView({ scale: newScale, x: rect.width / 2 - pos.x * newScale, y: rect.height / 2 - pos.y * newScale });
    setSelected(t);
  };

  const handleSearch = () => {
    const code = search.trim().toUpperCase();
    if (!code) return;
    if (getTree(code)) focusTree(code);
  };

  const zoom = (factor: number) => {
    const el = containerRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2; const cy = rect.height / 2;
    setView((v) => {
      const newScale = Math.min(2.5, Math.max(0.08, v.scale * factor));
      const k = newScale / v.scale;
      return { scale: newScale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  };

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-secondary/40">
      {/* Search bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex gap-2">
        <div className="flex-1 flex items-center gap-2 h-12 px-4 rounded-full bg-card border border-border/60 shadow-soft">
          <Search className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Procurar (ex: 1L56)"
            className="flex-1 bg-transparent outline-none text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground"
          />
          {search && <button onClick={() => setSearch("")}><X className="size-4 text-muted-foreground" /></button>}
        </div>
      </div>

      {/* Filter chips */}
      <div className="absolute top-[68px] left-3 right-3 z-20 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["estado","producao","enxertia"] as FilterMode[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-xs border backdrop-blur-md",
            filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card/80 border-border/60 text-muted-foreground"
          )}>
            <FilterIcon className="inline size-3 mr-1.5" />
            {f === "estado" ? "Estado" : f === "producao" ? "Produção" : "Enxertia"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing">
        <svg
          width={layout.totalWidth}
          height={layout.totalHeight}
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
          className="select-none"
        >
          {/* Sector backgrounds + labels */}
          {Array.from({ length: SECTOR_COUNT }, (_, i) => {
            const x = i * (layout.sectorWidth + SECTOR_GAP);
            return (
              <g key={i}>
                <rect x={x - 6} y={0} width={layout.sectorWidth + 12} height={layout.sectorHeight + 40}
                  rx={8} fill="hsl(var(--card))" opacity={0.6} />
                <text x={x + 4} y={14} fontSize={14} fontFamily="Sora" fill="hsl(var(--muted-foreground))" letterSpacing="0.15em">
                  SETOR {i + 1}
                </text>
              </g>
            );
          })}

          {/* Trees */}
          {trees.map((t) => {
            const p = layout.positions.get(t.code)!;
            const isSel = selected?.code === t.code;
            return (
              <circle
                key={t.code}
                cx={p.x} cy={p.y} r={isSel ? TREE_R + 2 : TREE_R}
                fill={colorFor(t)}
                stroke={isSel ? "hsl(var(--foreground))" : "none"}
                strokeWidth={isSel ? 1.5 : 0}
                opacity={selected && !isSel ? 0.5 : 1}
                onClick={(e) => { e.stopPropagation(); focusTree(t.code); }}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </svg>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-3 bottom-32 z-20 flex flex-col gap-1.5">
        <button onClick={() => zoom(1.3)} className="size-11 rounded-full bg-card border border-border/60 shadow-soft flex items-center justify-center"><ZoomIn className="size-4" /></button>
        <button onClick={() => zoom(0.77)} className="size-11 rounded-full bg-card border border-border/60 shadow-soft flex items-center justify-center"><ZoomOut className="size-4" /></button>
        <button onClick={() => { const el = containerRef.current!; const r = el.getBoundingClientRect(); const s = Math.min(r.width / layout.totalWidth, (r.height - 100) / layout.totalHeight) * 0.95; setView({ scale: s, x: r.width/2 - layout.totalWidth/2*s, y: 60 }); setSelected(null); }} className="size-11 rounded-full bg-card border border-border/60 shadow-soft flex items-center justify-center"><Locate className="size-4" /></button>
      </div>

      {/* Legend */}
      <div className="absolute left-3 bottom-24 z-20 px-3 py-2.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border/60 shadow-soft">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Legenda</p>
        <div className="space-y-1">
          {legendFor(filter).map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-full" style={{ background: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail sheet */}
      {selected && <TreeSheet tree={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function legendFor(f: FilterMode) {
  if (f === "estado") return [
    { label: "Vivo", color: "hsl(var(--tree-alive))" },
    { label: "Doente", color: "hsl(var(--tree-sick))" },
    { label: "Morto", color: "hsl(var(--tree-dead))" },
  ];
  if (f === "producao") return [
    { label: "Em produção", color: "hsl(var(--tree-producing))" },
    { label: "Sem produção", color: "hsl(var(--tree-not-producing))" },
  ];
  return [
    { label: "Bravo", color: "hsl(var(--tree-bravo))" },
    { label: "Enxertado", color: "hsl(var(--tree-grafted))" },
    { label: "Martainha", color: "hsl(var(--tree-martainha))" },
    { label: "Espanhol", color: "hsl(var(--tree-espanhol))" },
  ];
}

function rowToIdx(row: string): number {
  let n = 0;
  for (const c of row) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function TreeSheet({ tree, onClose }: { tree: Tree; onClose: () => void }) {
  const t = getTree(tree.code) ?? tree;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-card rounded-t-3xl shadow-elevated p-5 pb-8 safe-bottom max-h-[55vh] overflow-y-auto animate-fade-up">
      <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-4" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Castanheiro</p>
          <h3 className="font-display text-3xl mt-1 tracking-tight">{t.code}</h3>
          <p className="text-xs text-muted-foreground mt-1">Setor {t.sector} · Fila {t.row} · Posição {t.index}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="size-5" /></button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Pill label="Estado" value={t.state === "alive" ? "Vivo" : t.state === "sick" ? "Doente" : "Morto"} />
        <Pill label="Tipo" value={t.graft === "bravo" ? "Bravo" : t.graft === "grafted" ? "Enxertado" : t.graft === "martainha" ? "Martainha" : "Espanhol"} />
        <Pill label="Produção" value={t.producing ? "Sim" : "Não"} />
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Histórico</p>
      <div className="space-y-2">
        {t.history.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Sem registos.</p>}
        {t.history.map((r) => (
          <div key={r.id} className="flex gap-3 p-3 rounded-xl bg-muted/40">
            <div className="text-center min-w-10">
              <div className="font-display text-lg leading-none">{new Date(r.date).getDate()}</div>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{new Date(r.date).toLocaleDateString("pt-PT", { month: "short" })}</div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-primary">{r.category}</p>
              <p className="text-sm">{r.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
