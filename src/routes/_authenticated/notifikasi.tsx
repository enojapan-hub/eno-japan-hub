import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight, Gift, Info, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/notifikasi")({ component: NotificationsPage });

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  kind: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
};

async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("user_notifications" as never)
    .select("id,title,body,kind,action_url,read_at,created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as NotificationRow[];
}

function iconFor(kind: string) {
  if (kind === "reward") return Gift;
  if (kind === "target") return Target;
  return Info;
}

function NotificationsPage() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, staleTime: 10_000 });
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_notifications" as never).update({ read_at: new Date().toISOString() } as never).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { error } = await supabase.from("user_notifications" as never).update({ read_at: new Date().toISOString() } as never).eq("user_id", auth.user.id).is("read_at", null);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const rows = query.data ?? [];
  const unread = rows.filter(n => !n.read_at).length;

  return <AppShell title="Pemberitahuan" backTo="/dashboard" backLabel="Home" compact>
    <div className="mx-auto max-w-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-[20px] font-bold">Pemberitahuan</h1><p className="mt-0.5 text-[10px] text-muted-foreground">{unread} belum dibaca</p></div>
        {unread > 0 && <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px]" onClick={() => markAll.mutate()} disabled={markAll.isPending}><CheckCheck className="mr-1.5 size-3.5"/>Tandai semua dibaca</Button>}
      </div>

      {query.isLoading ? <p className="py-10 text-center text-xs text-muted-foreground">Memuat pemberitahuan…</p> : query.isError ? <Card><CardContent className="py-8 text-center text-xs text-destructive">Pemberitahuan gagal dimuat.</CardContent></Card> : rows.length === 0 ? <Card><CardContent className="py-10 text-center"><Bell className="mx-auto size-6 text-muted-foreground"/><p className="mt-2 text-xs text-muted-foreground">Belum ada pemberitahuan.</p></CardContent></Card> : <div className="space-y-2">
        {rows.map(row => {
          const Icon = iconFor(row.kind);
          const content = <div className={`flex items-start gap-3 rounded-2xl border p-3 transition ${row.read_at ? "bg-card" : "border-primary/20 bg-primary/[0.035]"}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${row.read_at ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><Icon className="size-4"/></span>
            <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-[12px] font-semibold">{row.title}</p>{!row.read_at && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary"/>}</div><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{row.body}</p><p className="mt-1.5 text-[9px] text-muted-foreground">{new Date(row.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</p></div>
            {row.action_url && <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground"/>}
          </div>;
          return row.action_url ? <Link key={row.id} to={row.action_url as "/dashboard"} onClick={() => { if (!row.read_at) markRead.mutate(row.id); }}>{content}</Link> : <button key={row.id} type="button" className="w-full text-left" onClick={() => { if (!row.read_at) markRead.mutate(row.id); }}>{content}</button>;
        })}
      </div>}
    </div>
  </AppShell>;
}
