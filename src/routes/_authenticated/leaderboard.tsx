import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Flame, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLeaderboard } from "@/lib/leaderboard";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — ENO NIHONGO" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const leaderboard = useQuery({ queryKey: ["leaderboard", 50], queryFn: () => fetchLeaderboard(50), staleTime: 60_000 });

  return (
    <AppShell compact title="Leaderboard">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Kompetisi Sehat</p>
            <h1 className="mt-1 text-[20px] font-bold tracking-tight">Leaderboard</h1>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-muted-foreground">Peringkat dibuat untuk menjaga konsistensi belajar, bukan sekadar mengejar angka.</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600"><Trophy className="size-5" /></span>
        </section>

        <div className="grid grid-cols-3 gap-2">
          <Card className="rounded-2xl border-primary/20 bg-primary/[0.03]"><CardContent className="p-3 text-center"><Trophy className="mx-auto size-4 text-primary" /><p className="mt-1 text-[11px] font-semibold">Mingguan</p><p className="text-[9px] text-muted-foreground">XP 7 hari</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-3 text-center"><Crown className="mx-auto size-4 text-amber-500" /><p className="mt-1 text-[11px] font-semibold">Bulanan</p><p className="text-[9px] text-muted-foreground">Reset tiap bulan</p></CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-3 text-center"><Flame className="mx-auto size-4 text-orange-500" /><p className="mt-1 text-[11px] font-semibold">Streak</p><p className="text-[9px] text-muted-foreground">Konsistensi</p></CardContent></Card>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-2">
            {leaderboard.isLoading ? <div className="space-y-2 p-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : leaderboard.data?.length ? leaderboard.data.map((user, index) => (
              <div key={user.userId} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-bold">{index < 3 ? <Medal className={index === 0 ? "size-4 text-amber-500" : index === 1 ? "size-4 text-slate-400" : "size-4 text-orange-600"} /> : index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{user.displayName}</p><p className="text-[9px] text-muted-foreground">Pembelajar ENO NIHONGO</p></div>
                <span className="text-[11px] font-bold">{user.xp.toLocaleString("id-ID")} XP</span>
              </div>
            )) : <p className="py-8 text-center text-[11px] text-muted-foreground">Peringkat belum tersedia.</p>}
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold">Liga</h2>
          <Card className="rounded-2xl"><CardContent className="p-4"><div className="flex items-center justify-between gap-2 text-center">{["Bronze", "Silver", "Gold", "Platinum", "Diamond"].map((league, index) => <div key={league} className="min-w-0 flex-1"><span className={index === 0 ? "mx-auto grid size-7 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground" : "mx-auto grid size-7 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground"}>{index + 1}</span><p className="mt-1 truncate text-[8px] text-muted-foreground">{league}</p></div>)}</div><p className="mt-3 text-[10px] leading-4 text-muted-foreground">Naik liga lewat konsistensi. Reward hanya berupa XP, Points, badge, achievement, dan kosmetik profil.</p></CardContent></Card>
        </section>
      </div>
    </AppShell>
  );
}
