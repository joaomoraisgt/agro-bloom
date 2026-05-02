import { useEffect, useState } from "react";

export type CachedKind = "voice" | "photo" | "file";
export interface CachedItem {
  id: string;
  kind: CachedKind;
  text?: string;          // transcrição ou descrição
  fileName?: string;      // nome do ficheiro
  mime?: string;
  dataUrl?: string;       // base64 (mock — em produção iria para storage)
  createdAt: string;
  synced: boolean;
}

const KEY = "soutos.cache.v2";

export function loadCache(): CachedItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveCache(items: CachedItem[]) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new Event("soutos.cache.changed"));
}
export function addNote(text: string) {
  const items = loadCache();
  items.unshift({ id: crypto.randomUUID(), kind: "voice", text, createdAt: new Date().toISOString(), synced: false });
  saveCache(items);
}
export function addAttachment(input: { kind: "photo" | "file"; fileName: string; mime: string; dataUrl: string; text?: string }) {
  const items = loadCache();
  items.unshift({
    id: crypto.randomUUID(),
    kind: input.kind,
    fileName: input.fileName,
    mime: input.mime,
    dataUrl: input.dataUrl,
    text: input.text,
    createdAt: new Date().toISOString(),
    synced: false,
  });
  saveCache(items);
}
export function markAllSynced() {
  saveCache(loadCache().map((i) => ({ ...i, synced: true })));
}
export function removeNote(id: string) {
  saveCache(loadCache().filter((i) => i.id !== id));
}

export function useVoiceCache() {
  const [items, setItems] = useState<CachedItem[]>(() => loadCache());
  useEffect(() => {
    const h = () => setItems(loadCache());
    window.addEventListener("soutos.cache.changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("soutos.cache.changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return items;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
