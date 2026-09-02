import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, GraduationCap, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "enonihongo — Belajar Bahasa Jepang & Persiapan JLPT N5–N1" },
      { name: "description", content: "Belajar kanji, kotoba, bunpo, reading, listening, dan latihan JLPT N5–N1 dengan alur belajar yang sederhana." },
      { property: "og:title", content: "enonihongo — Belajar Bahasa Jepang & Persiapan JLPT" },
      { property: "og:description", content: "Platform belajar Jepang N5–N1 untuk belajar, berlatih, dan mengukur progress." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <BrandMark />
        {loading ? <span className="h-9 w-24" aria-hidden /> : user ? (
          <Button asChild size="sm"><Link to="/dashboard">Buka aplikasi</Link></Button>
        ) : (
          <Button asChild size="sm" variant="outline"><Link to="/auth">Masuk</Link></Button>
        )}
      </header>

      <main>
        <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-20">
          <p className="text-sm font-medium text-primary">JLPT N5 – N1</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-6xl">Belajar bahasa Jepang dengan tenang, konsisten, dan terukur.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">enonihongo membantu kamu membangun kebiasaan belajar melalui kanji, kotoba, bunpo, reading, listening, quiz, dan latihan JLPT.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to={user ? "/dashboard" : "/auth"}>{user ? "Lanjut belajar" : "Mulai gratis"}<ArrowRight aria-hidden className="ml-1 size-4" /></Link></Button>
          </div>

          <div aria-hidden className="mt-14 rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
            <span lang="ja" className="jp-display block text-foreground">勉強</span>
            <span className="mt-3 block text-sm text-muted-foreground">benkyou — belajar</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 pb-20 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight">Satu tempat untuk belajar</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Feature icon={BookOpen} title="Materi N5–N1" description="Kanji, kotoba, bunpo, reading, dan listening dalam satu alur belajar." />
            <Feature icon={Repeat} title="Review terjadwal" description="Ulangi materi yang perlu diperkuat agar hafalan tidak cepat hilang." />
            <Feature icon={GraduationCap} title="Simulasi JLPT" description="Latihan berformat ujian dengan waktu, skor, dan analisis kemampuan." />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} enonihongo</span>
          <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">Masuk / Daftar</Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof BookOpen; title: string; description: string }) {
  return <Card className="border-border/80 shadow-none transition-shadow hover:shadow-sm"><CardHeader><Icon aria-hidden className="size-5 text-primary" /><CardTitle className="mt-2 text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent /></Card>;
}
