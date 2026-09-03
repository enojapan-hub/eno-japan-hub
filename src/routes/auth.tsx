import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight, BookOpen, Trophy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "enonihongo — Belajar Bahasa Jepang" },
    { name: "description", content: "Belajar bahasa Jepang dengan cara yang lebih terarah. Kuasai Kanji, Kotoba, Bunpou, Dokkai, Choukai, dan persiapkan JLPT N5–N1 bersama enonihongo." },
    { property: "og:title", content: "enonihongo — Belajar Bahasa Jepang" },
    { property: "og:description", content: "Mulai perjalanan bahasa Jepangmu bersama enonihongo dan capai target JLPT-mu." },
  ] }),
  component: AuthPage,
});

type AuthMode = "login" | "signup";
function getAuthRedirectUrl() { return typeof window !== "undefined" ? `${window.location.origin}/onboarding` : "/onboarding"; }

async function continueAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  const completed = data.user?.user_metadata?.["onboarding_completed"] === true;
  navigate({ to: completed ? "/dashboard" : "/onboarding", replace: true });
}

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) return;
      if (error) { setError(error.message); setChecking(false); return; }
      if (data.session) {
        try { await continueAfterAuth(navigate); }
        catch (caught) { if (active) { setError(caught instanceof Error ? caught.message : "Sesi tidak dapat diverifikasi."); setChecking(false); } }
      } else setChecking(false);
    });
    return () => { active = false; };
  }, [navigate]);

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) { setError("Masukkan email yang valid."); return; }
    if (password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: getAuthRedirectUrl() } });
        if (signUpError) throw signUpError;
        if (data.session) await continueAfterAuth(navigate);
        else { toast.success("Pendaftaran berhasil. Periksa email untuk verifikasi akun."); setMode("login"); }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signInError) throw signInError;
        await continueAfterAuth(navigate);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Autentikasi gagal.";
      setError(message);
      toast.error(message);
    } finally { setLoading(false); }
  }

  async function signInWithGoogle() {
    if (loading) return;
    setError(null); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthRedirectUrl() } });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal masuk dengan Google.";
      setError(message); toast.error(message); setLoading(false);
    }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#f7f7f4]"><Loader2 aria-label="Memuat" className="size-5 animate-spin text-[#1f6f4a]" /></div>;
  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-0 py-0 sm:px-5 sm:py-4">
      <section className="relative flex min-h-0 w-full max-w-[390px] flex-col overflow-hidden bg-white shadow-xl shadow-[#1f6f4a]/15 sm:min-h-[720px] sm:rounded-[34px]">
        {!showAuth ? (
          <div className="flex min-h-screen flex-col px-6 pb-7 pt-12 sm:min-h-[720px] sm:px-7 sm:pt-14">
            <header className="text-center">
              <Link to="/" aria-label="enonihongo" className="inline-flex flex-col items-center gap-2">
                <BrandMark size="md" />
                <span className="text-[28px] font-black tracking-[-0.06em] text-[#1f6f4a]">enonihongo</span>
              </Link>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-5 grid size-20 place-items-center rounded-[26px] bg-[#eef5f0] text-[#1f6f4a] shadow-sm">
                <BookOpen className="size-9" strokeWidth={1.7} />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1f6f4a]">Your Japanese Journey Starts Here</p>
              <h1 className="mt-3 max-w-[330px] text-[30px] font-black leading-[1.08] tracking-[-0.045em] text-[#263b31]">
                Belajar bahasa Jepang,<br />lebih terarah dan menyenangkan.
              </h1>
              <p className="mt-4 max-w-[310px] text-[13px] leading-5 text-[#63756d]">
                Bangun kemampuanmu dari N5 sampai N1. Pelajari Kanji, Kotoba, Bunpou, Dokkai, dan Choukai sambil melihat progresmu setiap hari.
              </p>

              <div className="mt-7 grid w-full max-w-[320px] grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[#f5f8f6] px-2 py-3"><Sparkles className="mx-auto size-4 text-[#1f6f4a]" /><p className="mt-1.5 text-[10px] font-semibold text-[#30483c]">Belajar</p></div>
                <div className="rounded-2xl bg-[#f5f8f6] px-2 py-3"><BookOpen className="mx-auto size-4 text-[#1f6f4a]" /><p className="mt-1.5 text-[10px] font-semibold text-[#30483c]">Latihan</p></div>
                <div className="rounded-2xl bg-[#f5f8f6] px-2 py-3"><Trophy className="mx-auto size-4 text-[#1f6f4a]" /><p className="mt-1.5 text-[10px] font-semibold text-[#30483c]">JLPT</p></div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Button type="button" onClick={() => { setMode("signup"); setShowAuth(true); }} className="h-12 w-full rounded-full bg-[#1f6f4a] text-sm font-bold text-white shadow-lg shadow-[#1f6f4a]/20 hover:bg-[#164c35]">
                Mulai belajar gratis <ArrowRight className="ml-1 size-4" />
              </Button>
              <Button type="button" variant="outline" onClick={() => { setMode("login"); setShowAuth(true); }} className="h-12 w-full rounded-full border-[#dce8e2] bg-white text-sm font-semibold text-[#30483c] hover:bg-[#f1f7f3]">
                Saya sudah punya akun
              </Button>
              <p className="pt-1 text-center text-[9px] leading-4 text-[#a0afa9]">© {new Date().getFullYear()} enonihongo · Belajar Jepang bersama-sama</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen flex-col bg-white px-5 pb-4 pt-7 sm:min-h-[720px] sm:px-6">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={() => { setShowAuth(false); setError(null); }} className="text-[11px] font-semibold text-[#63756d]">← Kembali</button>
              <Link to="/" aria-label="enonihongo" className="flex items-center gap-2"><BrandMark size="sm" /><span className="text-base font-black tracking-[-0.05em] text-[#1f6f4a]">enonihongo</span></Link>
              <span className="w-12" />
            </div>
            <div className="flex flex-1 flex-col">
              <div className="mb-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1f6f4a]">{isLogin ? "Selamat datang kembali" : "Buat akun gratis"}</p><h2 className="mt-1 text-[1.25rem] font-bold leading-tight tracking-tight text-[#263b31]">{isLogin ? "Masuk ke akunmu" : "Mulai perjalananmu"}</h2><p className="mt-1 text-[11px] leading-4 text-[#63756d]">{isLogin ? "Lanjutkan belajar bahasa Jepang dan capai target JLPT-mu." : "Simpan progres dan bangun kebiasaan belajar Jepang setiap hari."}</p></div>
              <div className="mb-3 grid grid-cols-2 rounded-lg bg-[#eef5f0] p-0.5"><button type="button" onClick={() => setMode("login")} className={`h-9 rounded-md text-xs font-semibold ${isLogin ? "bg-white text-[#24704d] shadow-sm" : "text-[#718078]"}`}>Masuk</button><button type="button" onClick={() => setMode("signup")} className={`h-9 rounded-md text-xs font-semibold ${!isLogin ? "bg-white text-[#24704d] shadow-sm" : "text-[#718078]"}`}>Daftar</button></div>
              <form onSubmit={submitEmailAuth} className="space-y-2.5" noValidate>
                <div className="space-y-1"><Label htmlFor="auth-email" className="text-[11px] font-semibold text-[#30483c]">Email</Label><div className="relative"><Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8aa096]" /><Input id="auth-email" type="email" className="h-10 rounded-lg border-[#dce8e2] bg-white pl-9 text-xs shadow-sm focus-visible:ring-[#1f6f4a]" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div></div>
                <div className="space-y-1"><div className="flex items-center justify-between gap-3"><Label htmlFor="auth-password" className="text-[11px] font-semibold text-[#30483c]">Kata sandi</Label>{isLogin && <Link to="/reset-password" className="text-[10px] font-medium text-[#1f6f4a] underline underline-offset-2">Lupa kata sandi?</Link>}</div><div className="relative"><Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8aa096]" /><Input id="auth-password" type="password" className="h-10 rounded-lg border-[#dce8e2] bg-white pl-9 text-xs shadow-sm focus-visible:ring-[#1f6f4a]" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} required /></div></div>
                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] leading-4 text-red-700">{error}</p>}
                <Button type="submit" className="h-10 w-full rounded-lg bg-[#1f6f4a] text-xs font-semibold text-white shadow-md shadow-[#1f6f4a]/20 hover:bg-[#164c35]" disabled={loading}>{loading && <Loader2 aria-hidden className="size-3.5 animate-spin" />}{loading ? "Memproses…" : isLogin ? "Masuk" : "Daftar"}{!loading && <ArrowRight aria-hidden className="size-3.5" />}</Button>
              </form>
              <div className="my-3 flex items-center gap-2"><span className="h-px flex-1 bg-[#dce8e2]" /><span className="text-[9px] font-medium text-[#8aa096]">atau</span><span className="h-px flex-1 bg-[#dce8e2]" /></div>
              <Button type="button" variant="outline" className="h-10 w-full rounded-lg border-[#dce8e2] bg-white text-xs font-medium text-[#30483c] shadow-sm hover:bg-[#f1f7f3]" onClick={signInWithGoogle} disabled={loading}><span className="mr-2 grid size-4 place-items-center rounded-full bg-[#e5f3eb] text-[9px] font-bold text-[#1f6f4a]">G</span>Lanjutkan dengan Google</Button>
              <div className="mt-auto pt-3 text-center"><p className="text-[10px] text-[#63756d]">{isLogin ? "Belum punya akun? " : "Sudah punya akun? "}<button type="button" className="font-semibold text-[#1f6f4a] underline underline-offset-2" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(null); }}>{isLogin ? "Daftar sekarang" : "Masuk"}</button></p><p className="mt-1.5 text-[9px] text-[#a0afa9]">© {new Date().getFullYear()} ENO NIHONGO</p></div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
