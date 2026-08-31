import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchDailyPlan } from "@/lib/daily-plan";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEVELS, type Level } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Beranda Belajar — ENO JAPAN" },
    { name: "description", content: "Ringkasan target harian dan progres belajar kamu." },
    { property: "og:title", content: "Beranda Belajar — ENO JAPAN" },
    { property: "og:description", content: "Target harian kanji, kotoba, dan bunpo." },
  ] }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["my-account"], queryFn: () => fetchAccount() });
  const rawLevel = data?.profile?.target_level;
  const level: Level = LEVELS.includes(rawLevel as Level) ? (rawLevel as Level) : "N5";
  const daily = useQuery({ queryKey: ["daily-plan", level], queryFn: () => fetchDailyPlan(level), enabled: !isLoading && !isError });
  const name = data?.profile?.display_name ?? "Belajar";

  return (
    <AppShell title={isLoading ? "Beranda" : `Konnichiwa, ${name}`} description="Target harian kamu tersimpan di akun dan berlaku di semua perangkat.">
      {isLoading ? <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div> : isError ? <Card className="border-destructive/40"><CardHeader><CardTitle>Gagal memuat data</CardTitle><CardDescription>{(error as Error).message}</CardDescription></CardHeader><CardContent><Button variant="outline" onClick={() => refetch()}>Coba lagi</Button></CardContent></Card> : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3"><TargetCard jp="漢字" label="Kanji" value={data?.settings?.daily_kanji_target ?? 5} /><TargetCard jp="言葉" label="Kotoba" value={data?.settings?.daily_vocab_target ?? 10} /><TargetCard jp="文法" label="Bunpo" value={data?.settings?.daily_grammar_target ?? 5} /></div>
          <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>Daily 5</CardTitle><CardDescription>{daily.isLoading ? "Menyiapkan materi hari ini…" : `${daily.data?.completed ?? 0}/${daily.data?.target ?? 5} selesai · ${level}`}</CardDescription></div><Badge variant="secondary">Hari ini</Badge></div></CardHeader>
            <CardContent className="space-y-2">{daily.error ? <p className="text-sm text-destructive">Gagal memuat target harian.</p> : daily.data?.items.map((item) => { const path = item.type === "kanji" ? "/kanji/$id" : item.type === "vocabulary" ? "/kotoba/$id" : "/bunpo/$id"; return <Link key={`${item.type}:${item.id}`} to={path as never} params={{ id: item.id }} className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-muted"><div><div className="font-medium">{item.label}</div><div className="text-xs text-muted-foreground">{item.reading ? `${item.reading} · ` : ""}{item.meaning}</div></div><Badge variant="outline">{item.type === "vocabulary" ? "Kotoba" : item.type === "grammar" ? "Bunpō" : "Kanji"}</Badge></Link>; })}{!daily.isLoading && !daily.data?.items.length && <p className="text-sm text-muted-foreground">Belum ada materi terbit untuk level ini.</p>}</CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Level target: {level}</CardTitle><CardDescription>Materi ENO JAPAN dirancang untuk jalur JLPT N5–N1.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link to="/profil">Atur target &amp; profil</Link></Button></CardContent></Card>
        </div>
      )}
    </AppShell>
  );
}

function TargetCard({ jp, label, value }: { jp: string; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-4 py-6"><span lang="ja" className="font-jp text-3xl leading-none text-primary">{jp}</span><div><p className="text-2xl font-semibold leading-none">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label} / hari</p></div></CardContent></Card>; }
