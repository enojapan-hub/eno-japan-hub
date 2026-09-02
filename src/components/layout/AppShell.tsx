import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BookOpen, Brain, Home, ListChecks, LogOut, Moon, Sun, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/belajar", label: "Belajar", icon: BookOpen },
  { to: "/quiz", label: "Kuis", icon: ListChecks },
  { to: "/progress", label: "Kemajuan", icon: BarChart3 },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({ title, description, backTo, backLabel = "Kembali", children }: { title: string; description?: string; backTo?: string; backLabel?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("enonihongo-theme") === "dark";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("enonihongo-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleSignOut() {
    await signOutCleanly(queryClient);
    navigate({ to: "/auth", replace: true });
  }

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className={cn("min-h-screen bg-background pb-20 text-foreground transition-colors md:pb-8", focusMode && "[&_header]:opacity-40 [&_header]:hover:opacity-100") }>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/dashboard" className="shrink-0" aria-label="enonihongo"><BrandMark /></Link>
          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {navItems.map((item) => <li key={item.to}><Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined} className={cn("rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{item.label}</Link></li>)}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" title={focusMode ? "Keluar mode fokus" : "Mode fokus"} onClick={() => setFocusMode((v) => !v)}><Brain className="size-4" /></Button>
            <Button variant="ghost" size="icon" title={darkMode ? "Tema terang" : "Tema gelap"} onClick={toggleTheme}>{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            <Button variant="ghost" size="icon" title="Keluar" onClick={handleSignOut}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {!focusMode && <JlptStatusBar />}
        <div className="mb-7">
          {backTo && <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />{backLabel}</Link>}
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur-xl md:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch">
          {navItems.map((item) => { const active = isActive(item.to); const Icon = item.icon; return <li key={item.to} className="flex-1"><Link to={item.to} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}><Icon className="size-5" />{item.label}</Link></li>; })}
        </ul>
      </nav>
    </div>
  );
}
