import { useState } from "react";
import { Mic, Square, Save, X, Loader2 } from "lucide-react";
import { useSpeech } from "@/lib/useSpeech";
import { addNote } from "@/lib/voiceCache";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export function VoiceFAB() {
  const [open, setOpen] = useState(false);
  const { supported, listening, transcript, start, stop, reset, setTranscript } = useSpeech("pt-PT");

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => { if (supported) start(); }, 150);
  };
  const handleClose = () => { stop(); reset(); setOpen(false); };
  const handleSave = () => {
    if (!transcript.trim()) { toast({ title: "Nada para guardar", description: "Diga algo antes de gravar." }); return; }
    addNote(transcript.trim());
    toast({ title: "Guardado em cache", description: "Será sincronizado quando houver internet." });
    handleClose();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Falar"
        className="fixed bottom-6 right-5 z-40 size-16 rounded-full bg-gradient-forest text-primary-foreground shadow-fab flex items-center justify-center active:scale-95 transition-transform safe-bottom"
      >
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" aria-hidden />
        <Mic className="size-6 relative" strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-md animate-fade-up" onClick={handleClose} />
          <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl shadow-elevated p-6 pb-10 safe-bottom animate-fade-up">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-6" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display text-xl">Nova nota de voz</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {supported ? (listening ? "A ouvir…" : "Pronto") : "Não suportado neste browser"}
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted" aria-label="Fechar">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative min-h-[140px] rounded-2xl bg-muted/60 p-4 mb-5">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="A transcrição aparecerá aqui. Pode também escrever manualmente."
                className="w-full h-full min-h-[120px] resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
              />
              {listening && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-muted-foreground">REC</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={listening ? stop : start}
                disabled={!supported}
                className={cn(
                  "flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-medium transition-all",
                  listening ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
                  !supported && "opacity-50"
                )}
              >
                {listening ? <Square className="size-5" /> : <Mic className="size-5" />}
                {listening ? "Parar" : "Falar"}
              </button>
              <button
                onClick={handleSave}
                className="h-14 px-6 rounded-2xl bg-honey text-foreground font-medium flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Save className="size-5" strokeWidth={1.75} />
                Guardar
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-4 leading-relaxed">
              Notas ficam guardadas localmente até haver ligação. <Loader2 className="inline size-3" /> sincronização automática.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
