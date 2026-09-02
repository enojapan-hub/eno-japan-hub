import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, BookOpen, Brain, Home, ListChecks, LogOut, Moon, Sun, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/belajar", label: "Belajar", icon: BookOpen },
  { to: "/quiz", label: "Latihan", icon: ListChecks },
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
    <div className={cn("min-h-screen bg-background pb-20 text-foreground md:pb-8", focusMode && "[&_header]:opacity-40 [&_header]:hover:opacity-100")}>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="shrink-0" aria-label="enonihongo"><BrandMark /></Link>
          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1">
              {navItems.map((item) => <li key={item.to}><Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined} className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors", isActive(item.to) ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/70 hover:text-foreground")}><item.icon className="size-3.5" />{item.label}</Link></li>)}
            </ul>
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" title={focusMode ? "Keluar mode fokus" : "Mode fokus"} onClick={() => setFocusMode((v) => !v)}><Brain className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" title={darkMode ? "Tema terang" : "Tema gelap"} onClick={toggleTheme}>{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" title="Keluar" onClick={handleSignOut}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {!focusMode && <JlptStatusBar />}
        <div className="mb-6">
          {backTo && <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">← {backLabel}</Link>}
          <h1 className="text-[21px] font-semibold leading-tight tracking-tight sm:text-[24px]">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-[13px] leading-5 text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-lg md:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch px-2">
          {navItems.map((item) => { const active = isActive(item.to); const Icon = item.icon; return <li key={item.to} className="flex-1"><Link to={item.to} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}><span className={cn("grid size-8 place-items-center rounded-xl", active && "bg-primary/10")}><Icon className="size-[17px]" /></span>{item.label}</Link></li>; })}
        </ul>
      </nav>
    </div>
  );
}
