import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Flame, Medal, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCompetitionLeaderboard } from "@/lib/leaderboard";
import { getLeague, LEAGUES } from "@/lib/progression";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — ENO NIHONGO" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const leaderboard = useQuery({ queryKey: ["competition-leaderboard", period], queryFn: () => fetchCompetitionLeaderboard(period, 50), staleTime: 30_000 });
  const me = useQuery({ queryKey: ["auth-user-id"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null, staleTime: 60_000 });
  const myRow = leaderboard.data?.find((u) => u.userId === me.data);
  const myWeekly = period === "weekly" ? myRow?.periodXp ?? 0 : 0;
  const myLeague = getLeague(myWeekly);

  return (
    <AppShell compact title="Leaderboard">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Kompetisi Sehat</p>
            <h1 className="mt-1 text-[20px] font-bold tracking-tight">Leaderboard</h1>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-muted-foreground">Ranking periode memakai XP yang benar-benar diperoleh pada periode tersebut.</p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600"><Trophy className="size-5" /></span>
        </section>

        <div className="grid grid-cols-2 rounded-xl bg-muted/50 p-1">
          <button onClick={() => setPeriod("weekly")} className={`h-9 rounded-lg text-[11px] font-semibold ${period === "weekly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Mingguan</button>
          <button onClick={() => setPeriod("monthly")} className={`h-9 rounded-lg text-[11px] font-semibold ${period === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Bulanan</button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-2">
            {leaderboard.isLoading ? <div className="space-y-2 p-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : leaderboard.data?.length ? leaderboard.data.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/40">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-bold">{user.rank <= 3 ? <Medal className={user.rank === 1 ? "size-4 text-amber-500" : user.rank === 2 ? "size-4 text-slate-400" : "size-4 text-orange-600"} /> : user.rank}</span>
                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-8 rounded-full border object-cover" /> : null}
                <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{user.displayName}</p><p className="text-[9px] text-muted-foreground">{user.jlptLevel} · Streak {user.streak} hari</p></div>
                <span className="text-[11px] font-bold">{user.periodXp.toLocaleString("id-ID")} XP</span>
              </div>
            )) : <p className="py-8 text-center text-[11px] text-muted-foreground">Belum ada aktivitas pada periode ini.</p>}
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-semibold">Liga Mingguan</h2>
          <Card className="rounded-2xl"><CardContent className="p-4">
            <div className="flex items-center justify-between gap-2 text-center">{LEAGUES.map((league, index) => <div key={league.name} className="min-w-0 flex-1"><span className={myLeague.index === index ? "mx-auto grid size-8 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground" : "mx-auto grid size-8 place-items-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground"}>{index + 1}</span><p className="mt-1 truncate text-[8px] font-medium">{league.name}</p><p className="text-[7px] text-muted-foreground">{league.minWeeklyXp.toLocaleString("id-ID")}+</p></div>)}</div>
            <div className="mt-4 rounded-xl bg-primary/[0.05] p-3">
              <div className="flex items-center justify-between"><div><p className="text-[11px] font-bold">Liga kamu: {myLeague.name}</p><p className="mt-0.5 text-[9px] text-muted-foreground">Reset setiap Senin 00:00 JST.</p></div><Crown className="size-5 text-amber-500" /></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${myLeague.progress}%` }} /></div>
              <p className="mt-1.5 text-[9px] text-muted-foreground">{myLeague.next ? `${myLeague.xpToNext.toLocaleString("id-ID")} XP lagi ke ${myLeague.next.name}` : "Liga tertinggi tercapai."}</p>
            </div>
            <div className="mt-3 space-y-1 text-[9px] leading-4 text-muted-foreground">
              <p>• Bronze: 0–499 XP/minggu · Silver: 500–999 · Gold: 1.000–1.999.</p>
              <p>• Platinum: 2.000–3.499 · Diamond: 3.500+ XP/minggu.</p>
              <p>• Liga tidak memengaruhi nilai ujian atau membuka jawaban. Fungsinya hanya kompetisi, badge, dan kosmetik.</p>
            </div>
          </CardContent></Card>
        </section>

        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/[0.04]"><CardContent className="flex gap-3 p-4"><Flame className="mt-0.5 size-4 shrink-0 text-orange-500" /><p className="text-[10px] leading-5 text-muted-foreground">Poin hadiah tidak menentukan liga. Liga memakai XP mingguan agar aktivitas belajar tetap menjadi dasar ranking.</p></CardContent></Card>
      </div>
    </AppShell>
  );
}
