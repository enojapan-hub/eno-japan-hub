import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, CheckCircle2, Headphones, Languages, ListChecks, Newspaper, Trophy, Type, FileText, Sparkles, Target } from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { adaptiveTaskLabels, fetchAdaptivePlan, type AdaptiveTaskType } from "@/lib/adaptive-plan";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { AppShell } from "@/components/layout/AppShell";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => ({ meta: [{ title: "Beranda — enonihongo" }] }), component: DashboardPage });

const modules = [
  { to: "/kanji", label: "Kanji", icon: Type, tone: "text-emerald-600 bg-emerald-50" },
  { to: "/kotoba", label: "Kotoba", icon: Languages, tone: "text-amber-500 bg-amber-50" },
  { to: "/bunpo", label: "Bunpō", icon: FileText, tone: "text-violet-600 bg-violet-50" },
  { to: "/dokkai", label: "Dokkai", icon: BookOpen, tone: "text-rose-500 bg-rose-50" },
  { to: "/listening", label: "Listening", icon: Headphones, tone: "text-sky-500 bg-sky-50" },
  { to: "/quiz", label: "Quiz", icon: ListChecks, tone: "text-teal-600 bg-teal-50" },
] as const;

const japanNews = [
  { title: "Berita Jepang terbaru", summary: "Ikuti kabar dan informasi terbaru seputar Jepang.", url: "https://www3.nhk.or.jp/nhkworld/id/news/" },
  { title: "NHK WORLD-JAPAN", summary: "Berita Jepang dan informasi terkini dalam berbagai bahasa.", url: "https://www3.nhk.or.jp/nhkworld/" },
  { title: "Informasi Jepang", summary: "Berita, budaya, perjalanan, dan kehidupan di Jepang.", url: "https://www.japan.go.jp/" },
];

