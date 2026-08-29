import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Home, LogOut, User } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/BrandMark";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/belajar", label: "Belajar", icon: BookOpen },
  { to: "/jlpt", label: "JLPT", icon: GraduationCap },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    await signOutCleanly(queryClient);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2" aria-label="ENO JAPAN">
            <BrandMark />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            <LogOut aria-hidden className="size-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Keluar</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {children}
      </main>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 backdrop-blur"
      >
        <ul className="mx-auto flex w-full max-w-5xl items-stretch">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
