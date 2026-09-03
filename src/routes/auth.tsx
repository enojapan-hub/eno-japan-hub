import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Masuk — enonihongo" },
    { name: "description", content: "Masuk atau daftar di enonihongo untuk belajar bahasa Jepang dan menyiapkan JLPT N5–N1." },
    { property: "og:title", content: "Masuk — enonihongo" },
    { property: "og:description", content: "Masuk dengan email atau Google untuk melanjutkan belajar di enonihongo." },
  ] }),
  component: AuthPage,
});

const PRODUCTION_ORIGIN = "https://eno-japan-hub.vercel.app";
type AuthMode = "login" | "signup";

async function continueAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data } = await supabase.auth.getUser();
  if (data.user?.user_metadata?.["onboarding_completed"] === true) navigate({ to: "/dashboard", replace: true });
  else navigate({ to: "/onboarding", replace: true });
}

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) await continueAfterAuth(navigate);
      else setChecking(false);
    });
    return () => { active = false; };
  }, [navigate]);

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) { setError("Masukkan email yang valid."); return; }
    if (password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${PRODUCTION_ORIGIN}/onboarding` } });
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
      setError(message); toast.error(message);
    } finally { setLoading(false); }
  }

  async function signInWithGoogle() {
    setError(null); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${PRODUCTION_ORIGIN}/onboarding` } });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal masuk dengan Google.";
      setError(message); toast.error(message); setLoading(false);
    }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 aria-label="Memuat" className="size-5 animate-spin text-muted-foreground" /></div>;

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-6 sm:px-6 sm:py-8">
      <section className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-xl shadow-slate-900/5">
        <div className="grid md:grid-cols-[1.05fr_.95fr]">
          <div className="p-6 sm:p-8 md:p-9">
            <div className="mb-6 flex items-center justify-center md:justify-start">
              <Link to="/"><BrandMark size="md" /></Link>
            </div>

            <div className="mb-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">ENO NIHONGO</p>
              <h1 className="text-[1.55rem] font-bold leading-tight tracking-tight sm:text-[1.7rem]">
                {isLogin ? "Selamat datang kembali" : "Mulai belajar bersama ENO"}
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {isLogin ? "Masuk untuk melanjutkan perjalanan belajar bahasa Jepang dan JLPT." : "Buat akun gratis untuk menyimpan progres belajar dan target JLPT kamu."}
              </p>
            </div>

            <form onSubmit={submitEmailAuth} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <div className="relative">
                  <Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="auth-email" type="email" className="h-10 pl-9 text-sm" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="auth-password">Kata sandi</Label>
                  {isLogin && <Link to="/reset-password" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Lupa kata sandi?</Link>}
                </div>
                <div className="relative">
                  <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="auth-password" type="password" className="h-10 pl-9 text-sm" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} required />
                </div>
              </div>

              {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive">{error}</p>}

              <Button type="submit" className="h-10 w-full text-sm font-semibold" disabled={loading}>
                {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
                {loading ? "Memproses…" : isLogin ? "Masuk" : "Daftar"}
                {!loading && <ArrowRight aria-hidden className="size-4" />}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">atau</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button type="button" variant="outline" className="h-10 w-full text-sm" onClick={signInWithGoogle} disabled={loading}>
              Lanjutkan dengan Google
            </Button>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(null); }}>
                {isLogin ? "Daftar sekarang" : "Masuk"}
              </button>
            </p>
          </div>

          <aside className="relative hidden min-h-[460px] overflow-hidden bg-gradient-to-br from-[#164e43] via-[#176b5c] to-[#2f5b91] p-9 text-white md:flex md:flex-col md:justify-between">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-16 size-52 rounded-full bg-white/10" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm">Belajar Jepang lebih terarah</span>
              <h2 className="mt-6 text-3xl font-bold leading-tight tracking-tight">Satu langkah kecil setiap hari.</h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/80">Kanji, kotoba, bunpou, dokkai, choukai, quiz, dan persiapan JLPT dalam satu tempat.</p>
            </div>
            <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="font-jp text-lg font-medium">日本語を、もっと楽しく。</p>
              <p className="mt-1 text-xs text-white/70">Belajar konsisten. Pahami bertahap. Capai targetmu.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
