import { useEffect, useMemo } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Cherry, CircleDot, Fish, Flower2, GraduationCap, Landmark, Languages, Mountain, Sun, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "enonihongo" },
    { name: "description", content: "Belajar bahasa Jepang bersama enonihongo." },
  ]}),
  component: WelcomePage,
});

const japanIcons = [
  { Icon: Mountain, label: "Fuji" },
  { Icon: Landmark, label: "Torii" },
  { Icon: Cherry, label: "Sakura" },
  { Icon: Languages, label: "Bahasa Jepang" },
  { Icon: BookOpen, label: "Belajar" },
  { Icon: GraduationCap, label: "JLPT" },
  { Icon: Waves, label: "Jepang" },
  { Icon: Sun, label: "Nihon" },
  { Icon: Flower2, label: "Sakura" },
  { Icon: Fish, label: "Jepang" },
  { Icon: CircleDot, label: "Hinomaru" },
];

const positions = [
  "left-[10%] top-[20px]", "left-[39%] top-[82px]", "right-[5%] top-[18px]",
  "left-[2%] top-[160px]", "left-[48%] top-[205px]", "right-[0%] top-[176px]",
  "right-[4%] top-[270px]", "left-[7%] top-[310px]", "left-[42%] top-[330px]"
];
const sizes = [72, 100, 68, 84, 96, 46, 42, 60, 52];
const surfaces = ["bg-[#f5efe7]", "bg-[#e8eef2]", "bg-[#f3e4e8]", "bg-[#e9eee7]", "bg-[#f4e9d8]"];

function WelcomePage() {
  const { user, loading } = useAuth();
  const icons = useMemo(() => {
    const shuffled = [...japanIcons].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, positions.length);
  }, []);

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#050505";
    return () => { document.documentElement.style.backgroundColor = ""; };
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return <main className="min-h-screen bg-black flex items-center justify-center p-0 sm:p-4">
    <div className="relative flex h-[800px] w-full max-w-[400px] flex-col justify-between overflow-hidden rounded-none sm:rounded-[32px] bg-[#050505] px-6 py-10 text-white shadow-2xl">
      <div className="relative h-[480px] w-full" aria-label="Ikon Jepang enonihongo">
        {icons.map(({ Icon, label }, index) => (
          <div
            key={`${label}-${index}`}
            className={`absolute flex items-center justify-center overflow-hidden shadow-lg transition-transform duration-300 hover:scale-110 ${index === 1 || index === 4 ? "rounded-full" : "rounded-[24px]"} ${positions[index]} ${surfaces[index % surfaces.length]}`}
            style={{ width: sizes[index], height: sizes[index] }}
            title={label}
          >
            <Icon className={`${index === 1 || index === 4 ? "size-10" : "size-9"} text-zinc-900`} strokeWidth={1.8} aria-hidden />
          </div>
        ))}
      </div>

      <div>
        <div className="mb-5 text-center">
          <h1 className="mb-3 text-[28px] font-bold leading-tight tracking-[-0.5px]">enonihongo</h1>
          <p className="px-2 text-sm leading-[1.6] text-zinc-400">Belajar bahasa Jepang lebih mudah, terarah, dan menyenangkan. Bergabung dengan komunitas enonihongo dan persiapkan dirimu untuk JLPT N5–N1.</p>
        </div>
        <Button asChild className="flex h-[60px] w-full items-center rounded-full bg-[#e5484d] p-1 text-white hover:bg-[#c9363b]">
          <Link to="/auth" className="flex w-full items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-[#e5484d]"><ArrowRight className="size-5" aria-hidden /></span>
            <span className="flex-1 text-center text-lg font-semibold -ml-12">Mulai Belajar</span>
          </Link>
        </Button>
      </div>
    </div>
  </main>;
}
