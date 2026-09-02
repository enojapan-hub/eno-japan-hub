import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Flame, Target } from "lucide-react";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — enonihongo" }, { name: "description", content: "Ringkasan target harian dan progres belajar di enonihongo." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? (rawLevel as Level) : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const name = data?.profile?.display_name ?? "";

  return <AppShell title={isLoading ? "Beranda" : name ? `Konnichiwa, ${name}` : "Selamat belajar"} description={`Target ${level} · belajar sedikit setiap hari`}>
    {isLoading ? <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div> : isError ? <Card className="shadow-none"><CardHeader><CardTitle>Data belum bisa dimuat</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button onClick={() => refetch()}>Coba lagi</Button></CardContent></Card> : <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3"><TargetCard icon="漢字" label="Kanji" value={data?.settings?.daily_kanji_target ?? 5} /><TargetCard icon="言葉" label="Kotoba" value={data?.settings?.daily_vocab_target ?? 10} /><TargetCard icon="文法" label="Bunpō" value={data?.settings?.daily_grammar_target ?? 5} /></div>
      <Card className="overflow-hidden shadow-none"><CardHeader className="border-b bg-muted/20"><div className="flex items-center justify-between gap-3"><div><CardTitle>Belajar hari ini</CardTitle><CardDescription>{daily.isLoading ? "Menyiapkan materi…" : `${daily.data?.completed ?? 0}/${daily.data?.target ?? 5} selesai`}</CardDescription></div><Badge variant="secondary">{level}</Badge></div></CardHeader><CardContent className="space-y-1 p-3">{daily.error ? <p className="p-3 text-sm text-destructive">Gagal memuat target harian.</p> : daily.data?.items.map(item => { const path = item.type === "kanji" ? "/kanji/$id" : item.type === "vocabulary" ? "/kotoba/$id" : "/bunpo/$id"; return <Link key={`${item.type}:${item.id}`} to={path as never} params={{ id: item.id } as never} className="flex items-center justify-between gap-3 rounded-xl p-3 hover:bg-muted"><div><div className="font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.reading ? `${item.reading} · ` : ""}{item.meaning}</div></div><ArrowRight className="size-4 shrink-0 text-muted-foreground" /></Link>; })}{!daily.isLoading && !daily.data?.items.length && <p className="p-3 text-sm text-muted-foreground">Belum ada materi terbit untuk level ini.</p>}</CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2"><Stat icon={Flame} label="Streak" value={`${data?.stats?.current_streak ?? 0} hari`} /><Stat icon={Target} label="Target JLPT" value={level} /></div>
      <div className="flex flex-wrap gap-2"><Button asChild><Link to="/belajar">Mulai belajar<ArrowRight /></Link></Button><Button asChild variant="outline"><Link to="/quiz">Latihan quiz</Link></Button><Button asChild variant="outline"><Link to="/progress">Lihat progress</Link></Button></div>
    </div>}
  </AppShell>;
}

function TargetCard({ icon, label, value }: { icon: string; label: string; value: number }) { return <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><span lang="ja" className="font-jp text-2xl text-primary">{icon}</span><div><p className="text-xl font-semibold leading-none">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label} / hari</p></div></CardContent></Card>; }
function Stat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) { return <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="size-5" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div></CardContent></Card>; }
