import { useEffect, useState } from "react";

export interface CachedVoiceNote {
  id: string;
  text: string;
  createdAt: string;
  synced: boolean;
}

const KEY = "soutos.voice.cache";

export function loadCache(): CachedVoiceNote[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveCache(items: CachedVoiceNote[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
export function addNote(text: string) {
  const items = loadCache();
  items.unshift({ id: crypto.randomUUID(), text, createdAt: new Date().toISOString(), synced: false });
  saveCache(items);
  window.dispatchEvent(new Event("soutos.cache.changed"));
}
export function markAllSynced() {
  const items = loadCache().map((i) => ({ ...i, synced: true }));
  saveCache(items);
  window.dispatchEvent(new Event("soutos.cache.changed"));
}
export function removeNote(id: string) {
  saveCache(loadCache().filter((i) => i.id !== id));
  window.dispatchEvent(new Event("soutos.cache.changed"));
}

export function useVoiceCache() {
  const [items, setItems] = useState<CachedVoiceNote[]>(() => loadCache());
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
