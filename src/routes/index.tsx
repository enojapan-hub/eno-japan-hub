import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, GraduationCap, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENO JAPAN — Belajar Bahasa Jepang & Persiapan JLPT N5–N1" },
      {
        name: "description",
        content:
          "Belajar kanji, kotoba, dan bunpo dengan target harian, review terjadwal, dan simulasi JLPT N5–N1. Akun gratis tetap berguna.",
      },
      { property: "og:title", content: "ENO JAPAN — Belajar Bahasa Jepang & Persiapan JLPT" },
      {
        property: "og:description",
        content: "Fondasi belajar Jepang N5–N1: kanji, kotoba, bunpo, kuis, dan simulasi JLPT.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <BrandMark />
        {loading ? (
          <span className="h-9 w-24" aria-hidden />
        ) : user ? (
          <Button asChild size="sm">
            <Link to="/dashboard">Buka aplikasi</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Masuk</Link>
          </Button>
        )}
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-4 pb-14 pt-8 sm:pt-16">
          <p className="text-sm font-medium text-primary">JLPT N5 – N1</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Belajar bahasa Jepang dengan tenang, konsisten, dan terukur
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            ENO JAPAN membangun kebiasaan belajar harian: kanji, kotoba, dan bunpo dalam porsi
            kecil, review terjadwal, lalu simulasi JLPT saat kamu siap.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Lanjut belajar" : "Mulai gratis"}
                <ArrowRight aria-hidden className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          <div
            aria-hidden
            className="mt-12 rounded-2xl border border-border/70 bg-card p-8 text-center"
          >
            <span lang="ja" className="jp-display block text-foreground">
              勉強
            </span>
            <span className="mt-3 block text-sm text-muted-foreground">
              benkyou — belajar
            </span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-16">
          <h2 className="text-xl font-semibold tracking-tight">Yang kamu dapat</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Feature
              icon={BookOpen}
              title="Materi N5–N1 untuk semua"
              description="Akun gratis mendapat akses lintas level, bukan hanya materi paling dasar."
            />
            <Feature
              icon={Repeat}
              title="Review terjadwal"
              description="Pengulangan berjarak agar hafalan kanji dan kosakata benar-benar menempel."
            />
            <Feature
              icon={GraduationCap}
              title="Simulasi JLPT"
              description="Latihan berformat ujian dengan waktu dan skoring untuk mengukur kesiapan."
            />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Materi ENO JAPAN ditulis original dan sedang dikembangkan bertahap; belum mengklaim
            cakupan JLPT lengkap.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} ENO JAPAN</span>
          <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">
            Masuk / Daftar
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <Icon aria-hidden className="size-5 text-primary" />
        <CardTitle className="mt-2 text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
