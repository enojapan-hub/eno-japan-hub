import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpen, Brain, Home, ListChecks, LogOut, Moon, Sun, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/belajar", label: "Belajar", icon: BookOpen },
  { to: "/quiz", label: "Quiz", icon: ListChecks },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({ title, description, backTo, backLabel = "Kembali", children }: { title: string; description?: string; backTo?: string; backLabel?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  async function handleSignOut() { await signOutCleanly(queryClient); navigate({ to: "/auth", replace: true }); }
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  return (
    <div className={cn("min-h-screen pb-24 transition-colors duration-300 md:pb-8", darkMode ? "bg-slate-950 text-slate-50" : "bg-gradient-to-b from-background via-background to-primary/[0.035]", focusMode && "[&_header]:opacity-30 [&_header]:hover:opacity-100 [&_main>div:first-child]:hidden [&_main]:max-w-3xl") }>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl transition-opacity duration-300">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="ENO JAPAN"><BrandMark /></Link>
          <nav aria-label="Navigasi utama" className="hidden md:block"><ul className="flex items-center gap-1">{navItems.map((item) => <li key={item.to}><Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined} className={cn("rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5", isActive(item.to) ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>{item.label}</Link></li>)}</ul></nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title={focusMode ? "Keluar mode fokus" : "Mode fokus"} onClick={() => setFocusMode((v) => !v)}><Brain className="size-4" /></Button>
            <Button variant="ghost" size="icon" title={darkMode ? "Gunakan tema terang" : "Gunakan tema gelap"} onClick={() => setDarkMode((v) => !v)}>{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Keluar"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {!focusMode ? <JlptStatusBar /> : null}
        <div className="mb-6">{backTo ? <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft aria-hidden className="size-3.5" />{backLabel}</Link> : null}<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}</div>{children}
      </main>
      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-xl md:hidden"><ul className="mx-auto flex w-full max-w-5xl items-stretch overflow-x-auto">{navItems.map((item) => { const active = isActive(item.to); const Icon = item.icon; return <li key={item.to} className="min-w-[4.25rem] flex-1"><Link to={item.to} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}><Icon aria-hidden className="size-5" />{item.label}</Link></li>; })}</ul></nav>
    </div>
  );
}
