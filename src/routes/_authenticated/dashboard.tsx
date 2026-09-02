import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, Flame, Target } from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — enonihongo" }, { name: "description", content: "Ringkasan belajar bahasa Jepang." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? (rawLevel as Level) : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const name = data?.profile?.display_name ?? "";

  return <AppShell title={isLoading ? "Beranda" : name ? `Selamat datang, ${name}` : "Selamat belajar"} description={`Target ${level} · belajar sedikit setiap hari`}>
    {isLoading ? <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div> : isError ? <Card className="rounded-2xl border-border/60 shadow-none"><CardHeader><CardTitle>Data belum bisa dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button onClick={() => refetch()}>Coba lagi</Button></CardContent></Card> : <div className="space-y-4">
      <section className="rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-medium opacity-80">Target belajar</p><h2 className="mt-1 text-xl font-semibold">JLPT {level}</h2><p className="mt-1 text-xs opacity-80">Sedikit setiap hari, terus berkembang.</p></div>
          <div className="grid size-11 place-items-center rounded-2xl bg-white/15"><BookOpen className="size-5" /></div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3"><span className="text-xs opacity-80">Rangkaian belajar</span><span className="text-sm font-semibold">{data?.stats?.current_streak ?? 0} hari</span></div>
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        <TargetCard icon="漢字" label="Kanji" value={data?.settings?.daily_kanji_target ?? 5} />
        <TargetCard icon="言葉" label="Kotoba" value={data?.settings?.daily_vocab_target ?? 10} />
        <TargetCard icon="文法" label="Bunpō" value={data?.settings?.daily_grammar_target ?? 5} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-none">
        <CardHeader className="px-4 pb-3 pt-4"><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">Belajar hari ini</CardTitle><CardDescription className="text-xs">{daily.isLoading ? "Menyiapkan materi…" : `${daily.data?.completed ?? 0} dari ${daily.data?.target ?? 5} selesai`}</CardDescription></div><Badge variant="secondary" className="rounded-lg text-[11px]">{level}</Badge></div></CardHeader>
        <CardContent className="space-y-1 px-2 pb-2">{daily.error ? <p className="p-3 text-xs text-destructive">Gagal memuat target harian.</p> : daily.data?.items.map(item => { const path = item.type === "kanji" ? "/kanji/$id" : item.type === "vocabulary" ? "/kotoba/$id" : "/bunpo/$id"; return <Link key={`${item.type}:${item.id}`} to={path as never} params={{ id: item.id } as never} className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-muted"><div className="min-w-0"><div className="text-sm font-medium">{item.label}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.reading ? `${item.reading} · ` : ""}{item.meaning}</div></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>; })}{!daily.isLoading && !daily.data?.items.length && <p className="p-3 text-xs text-muted-foreground">Belum ada materi untuk level ini.</p>}</CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2.5"><Stat icon={Flame} label="Rangkaian belajar" value={`${data?.stats?.current_streak ?? 0} hari`} /><Stat icon={Target} label="Target JLPT" value={level} /></div>
      <div className="grid grid-cols-2 gap-2.5"><Button asChild className="h-10 rounded-xl text-xs"><Link to="/belajar">Mulai belajar<ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" className="h-10 rounded-xl text-xs"><Link to="/quiz">Latihan soal</Link></Button></div>
    </div>}
  </AppShell>;
}

function TargetCard({ icon, label, value }: { icon: string; label: string; value: number }) { return <Card className="rounded-2xl border-border/60 shadow-none"><CardContent className="flex flex-col items-center justify-center gap-1 p-3 text-center"><span lang="ja" className="font-jp text-lg font-medium text-primary">{icon}</span><p className="text-lg font-semibold leading-none">{value}</p><p className="text-[10px] text-muted-foreground">{label}/hari</p></CardContent></Card>; }
function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) { return <Card className="rounded-2xl border-border/60 shadow-none"><CardContent className="flex items-center gap-3 p-4"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></CardContent></Card>; }
