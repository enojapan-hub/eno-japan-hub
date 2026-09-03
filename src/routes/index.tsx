import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, Signal, Wifi, BatteryFull, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENO JAPAN — Belajar Bahasa Jepang" },
      { name: "description", content: "Belajar bahasa Jepang dan persiapan JLPT N5–N1 bersama ENO JAPAN." },
      { property: "og:title", content: "ENO JAPAN — Belajar Bahasa Jepang" },
      { property: "og:description", content: "Belajar bahasa Jepang dengan alur yang sederhana, konsisten, dan terukur." },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="relative flex h-[740px] w-full max-w-[360px] flex-col justify-between overflow-hidden rounded-[40px] border-4 border-gray-200 bg-white shadow-2xl">
        <div className="z-10 flex items-center justify-between px-6 pt-3 text-xs font-semibold text-black">
          <span>12:30</span>
          <div className="h-5 w-24 rounded-full bg-black" aria-hidden />
          <div className="flex items-center gap-1" aria-hidden>
            <Signal className="size-3.5" strokeWidth={2.5} />
            <Wifi className="size-3.5" strokeWidth={2.5} />
            <BatteryFull className="size-4" strokeWidth={2.5} />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-5 pt-4">
          <img
            src="https://img.freepik.com/free-vector/hand-drawn-camping-adventure-illustration_23-2149157218.jpg"
            alt="Ilustrasi perjalanan belajar"
            className="h-64 w-64 object-contain"
          />
        </div>

        <div className="absolute left-1/2 top-[48%] z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-white bg-black shadow-lg">
            <Sparkles className="size-7 text-white" fill="currentColor" strokeWidth={1.5} aria-hidden />
          </div>
        </div>

        <section className="relative z-10 flex flex-col items-center rounded-t-[40px] bg-[#FF6584] px-8 pb-8 pt-12 text-center text-white">
          <span className="mb-4 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-medium backdrop-blur-sm">
            ENO JAPAN
          </span>

          <h1 className="mb-3 max-w-[250px] text-2xl font-extrabold leading-snug">
            Ready to Learn Japanese?
          </h1>
          <p className="mb-7 max-w-[245px] text-sm leading-5 text-white/90">
            Belajar kanji, kotoba, bunpo, reading, dan listening untuk JLPT N5–N1.
          </p>

          <Button
            asChild
            className="size-12 rounded-2xl bg-white p-0 text-gray-700 shadow-md hover:bg-gray-50 active:scale-95"
            aria-label="Mulai belajar"
          >
            <Link to="/auth">
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>

          <div className="mt-8 h-1 w-32 rounded-full bg-black" aria-hidden />
        </section>
      </div>
    </main>
  );
}
