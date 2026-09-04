import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Home,
  ListChecks,
  Moon,
  Settings,
  Sun,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";

const navItems = [
  { to: "/target", label: "Target", icon: Target },
  { to: "/belajar", label: "Materi", icon: BookOpen },
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/simulasi", label: "Simulasi", icon: ListChecks },
  { to: "/leaderboard", label: "Peringkat", icon: Trophy },
] as const;

type Props = {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  compact?: boolean;
  children: ReactNode;
};

export function AppShell({ title, description, backTo, backLabel = "Kembali", compact = false, children }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="relative min-h-screen bg-background pb-[calc(5.25rem+env(safe-area-inset-bottom))] text-foreground md:pb-8">
      <header className="sticky top-0 z-30 border-b border-border/55 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          {backTo ? (
            <Link to={backTo} aria-label={backLabel} className="flex min-w-0 items-center gap-2">
              <ArrowLeft className="size-[18px] shrink-0" />
              <span className="truncate text-[14px] font-semibold">{title}</span>
            </Link>
          ) : (
            <Link to="/dashboard" className="flex items-center gap-2" aria-label="ENO NIHONGO">
              <BrandMark />
            </Link>
          )}

          <div className="flex items-center gap-0.5">
            {!backTo && (
              <Button variant="ghost" size="icon" className="relative size-9 rounded-xl" title="Pemberitahuan" aria-label="Pemberitahuan">
                <Bell className="size-[17px]" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-destructive" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-9 rounded-xl" title={darkMode ? "Mode terang" : "Mode gelap"} onClick={toggleTheme} aria-label={darkMode ? "Mode terang" : "Mode gelap"}>
              {darkMode ? <Sun className="size-[17px]" /> : <Moon className="size-[17px]" />}
            </Button>
            {!backTo && (
              <Link to="/pengaturan" aria-label="Pengaturan" className="grid size-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted/60 hover:text-foreground">
                <Settings className="size-[17px]" />
              </Link>
            )}
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="mx-auto hidden max-w-5xl px-4 pb-2 md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={isActive(item.to) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                    isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className={cn("relative z-10 mx-auto w-full max-w-5xl px-4 py-5", compact && "py-4")}>
        {!compact && !backTo && description && <p className="mb-4 text-[12px] leading-5 text-muted-foreground">{description}</p>}
        {!compact && backTo && description && <p className="mb-4 text-[12px] text-muted-foreground">{description}</p>}
        {children}
      </main>

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <ul className="mx-auto flex h-[4.15rem] w-full max-w-lg items-center px-1">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to} className="h-full flex-1">
                <Link to={item.to} aria-current={active ? "page" : undefined} className="group flex h-full w-full items-center justify-center">
                  <span className={cn("flex min-w-[3.2rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition", active ? "text-primary" : "text-muted-foreground")}>
                    <span className={cn("grid size-8 place-items-center rounded-xl transition", active && "bg-primary/10")}>
                      <Icon className="size-[19px]" strokeWidth={active ? 2.4 : 1.9} />
                    </span>
                    <span className={cn("text-[9.5px] leading-3 tracking-[-0.01em]", active ? "font-semibold" : "font-medium")}>{item.label}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
