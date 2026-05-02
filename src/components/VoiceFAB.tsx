import { useRef, useState } from "react";
import { Mic, Square, Save, X, Loader2, Camera, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import { useSpeech } from "@/lib/useSpeech";
import { addAttachment, addNote, fileToDataUrl } from "@/lib/voiceCache";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type Attachment = { kind: "photo" | "file"; file: File; dataUrl: string };

export function VoiceFAB() {
  const [open, setOpen] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { supported, listening, transcript, start, stop, reset, setTranscript } = useSpeech("pt-PT");

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => { if (supported) start(); }, 150);
  };
  const handleClose = () => { stop(); reset(); setAttachment(null); setOpen(false); };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>, kind: "photo" | "file") => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Ficheiro grande demais", description: "Máximo 8 MB para guardar offline." });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setAttachment({ kind, file, dataUrl });
    } catch {
      toast({ title: "Erro", description: "Não foi possível ler o ficheiro." });
    }
  };

  const handleSave = () => {
    const hasText = transcript.trim().length > 0;
    if (!hasText && !attachment) {
      toast({ title: "Nada para guardar", description: "Diga algo, tire foto ou anexe um ficheiro." });
      return;
    }
    if (attachment) {
      addAttachment({
        kind: attachment.kind,
        fileName: attachment.file.name,
        mime: attachment.file.type,
        dataUrl: attachment.dataUrl,
        text: transcript.trim() || undefined,
      });
      toast({
        title: attachment.kind === "photo" ? "Foto guardada" : "Ficheiro guardado",
        description: attachment.kind === "photo"
          ? "Será analisada (ex: fatura → finanças) ao sincronizar."
          : "Sincroniza quando houver internet.",
      });
    } else {
      addNote(transcript.trim());
      toast({ title: "Nota guardada", description: "Sincroniza quando houver internet." });
    }
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

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPickFile(e, "photo")} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" hidden onChange={(e) => onPickFile(e, "file")} />

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-md animate-fade-up" onClick={handleClose} />
          <div className="absolute inset-x-0 bottom-0 bg-card rounded-t-3xl shadow-elevated p-6 pb-10 safe-bottom animate-fade-up max-h-[92vh] overflow-y-auto">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-6" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display text-xl">Novo registo</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {supported ? (listening ? "A ouvir…" : "Voz, foto ou ficheiro") : "Voz não suportada — use foto ou ficheiro"}
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted" aria-label="Fechar">
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative min-h-[120px] rounded-2xl bg-muted/60 p-4 mb-4">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="A transcrição aparece aqui. Pode também escrever uma nota para o anexo."
                className="w-full h-full min-h-[100px] resize-none bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
              />
              {listening && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs text-muted-foreground">REC</span>
                </div>
              )}
            </div>

            {attachment && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 mb-4 border border-border/40">
                {attachment.file.type.startsWith("image/") ? (
                  <img src={attachment.dataUrl} alt="anexo" className="size-14 rounded-xl object-cover" />
                ) : (
                  <div className="size-14 rounded-xl bg-card flex items-center justify-center text-muted-foreground">
                    <FileText className="size-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {attachment.kind === "photo" ? "Fotografia" : "Ficheiro"} · {(attachment.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button onClick={() => setAttachment(null)} className="p-2 rounded-full hover:bg-card text-muted-foreground" aria-label="Remover">
                  <X className="size-4" />
                </button>
              </div>
            )}

            {!attachment && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => cameraRef.current?.click()} className="h-12 rounded-2xl bg-muted/60 hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium">
                  <Camera className="size-4" /> Tirar foto
                </button>
                <button onClick={() => fileRef.current?.click()} className="h-12 rounded-2xl bg-muted/60 hover:bg-muted flex items-center justify-center gap-2 text-sm font-medium">
                  <Paperclip className="size-4" /> Anexar
                </button>
              </div>
            )}

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
              Tudo fica em cache local até haver ligação. <Loader2 className="inline size-3" /> sincronização automática.
              <br />Faturas fotografadas serão lidas e categorizadas em Finanças.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
