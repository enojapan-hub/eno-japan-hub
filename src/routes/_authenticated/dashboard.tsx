import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Headphones, Languages, ListChecks, MessageCircle, Text } from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { AppShell } from "@/components/layout/AppShell";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — enonihongo" }, { name: "description", content: "Ringkasan belajar bahasa Jepang dan target harian." }] }),
  component: DashboardPage,
});

const modules = [
  { to: "/kanji", label: "Kanji", icon: Languages, tone: "text-emerald-600 bg-emerald-50" },
  { to: "/kotoba", label: "Kotoba", icon: MessageCircle, tone: "text-amber-500 bg-amber-50" },
  { to: "/bunpo", label: "Bunpō", icon: Text, tone: "text-violet-600 bg-violet-50" },
  { to: "/dokkai", label: "Dokkai", icon: BookOpen, tone: "text-rose-500 bg-rose-50" },
  { to: "/listening", label: "Mendengarkan", icon: Headphones, tone: "text-sky-500 bg-sky-50" },
  { to: "/quiz", label: "Simulasi JLPT", icon: ListChecks, tone: "text-teal-600 bg-teal-50" },
] as const;

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? (rawLevel as Level) : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const name = data?.profile?.display_name?.trim(); const completed = daily.data?.completed ?? 0; const target = daily.data?.target ?? 5; const percent = target ? Math.min(100, (completed / target) * 100) : 0;

  return <AppShell compact title="Beranda">
    {isLoading ? <div className="space-y-4"><Skeleton className="h-12 w-3/4 rounded-xl" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /></div> : isError ? <Card className="rounded-2xl"><CardContent className="p-5 text-sm">Data belum bisa dimuat. <button className="font-semibold text-primary" onClick={() => refetch()}>Coba lagi</button></CardContent></Card> : <div className="relative z-10 space-y-4">
      <section className="px-1 pt-1"><p className="text-[12px] text-muted-foreground">{name ? `Selamat datang, ${name}` : "Selamat pagi! 👋"}</p><h1 className="mt-1 text-[23px] font-bold tracking-tight">Ayo belajar bahasa Jepang hari ini!</h1></section>
      <JlptStatusBar />
      <Card className="rounded-2xl border-border/70 bg-card shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><h2 className="flex items-center gap-1 text-[13px] font-semibold">📈 Ringkasan Belajar</h2><div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-500"><Flame className="size-3.5" /> Belajar hari ini</div></div><div className="my-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-[10px] text-muted-foreground">Level</p><span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{level}</span></div><div><p className="text-[10px] text-muted-foreground">XP</p><p className="mt-1 text-lg font-bold">—</p></div><div><p className="text-[10px] text-muted-foreground">Target</p><p className="mt-1 text-lg font-bold">{completed}/{target}</p></div></div><div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-right text-[10px] text-muted-foreground">{Math.max(0, target - completed)} tugas lagi hari ini</p></CardContent></Card>
      <section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[14px] font-semibold">Belajar</h2><Link to="/belajar" className="text-[11px] font-semibold text-primary">Lihat semua</Link></div><div className="grid grid-cols-3 gap-2.5">{modules.map(({ to, label, icon: Icon, tone }) => <Card key={to} className="relative h-full overflow-hidden rounded-xl border-border/60 shadow-sm transition-transform active:scale-[.98] hover:-translate-y-0.5"><CardContent className="flex min-h-[94px] flex-col items-center justify-center gap-2 p-2 text-center"><span className={`grid size-10 place-items-center rounded-xl text-lg ${tone}`}><Icon className="size-5" strokeWidth={2} /></span><span className="text-[11px] font-medium leading-tight">{label}</span></CardContent><a href={to} aria-label={label} className="absolute inset-0 z-[100] block cursor-pointer touch-manipulation" /></Card>)}</div></section>
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><h2 className="text-[13px] font-semibold">Target Harian</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{completed} / {target} selesai</p></div><Link to="/belajar" className="text-[11px] font-semibold text-primary">Lihat semua</Link></div><div className="mt-3 space-y-2">{daily.isLoading ? <Skeleton className="h-12 w-full rounded-xl" /> : daily.data?.items.slice(0, 3).map(item => <Link key={`${item.type}:${item.id}`} to={(item.type === "kanji" ? "/kanji/$id" : item.type === "vocabulary" ? "/kotoba/$id" : "/bunpo/$id") as "/kanji/$id" | "/kotoba/$id" | "/bunpo/$id"} params={{ id: item.id }} className="flex items-center gap-3 rounded-xl border border-border/50 p-2.5 hover:bg-muted/40"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{item.label}</span><span className="block truncate text-[10px] text-muted-foreground">{item.meaning}</span></span><ArrowRight className="size-3.5 text-muted-foreground" /></Link>)}</div></CardContent></Card>
      <Link to="/belajar" className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted/30"><div><p className="text-[12px] font-semibold">Mulai belajar</p><p className="text-[10px] text-muted-foreground">Lanjutkan materi sesuai levelmu.</p></div><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><ArrowRight className="size-4" /></span></Link>
    </div>}
  </AppShell>;
}
