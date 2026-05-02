import { Cloud, CloudOff, Trash2, Check, RefreshCw, Mic, Camera, FileText } from "lucide-react";
import { markAllSynced, removeNote, useVoiceCache, CachedItem } from "@/lib/voiceCache";
import { toast } from "@/hooks/use-toast";

export default function CachePage() {
  const items = useVoiceCache();
  const pending = items.filter((i) => !i.synced);

  const sync = () => {
    markAllSynced();
    toast({ title: "Sincronizado", description: `${pending.length} registos enviados.` });
  };

  return (
    <div className="px-5 pt-4 space-y-5 pb-32">
      <section>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Offline</p>
        <h1 className="font-display text-3xl mt-1">Cache</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Notas de voz, fotografias (faturas, etc.) e ficheiros guardados localmente. Sincronizam automaticamente quando voltar a haver internet.
        </p>
      </section>

      <div className="rounded-3xl bg-gradient-forest text-primary-foreground p-6 shadow-elevated">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs opacity-80">
              {pending.length > 0 ? <CloudOff className="size-4" /> : <Cloud className="size-4" />}
              {pending.length > 0 ? "Por sincronizar" : "Tudo sincronizado"}
            </div>
            <p className="font-display text-4xl mt-2">{pending.length}</p>
            <p className="text-xs opacity-75 mt-1">{items.length} no total</p>
          </div>
          {pending.length > 0 && (
            <button onClick={sync} className="h-11 px-4 rounded-full bg-honey text-foreground text-sm font-medium flex items-center gap-2">
              <RefreshCw className="size-4" /> Sincronizar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="rounded-2xl bg-card border border-border/60 p-10 text-center text-sm text-muted-foreground">
            Sem registos em cache. Use o botão verde para gravar, fotografar ou anexar.
          </div>
        )}
        {items.map((i) => <Row key={i.id} i={i} />)}
      </div>
    </div>
  );
}

function Row({ i }: { i: CachedItem }) {
  const Icon = i.kind === "voice" ? Mic : i.kind === "photo" ? Camera : FileText;
  return (
    <div className="p-4 rounded-2xl bg-card border border-border/60">
      <div className="flex items-start gap-3">
        {i.dataUrl && i.mime?.startsWith("image/") ? (
          <img src={i.dataUrl} alt="" className="size-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="size-14 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            <Icon className="size-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${i.synced ? "bg-success/15 text-success" : "bg-honey/20 text-foreground"}`}>
              {i.synced ? <><Check className="inline size-3" /> sincronizado</> : "pendente"}
            </span>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {i.kind === "voice" ? "voz" : i.kind === "photo" ? "foto" : "ficheiro"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {new Date(i.createdAt).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {i.fileName && <p className="text-sm font-medium truncate">{i.fileName}</p>}
          {i.text && <p className="text-sm leading-relaxed mt-0.5">{i.text}</p>}
        </div>
        <button onClick={() => removeNote(i.id)} className="p-2 rounded-full hover:bg-muted text-muted-foreground shrink-0">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
