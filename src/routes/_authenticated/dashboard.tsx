import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";

import { getMyAccount } from "@/lib/profile.functions";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Beranda Belajar — ENO JAPAN" },
      { name: "description", content: "Ringkasan target harian dan progres belajar kamu." },
      { property: "og:title", content: "Beranda Belajar — ENO JAPAN" },
      { property: "og:description", content: "Target harian kanji, kotoba, dan bunpo." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => fetchAccount(),
  });

  const name = data?.profile?.display_name ?? "Belajar";

  return (
    <AppShell
      title={isLoading ? "Beranda" : `Konnichiwa, ${name}`}
      description="Target harian kamu tersimpan di akun dan berlaku di semua perangkat."
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Gagal memuat data</CardTitle>
            <CardDescription>{(error as Error).message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <TargetCard
              jp="漢字"
              label="Kanji"
              value={data?.settings?.daily_kanji_target ?? 5}
            />
            <TargetCard
              jp="言葉"
              label="Kotoba"
              value={data?.settings?.daily_vocab_target ?? 10}
            />
            <TargetCard
              jp="文法"
              label="Bunpo"
              value={data?.settings?.daily_grammar_target ?? 5}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Level target: {data?.profile?.target_level ?? "N5"}</CardTitle>
                <CardDescription>
                  Semua level N5–N1 terbuka untuk akun gratis. Premium nanti menambah
                  personalisasi, AI, dan analitik.
                </CardDescription>
              </div>
              <Badge variant="secondary">Gratis</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/profil">Atur target &amp; profil</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Materi belajar sedang disiapkan</CardTitle>
              <CardDescription>
                Fase berikutnya menambahkan konten kanji, kotoba, bunpo, kuis, review terjadwal,
                dan simulasi JLPT. Tidak ada angka progres palsu yang ditampilkan di sini.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function TargetCard({ jp, label, value }: { jp: string; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-6">
        <span lang="ja" className="font-jp text-3xl leading-none text-primary">
          {jp}
        </span>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label} / hari</p>
        </div>
      </CardContent>
    </Card>
  );
}