const taskLinks: Partial<Record<AdaptiveTaskType, string>> = {
  new_kanji: "/kanji",
  new_vocabulary: "/kotoba",
  new_grammar: "/bunpo",
  review: "/belajar",
  quiz: "/quiz",
  reading: "/dokkai",
  listening: "/listening",
};

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? rawLevel as Level : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const adaptive = useQuery({ queryKey: ["adaptive-plan"], queryFn: fetchAdaptivePlan, enabled: !isLoading && !isError, staleTime: 30_000 });
  const leaderboard = useQuery({ queryKey: ["leaderboard"], queryFn: () => fetchLeaderboard(10), enabled: !isLoading && !isError, staleTime: 60_000 });

  const name = data?.profile?.display_name?.trim();
  const hasAdaptive = Boolean(adaptive.data?.active && adaptive.data.tasks.length);
  const completed = hasAdaptive ? adaptive.data?.completed ?? 0 : daily.data?.completed ?? 0;
  const target = hasAdaptive ? adaptive.data?.target ?? 0 : daily.data?.target ?? 5;
  const percent = target ? Math.min(100, completed / target * 100) : 0;

  return <AppShell compact title="Beranda">
    {isLoading ? <div className="space-y-4"><Skeleton className="h-44 w-full rounded-3xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div> : isError ? <Card><CardContent className="p-5 text-sm">Data belum bisa dimuat. <button className="font-semibold text-primary" onClick={() => refetch()}>Coba lagi</button></CardContent></Card> : <div className="relative z-10 space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24594f] via-[#2f6c60] to-[#45637a] p-5 text-white shadow-lg">
        <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/70"><Sparkles className="size-4" /><span className="text-[11px] font-medium">ENO NIHONGO</span></div>
          <p className="mt-4 text-xs text-white/70">{name ? `Selamat datang, ${name}` : "Selamat datang! 👋"}</p>
          <h1 className="mt-1 max-w-[300px] text-[24px] font-bold leading-tight tracking-tight">Hari ini kamu tidak perlu memilih materi sendiri.</h1>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/12 px-3 py-2"><p className="text-[10px] text-white/60">Target</p><p className="mt-0.5 text-sm font-bold">JLPT {adaptive.data?.targetLevel || level}</p></div>
            <div className="rounded-2xl bg-white/12 px-3 py-2"><p className="text-[10px] text-white/60">Hari ini</p><p className="mt-0.5 text-sm font-bold">{completed}/{target || 0}</p></div>
            {adaptive.data?.active && adaptive.data.daysLeft !== null && <div className="rounded-2xl bg-white/12 px-3 py-2"><p className="text-[10px] text-white/60">Sisa waktu</p><p className="mt-0.5 text-sm font-bold">{adaptive.data.daysLeft} hari</p></div>}
          </div>
        </div>
      </section>

      <JlptStatusBar />

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-medium text-muted-foreground">Target belajar hari ini</p><p className="mt-1 text-lg font-bold">{completed} dari {target || 0} selesai</p></div><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Target className="size-5" /></span></div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground"><span>{Math.round(percent)}% selesai</span><span>{target - completed > 0 ? `${target - completed} aktivitas lagi` : "Target tercapai 🎉"}</span></div>
      </CardContent></Card>

      {hasAdaptive && <section>
        <div className="mb-2 flex items-center justify-between px-1"><div><h2 className="text-sm font-semibold">Belajar Hari Ini</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Disusun otomatis dari progres, kuis, review, dan sisa waktu.</p></div><Target className="size-4 text-primary" /></div>
        <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="p-3"><div className="space-y-2">{adaptive.data?.tasks.map(task => {
          const to = taskLinks[task.task_type] || "/belajar";
          const done = Math.min(task.completed_count, task.target_count);
          const taskPercent = task.target_count ? Math.min(100, done / task.target_count * 100) : 0;
          return <Link key={task.id} to={to as "/belajar"} className="block rounded-xl border p-3 transition hover:border-primary/30 hover:bg-muted/30"><div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-lg ${done >= task.target_count && task.target_count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-[12px] font-semibold">{adaptiveTaskLabels[task.task_type]}</span><span className="text-[11px] font-bold">{done}/{task.target_count}</span></span><span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${taskPercent}%` }} /></span>{task.reason && <span className="mt-1.5 block text-[9px] leading-3 text-muted-foreground">{task.reason}</span>}</span><ArrowRight className="size-3.5 shrink-0" /></div></Link>;
        })}</div></CardContent></Card>
      </section>}

      <section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-sm font-semibold">Mulai belajar</h2><Link to="/belajar" className="text-[11px] font-semibold text-primary">Lihat semua</Link></div><div className="grid grid-cols-3 gap-2.5">{modules.map(({ to, label, icon: Icon, tone }) => <Link key={to} to={to} aria-label={label} className="group block min-w-0"><Card className="h-full rounded-2xl border-border/60 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md"><CardContent className="flex min-h-[98px] flex-col items-center justify-center gap-2 p-2 text-center"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span><span className="text-[11px] font-medium leading-tight">{label}</span></CardContent></Card></Link>)}</div></section>

      <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><h2 className="text-[13px] font-semibold">Rekomendasi materi</h2><p className="mt-0.5 text-[10px] text-muted-foreground">Materi awal sesuai level aktifmu.</p></div><CheckCircle2 className="size-4 text-primary" /></div><div className="mt-3 space-y-2">{daily.data?.items.slice(0,3).map(item => <div key={`${item.type}:${item.id}`}>{item.type === "kanji" ? <Link to="/kanji/$id" params={{ id: item.id }} className="flex items-center gap-3 rounded-xl border p-2.5 transition hover:border-primary/30"><CheckCircle2 className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate text-[12px]">{item.label}</span><ArrowRight className="size-3.5" /></Link> : item.type === "vocabulary" ? <Link to="/kotoba/$id" params={{ id: item.id }} className="flex items-center gap-3 rounded-xl border p-2.5 transition hover:border-primary/30"><CheckCircle2 className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate text-[12px]">{item.label}</span><ArrowRight className="size-3.5" /></Link> : <Link to="/bunpo" className="flex items-center gap-3 rounded-xl border p-2.5 transition hover:border-primary/30"><CheckCircle2 className="size-4 text-primary" /><span className="min-w-0 flex-1 truncate text-[12px]">{item.label}</span><ArrowRight className="size-3.5" /></Link>}</div>)}</div></CardContent></Card>

      <section><div className="mb-2 flex items-center gap-2 px-1"><Trophy className="size-4 text-amber-500" /><h2 className="text-sm font-semibold">Peringkat enonihongo</h2></div><Card><CardContent className="p-3">{leaderboard.isLoading ? <Skeleton className="h-12 w-full" /> : leaderboard.data?.length ? leaderboard.data.map((u,i) => <div key={u.userId} className="flex items-center gap-2.5 rounded-xl p-2"><span className="w-6 text-center text-xs font-bold">{i+1}</span><span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{u.displayName}</span><span className="text-[11px] font-bold">{u.xp.toLocaleString("id-ID")} XP</span></div>) : <p className="py-4 text-center text-xs text-muted-foreground">Peringkat belum tersedia</p>}</CardContent></Card></section>

      <section><div className="mb-2 flex items-center gap-2 px-1"><Newspaper className="size-4 text-primary" /><h2 className="text-sm font-semibold">Berita Jepang</h2></div><div className="space-y-2">{japanNews.map(n => <a key={n.url} href={n.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary/30"><Newspaper className="size-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{n.title}</span><span className="block text-[10px] leading-4 text-muted-foreground">{n.summary}</span></span><ArrowRight className="size-3.5 shrink-0" /></a>)}</div></section>
    </div>}
  </AppShell>;
}
