import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Bell, BookOpen, Brain, Home, ListChecks, LogOut, Moon, Settings, Sun, User, ArrowLeft } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/belajar", label: "Belajar", icon: BookOpen },
  { to: "/progress", label: "Kemajuan", icon: BarChart3 },
  { to: "/quiz", label: "Simulasi", icon: ListChecks },
  { to: "/profil", label: "Akun", icon: User },
] as const;

type Props = { title: string; description?: string; backTo?: string; backLabel?: string; compact?: boolean; children: ReactNode };

export function AppShell({ title, description, backTo, backLabel = "Kembali", compact = false, children }: Props) {
  const navigate = useNavigate(); const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [focusMode, setFocusMode] = useState(false); const [darkMode, setDarkMode] = useState(false);
  useEffect(() => { const saved = window.localStorage.getItem("enonihongo-theme") === "dark"; setDarkMode(saved); document.documentElement.classList.toggle("dark", saved); }, []);
  function toggleTheme() { setDarkMode(current => { const next = !current; document.documentElement.classList.toggle("dark", next); window.localStorage.setItem("enonihongo-theme", next ? "dark" : "light"); return next; }); }
  async function handleSignOut() { await signOutCleanly(queryClient); navigate({ to: "/auth", replace: true }); }
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return <div className={cn("relative min-h-screen bg-background pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-foreground md:pb-8", focusMode && "[&_header]:opacity-40 [&_header]:hover:opacity-100")}>
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        {backTo ? <Link to={backTo} aria-label={backLabel} className="flex items-center gap-2"><ArrowLeft className="size-5" /><span className="text-[15px] font-semibold">{title}</span></Link> : <Link to="/dashboard" className="flex items-center gap-2" aria-label="enonihongo"><BrandMark /></Link>}
        <div className="flex items-center gap-1">
          {!backTo && <Button variant="ghost" size="icon" className="size-9 rounded-xl" title="Notifikasi"><Bell className="size-[18px]" /></Button>}
          {!backTo && <Link to="/pengaturan" aria-label="Pengaturan" className="grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground"><Settings className="size-[18px]" /></Link>}
          <Button variant="ghost" size="icon" className="size-9 rounded-xl" title={focusMode ? "Keluar mode fokus" : "Mode fokus"} onClick={() => setFocusMode(v => !v)}><Brain className="size-4" /></Button>
          <Button variant="ghost" size="icon" className="size-9 rounded-xl" title={darkMode ? "Tema terang" : "Tema gelap"} onClick={toggleTheme}>{darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
          <Button variant="ghost" size="icon" className="size-9 rounded-xl" title="Keluar" onClick={handleSignOut}><LogOut className="size-4" /></Button>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="mx-auto hidden max-w-5xl px-4 pb-2 md:block"><ul className="flex items-center gap-1">{navItems.map(item => <li key={item.to}><Link to={item.to} aria-current={isActive(item.to) ? "page" : undefined} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50") }><item.icon className="size-3.5" />{item.label}</Link></li>)}</ul></nav>
    </header>

    <main className={cn("relative z-10 mx-auto w-full max-w-5xl px-4 py-5", compact && "py-4")}>
      {!compact && !backTo && <div className="mb-5">{description && <p className="text-[12px] leading-5 text-muted-foreground">{description}</p>}</div>}
      {!compact && backTo && description && <p className="mb-4 text-[12px] text-muted-foreground">{description}</p>}
      {children}
    </main>

    <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(15_23_42_/_0.06)] backdrop-blur-2xl md:hidden">
      <ul className="mx-auto flex h-[4.35rem] w-full max-w-lg items-center px-2">
        {navItems.map(item => {
          const active = isActive(item.to); const Icon = item.icon;
          return <li key={item.to} className="h-full flex-1">
            <Link to={item.to} aria-current={active ? "page" : undefined} className="group flex h-full w-full items-center justify-center">
              <span className={cn("flex min-w-[3.7rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 transition-all duration-200", active ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-muted/60 group-hover:text-foreground")}>
                <Icon className={cn("size-[20px] transition-transform duration-200", active && "-translate-y-px")} strokeWidth={active ? 2.4 : 1.9} />
                <span className={cn("text-[10px] leading-3 tracking-[-0.01em]", active ? "font-semibold" : "font-medium")}>{item.label}</span>
              </span>
            </Link>
          </li>;
        })}
      </ul>
    </nav>
  </div>;
}
