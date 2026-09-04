import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  Headphones,
  Languages,
  Pencil,
  Sparkles,
  Target,
  Type,
  Zap,
} from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { fetchAdaptivePlan } from "@/lib/adaptive-plan";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { AppShell } from "@/components/layout/AppShell";
import { JlptStatusBar } from "@/components/layout/JlptStatusBar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — ENO NIHONGO" }] }),
  component: DashboardPage,
});

const materialProgress = [
  { label: "Kanji", value: 40, detail: "120 / 300", icon: Type },
  { label: "Kosakata", value: 39, detail: "220 / 570", icon: Languages },
  { label: "Bunpou", value: 38, detail: "15 / 40", icon: BookOpen },
  { label: "Dokkai", value: 55, detail: "22 latihan", icon: CheckCircle2 },
  { label: "Choukai", value: 80, detail: "80%", icon: Headphones },
];

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? rawLevel as Level : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const adaptive = useQuery({ queryKey: ["adaptive-plan"], queryFn: fetchAdaptivePlan, enabled: !isLoading && !isError, staleTime: 30_000 });
  const leaderboard = useQuery({ queryKey: ["leaderboard", 100], queryFn: () => fetchLeaderboard(100), enabled: !isLoading && !isError, staleTime: 60_000 });

  const profile = data?.profile;
  const me = leaderboard.data?.find((u) => u.userId === profile?.id);
  const name = profile?.display_name?.trim() || "Pembelajar";
  const completed = adaptive.data?.completed ?? daily.data?.completed ?? 0;
  const target = adaptive.data?.target ?? daily.data?.target ?? 5;
  const percent = target ? Math.min(100, (completed / target) * 100) : 0;
  const nextItem = daily.data?.items?.[0];

  if (isLoading) {
    return <AppShell compact title="Home"><div className="space-y-3"><Skeleton className="h-32 w-full rounded-2xl" /><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div></AppShell>;
  }

  if (isError) {
    return <AppShell compact title="Home"><Card><CardContent className="p-5 text-sm">Data belum bisa dimuat. <button className="font-semibold text-primary" onClick={() => refetch()}>Coba lagi</button></CardContent></Card></AppShell>;
  }

  return (
    <AppShell compact title="Home">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="relative shrink-0">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} className="size-14 rounded-full border object-cover" /> : <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">{name.slice(0, 1).toUpperCase()}</div>}
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground">Lv {Math.max(1, Math.floor((me?.xp ?? 0) / 500) + 1)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground">Selamat Datang Kembali 👋</p>
              <h1 className="truncate text-[19px] font-bold tracking-tight">{name}</h1>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">Menuju {level} dengan belajar konsisten 🎯</p>
            </div>
          </div>
          <Link to="/profil" className="grid size-9 shrink-0 place-items-center rounded-xl border text-muted-foreground transition hover:border-primary/30 hover:text-primary" aria-label="Edit profil"><Pencil className="size-4" /></Link>
        </section>

        <section className="grid grid-cols-4 gap-2">
          <Stat icon={Zap} value={(me?.xp ?? 0).toLocaleString("id-ID")} label="XP" />
          <Stat icon={Sparkles} value={(me?.points ?? 0).toLocaleString("id-ID")} label="Points" />
          <Stat icon={Flame} value={`${me?.streak ?? 0}`} label="Hari" />
          <Stat icon={Target} value={level} label="Level" />
        </section>

        <Card className="rounded-2xl border-primary/20 bg-primary/[0.035] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-primary">Lanjutkan Pelajaran</p>
                <h2 className="mt-1 truncate text-[14px] font-bold">{nextItem?.label || `Materi ${level}`}</h2>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Aktivitas terakhir / rekomendasi berikutnya</p>
              </div>
              <Link to="/target" className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><ArrowRight className="size-4" /></Link>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} /></div>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted-foreground"><span>{Math.round(percent)}% target hari ini</span><span>{completed}/{target}</span></div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-2 flex items-center justify-between px-1"><h2 className="text-[13px] font-semibold">Progress Materi</h2><Link to="/progress" className="text-[10px] font-semibold text-primary">Detail</Link></div>
          <div className="grid grid-cols-5 gap-2">
            {materialProgress.map(({ label, value, detail, icon: Icon }) => <div key={label} className="rounded-2xl border bg-card p-2 text-center"><div className="mx-auto grid size-9 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></div><p className="mt-1.5 text-[9px] font-semibold">{label}</p><p className="mt-0.5 text-[8px] text-muted-foreground">{detail}</p><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></div></div>)}
          </div>
        </section>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between"><div><h2 className="text-[13px] font-semibold">Statistik Mingguan</h2><p className="mt-0.5 text-[9px] text-muted-foreground">Waktu belajar dan konsistensi</p></div><Clock3 className="size-4 text-primary" /></div>
            <div className="mt-4 flex h-20 items-end justify-between gap-2">{[42, 65, 38, 78, 54, 88, Math.max(22, Math.min(100, Math.round(percent)))].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full max-w-7 rounded-t-md bg-primary/70" style={{ height: `${height}%` }} /><span className="text-[8px] text-muted-foreground">{["Sen","Sel","Rab","Kam","Jum","Sab","Min"][i]}</span></div>)}</div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground"><span>{me?.studyMinutes ?? 0} menit total</span><span>{me?.lessonsCompleted ?? 0} materi selesai</span></div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-2 flex items-center gap-2 px-1"><CalendarDays className="size-4 text-primary" /><h2 className="text-[13px] font-semibold">JLPT</h2></div>
          <JlptStatusBar />
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Zap; value: string; label: string }) {
  return <div className="rounded-2xl border bg-card px-2 py-2.5 text-center"><Icon className="mx-auto size-3.5 text-primary" /><p className="mt-1 text-[11px] font-bold leading-none">{value}</p><p className="mt-1 text-[8px] text-muted-foreground">{label}</p></div>;
}
