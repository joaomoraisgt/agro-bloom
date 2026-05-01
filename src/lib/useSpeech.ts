import { useEffect, useState } from "react";

interface SpeechRecognitionAlt {
  start(): void; stop(): void;
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
}

export function useSpeech(lang = "pt-PT") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recog, setRecog] = useState<SpeechRecognitionAlt | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    setSupported(true);
    const r: SpeechRecognitionAlt = new SR();
    r.continuous = true; r.interimResults = true; r.lang = lang;
    r.onresult = (e: any) => {
      let final = "";
      for (let i = 0; i < e.results.length; i++) final += e.results[i][0].transcript;
      setTranscript(final);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    setRecog(r);
  }, [lang]);

  const start = () => { if (!recog) return; setTranscript(""); try { recog.start(); setListening(true); } catch {} };
  const stop = () => { if (!recog) return; try { recog.stop(); } catch {}; setListening(false); };
  const reset = () => setTranscript("");

  return { supported, listening, transcript, start, stop, reset, setTranscript };
}
