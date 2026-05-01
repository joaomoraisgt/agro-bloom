import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, Lock } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("joao@soutos.pt");
  const [pass, setPass] = useState("••••••••");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    nav("/app");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-cream grain">
      {/* Decorative orbs */}
      <div className="absolute -top-32 -right-32 size-[420px] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-32 size-[480px] rounded-full bg-honey/15 blur-3xl" />

      <div className="relative min-h-screen flex flex-col px-6 pt-16 pb-10 safe-top safe-bottom max-w-md mx-auto">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[11px] tracking-[0.2em] uppercase text-primary font-medium">Soutos · 30 ha</span>
          </div>
          <h1 className="font-display text-5xl mt-6 leading-[1.05] tracking-tight">
            Gestão do<br />
            <span className="italic font-light">souto</span>, na palma da mão.
          </h1>
          <p className="text-muted-foreground mt-4 leading-relaxed max-w-xs">
            Castanheiros, mel, finanças e tarefas — tudo num só lugar, mesmo sem rede.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 mt-auto">
          <label className="block">
            <span className="text-xs text-muted-foreground tracking-wide ml-4">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 rounded-2xl bg-card border border-border/60 pl-11 pr-4 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground tracking-wide ml-4">Palavra-passe</span>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full h-14 rounded-2xl bg-card border border-border/60 pl-11 pr-4 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 mt-4 active:scale-[0.99] transition-transform shadow-soft"
          >
            Entrar <ArrowRight className="size-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Esqueceu-se da palavra-passe?
          </p>
        </form>
      </div>
    </div>
  );
}
