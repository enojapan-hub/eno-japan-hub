import { useEffect, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getPublicMembers } from "@/lib/public-members.functions";

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

type Member = { id: string; name: string; avatar_url: string };

function WelcomePage() {
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let active = true;
    getPublicMembers().then((data) => {
      if (active) setMembers(data as Member[]);
    }).catch(() => {
      if (active) setMembers([]);
    });
    return () => { active = false; };
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const positions = [
    "left-[10%] top-[20px]", "left-[39%] top-[82px]", "right-[5%] top-[18px]",
    "left-[2%] top-[160px]", "left-[48%] top-[205px]", "right-[0%] top-[176px]",
    "right-[4%] top-[270px]", "left-[7%] top-[310px]",
  ];
  const sizes = [72, 100, 68, 84, 96, 46, 42, 60];

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-0 sm:p-4">
      <div className="relative flex h-[800px] w-full max-w-[400px] flex-col justify-between overflow-hidden rounded-none sm:rounded-[32px] bg-[#050505] px-6 py-10 text-white shadow-2xl">
        <div className="relative h-[480px] w-full" aria-label="Member ENO JAPAN">
          {members.slice(0, 8).map((member, index) => (
            <div
              key={member.id}
              className={`absolute overflow-hidden shadow-lg transition-transform duration-300 hover:scale-110 ${index === 1 || index === 4 ? "rounded-full" : "rounded-[24px]"} ${positions[index]}`}
              style={{ width: sizes[index], height: sizes[index] }}
              title={member.name}
            >
              <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" loading="eager" referrerPolicy="no-referrer" />
            </div>
          ))}

          {members.length > 0 && (
            <div className="absolute bottom-[92px] left-[31%] flex h-[65px] w-[65px] items-center justify-center rounded-[24px] bg-white font-bold text-black shadow-lg">
              {members.length < 9 ? `${members.length}+` : "9+"}
            </div>
          )}
        </div>

        <div>
          <div className="mb-5 text-center">
            <h1 className="mb-3 text-[28px] font-bold leading-tight tracking-[-0.5px]">Belajar Bahasa Jepang<br />Bersama ENO JAPAN</h1>
            <p className="px-2 text-sm leading-[1.5] text-zinc-400">Bergabung dengan member lain dan belajar kanji, kotoba, bunpou, reading, dan listening untuk JLPT N5–N1.</p>
          </div>

          <Button asChild className="flex h-[60px] w-full items-center rounded-full bg-[#3b82f6] p-1 text-white hover:bg-[#2563eb]">
            <Link to="/auth" className="flex w-full items-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-black"><ArrowRight className="size-5" aria-hidden /></span>
              <span className="flex-1 text-center text-lg font-semibold -ml-12">Mulai Belajar</span>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
