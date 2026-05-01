import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { VoiceFAB } from "./VoiceFAB";

export function AppLayout({ title }: { title?: string }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title={title} />
      <main className="pb-32 animate-fade-up">
        <Outlet />
      </main>
      <VoiceFAB />
    </div>
  );
}
