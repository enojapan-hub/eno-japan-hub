import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Headphones, Languages, ListChecks, Newspaper, Trophy, Type, FileText } from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { AppShell } from "@/components/layout/AppShell";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — enonihongo" }, { name: "description", content: "Ringkasan belajar bahasa Jepang, berita, dan peringkat pengguna enonihongo." }] }),
  component: DashboardPage,
});

const modules = [
  { to: "/kanji", label: "Kanji", icon: Type, tone: "text-emerald-600 bg-emerald-50" },
  { to: "/kotoba", label: "Kotoba", icon: Languages, tone: "text-amber-500 bg-amber-50" },
  { to: "/bunpo", label: "Bunpō", icon: FileText, tone: "text-violet-600 bg-violet-50" },
  { to: "/dokkai", label: "Dokkai", icon: BookOpen, tone: "text-rose-500 bg-rose-50" },
  { to: "/listening", label: "Mendengarkan", icon: Headphones, tone: "text-sky-500 bg-sky-50" },
  { to: "/quiz", label: "Simulasi JLPT", icon: ListChecks, tone: "text-teal-600 bg-teal-50" },
] as const;

const japanNews = [
  { title: "Berita Jepang terbaru", summary: "Ikuti kabar dan informasi terbaru seputar Jepang.", url: "https://www3.nhk.or.jp/nhkworld/id/news/" },
  { title: "NHK WORLD-JAPAN", summary: "Berita Jepang dan informasi terkini dalam berbagai bahasa.", url: "https://www3.nhk.or.jp/nhkworld/" },
  { title: "Informasi Jepang", summary: "Temukan berita, budaya, perjalanan, dan kehidupan di Jepang.", url: "https://www.japan.go.jp/" },
];

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? (rawLevel as Level) : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const leaderboard = useQuery({ queryKey: ["leaderboard"], queryFn: () => fetchLeaderboard(10), enabled: !isLoading && !isError, staleTime: 60_000 });
  const name = data?.profile?.display_name?.trim(); const completed = daily.data?.completed ?? 0; const target = daily.data?.target ?? 5; const percent = target ? Math.min(100, (completed / target) * 100) : 0;

  return <AppShell compact title="Beranda">
    {isLoading ? <div className="space-y-4"><Skeleton className="h-12 w-3/4 rounded-xl" /><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /></div> : isError ? <Card className="rounded-2xl"><CardContent className="p-5 text-sm">Data belum bisa dimuat. <button className="font-semibold text-primary" onClick={() => refetch()}>Coba lagi</button></CardContent></Card> : <div className="relative z-10 space-y-4">
      <section className="px-1 pt-1"><p className="text-[12px] text-muted-foreground">{name ? `Selamat datang, ${name}` : "Selamat pagi! 👋"}</p><h1 className="mt-1 text-[23px] font-bold tracking-tight">Ayo belajar bahasa Jepang hari ini!</h1></section>
      <JlptStatusBar />
      <Card className="rounded-2xl border-border/70 bg-card shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><h2 className="text-[13px] font-semibold">Ringkasan Belajar</h2><div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-500"><Flame className="size-3.5" /> Belajar hari ini</div></div><div className="my-4 grid grid-cols-3 gap-2 text-center"><div><p className="text-[10px] text-muted-foreground">Level</p><span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{level}</span></div><div><p className="text-[10px] text-muted-foreground">XP</p><p className="mt-1 text-lg font-bold">—</p></div><div><p className="text-[10px] text-muted-foreground">Target</p><p className="mt-1 text-lg font-bold">{completed}/{target}</p></div></div><div className="h-2 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div><p className="mt-1 text-right text-[10px] text-muted-foreground">{Math.max(0, target - completed)} tugas lagi hari ini</p></CardContent></Card>
      <section><div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[14px] font-semibold">Belajar</h2><Link to="/belajar" className="text-[11px] font-semibold text-primary">Lihat semua</Link></div><div className="grid grid-cols-3 gap-2.5">{modules.map(({ to, label, icon: Icon, tone }) => <Link key={to} to={to} aria-label={label} className="group block min-w-0 touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><Card className="h-full min-h-[94px] overflow-hidden rounded-xl border-border/60 shadow-sm transition-transform group-hover:-translate-y-0.5 group-active:scale-[.98]"><CardContent className="flex min-h-[94px] flex-col items-center justify-center gap-2 p-2 text-center"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" strokeWidth={2} /></span><span className="text-[11px] font-medium leading-tight">{label}</span></CardContent></Card></Link>)}</div></section>
      <Card className="rounded-2xl border-border/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><div><h2 className="text-[13px] font-semibold">Target Harian</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{completed} / {target} selesai</p></div><Link to="/belajar" className="text-[11px] font-semibold text-primary">Lihat semua</Link></div><div className="mt-3 space-y-2">{daily.isLoading ? <Skeleton className="h-12 w-full rounded-xl" /> : daily.data?.items.slice(0, 3).map(item => <Link key={`${item.type}:${item.id}`} to={(item.type === "kanji" ? "/kanji/$id" : item.type === "vocabulary" ? "/kotoba/$id" : "/bunpo/$id") as "/kanji/$id" | "/kotoba/$id" | "/bunpo/$id"} params={{ id: item.id }} className="flex items-center gap-3 rounded-xl border border-border/50 p-2.5 hover:bg-muted/40"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CheckCircle2 className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{item.label}</span><span className="block truncate text-[10px] text-muted-foreground">{item.meaning}</span></span><ArrowRight className="size-3.5 text-muted-foreground" /></Link>)}</div></CardContent></Card>
      <section><div className="mb-2 flex items-center justify-between px-1"><div className="flex items-center gap-2"><Trophy className="size-4 text-amber-500" /><h2 className="text-[14px] font-semibold">Peringkat enonihongo</h2></div><span className="text-[10px] text-muted-foreground">10 teratas</span></div><Card className="rounded-2xl border-border/60 shadow-sm"><CardContent className="p-3">{leaderboard.isLoading ? <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div> : leaderboard.data?.length ? <div className="space-y-1.5">{leaderboard.data.map((user, index) => <div key={user.userId} className="flex items-center gap-2.5 rounded-xl px-2 py-2"><span className="w-6 text-center text-xs font-bold text-muted-foreground">{index + 1}</span>{user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user.displayName.slice(0,1).toUpperCase()}</span>}<div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{user.displayName}</p><p className="text-[9px] text-muted-foreground">{user.level} · 🔥 {user.streak} hari</p></div><div className="text-right"><p className="text-[11px] font-bold">{user.xp.toLocaleString("id-ID")} XP</p><p className="text-[9px] text-muted-foreground">{user.points.toLocaleString("id-ID")} poin</p></div></div>)}</div> : <div className="py-5 text-center"><Trophy className="mx-auto size-7 text-muted-foreground/50" /><p className="mt-2 text-[12px] font-medium">Peringkat belum tersedia</p><p className="mt-1 text-[10px] text-muted-foreground">Peringkat akan muncul setelah data aktivitas pengguna tersedia.</p></div>}</CardContent></Card></section>
      <section><div className="mb-2 flex items-center gap-2 px-1"><Newspaper className="size-4 text-primary" /><h2 className="text-[14px] font-semibold">Berita Jepang</h2></div><div className="space-y-2">{japanNews.map((news) => <a key={news.url} href={news.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm transition hover:bg-muted/30"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500"><Newspaper className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{news.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">{news.summary}</span></span><ArrowRight className="size-3.5 shrink-0 text-muted-foreground" /></a>)}</div></section>
      <Link to="/belajar" className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3 hover:bg-muted/30"><div><p className="text-[12px] font-semibold">Mulai belajar</p><p className="text-[10px] text-muted-foreground">Lanjutkan materi sesuai levelmu.</p></div><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><ArrowRight className="size-4" /></span></Link>
    </div>}
  </AppShell>;
}
