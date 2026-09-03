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

type AuthMode = "login" | "signup";

function getAuthRedirectUrl() {
  if (typeof window !== "undefined") return `${window.location.origin}/onboarding`;
  return "/onboarding";
}

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
      setError(message); toast.error(message);
    } finally { setLoading(false); }
  }

  async function signInWithGoogle() {
    setError(null); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthRedirectUrl() } });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal masuk dengan Google.";
      setError(message); toast.error(message); setLoading(false);
    }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-[#f7f4ef]"><Loader2 aria-label="Memuat" className="size-5 animate-spin text-[#1f6f4a]" /></div>;

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f4ef] px-0 py-0 sm:px-5 sm:py-8">
      <section className="relative flex min-h-screen w-full max-w-[380px] flex-col overflow-hidden bg-[#fffaf5] shadow-2xl shadow-[#1f6f4a]/20 sm:min-h-[720px] sm:rounded-[36px]">
        <header className="relative h-[220px] shrink-0 overflow-hidden bg-[#1f6f4a] px-6 pt-9 text-white">
          <div aria-hidden="true" className="absolute -right-20 -top-24 size-64 rounded-full border-[34px] border-[#d8efe3]/20" />
          <div aria-hidden="true" className="absolute -left-24 top-24 size-52 rounded-full border-[26px] border-[#d8efe3]/20" />
          <div aria-hidden="true" className="absolute right-8 bottom-[-80px] size-44 rounded-full bg-[#d8efe3]/10" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-[#2f8f68]/35 via-transparent to-[#164c35]/35" />
          <div className="relative z-10 flex justify-center">
            <Link to="/" aria-label="ENO NIHONGO">
              <span className="block rounded-2xl bg-[#fffaf5] p-2.5 shadow-lg shadow-[#123b2a]/20">
                <BrandMark size="lg" />
              </span>
            </Link>
          </div>
          <div className="relative z-10 mt-5 text-center">
            <p className="font-jp text-xs font-medium tracking-[0.28em] text-[#e4f5ec]">日本語を、もっと楽しく。</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">ENO NIHONGO</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col bg-[#fffaf5] px-6 pb-6 pt-7 sm:px-7">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f6f4a]">{isLogin ? "Selamat datang" : "Buat akun"}</p>
            <h2 className="mt-1.5 text-[1.45rem] font-bold leading-tight tracking-tight text-[#263b31]">{isLogin ? "Masuk ke akunmu" : "Mulai belajar bersama kami"}</h2>
            <p className="mt-1.5 text-xs leading-5 text-[#63756d]">{isLogin ? "Lanjutkan belajar bahasa Jepang dan capai target JLPT-mu." : "Simpan progres belajar dan bangun kebiasaan bahasa Jepangmu."}</p>
          </div>

          <form onSubmit={submitEmailAuth} className="space-y-3.5" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="auth-email" className="text-xs font-semibold text-[#30483c]">Email</Label>
              <div className="relative"><Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8aa096]" /><Input id="auth-email" type="email" className="h-11 rounded-xl border-[#dce8e2] bg-white pl-9 text-sm shadow-sm focus-visible:ring-[#1f6f4a]" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3"><Label htmlFor="auth-password" className="text-xs font-semibold text-[#30483c]">Kata sandi</Label>{isLogin && <Link to="/reset-password" className="text-[11px] font-medium text-[#1f6f4a] underline underline-offset-4">Lupa kata sandi?</Link>}</div>
              <div className="relative"><Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8aa096]" /><Input id="auth-password" type="password" className="h-11 rounded-xl border-[#dce8e2] bg-white pl-9 text-sm shadow-sm focus-visible:ring-[#1f6f4a]" value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} required /></div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{error}</p>}
            <Button type="submit" className="h-11 w-full rounded-xl bg-[#1f6f4a] text-sm font-semibold text-white shadow-md shadow-[#1f6f4a]/20 hover:bg-[#164c35]" disabled={loading}>{loading && <Loader2 aria-hidden className="size-4 animate-spin" />}{loading ? "Memproses…" : isLogin ? "Masuk" : "Daftar"}{!loading && <ArrowRight aria-hidden className="size-4" />}</Button>
          </form>

          <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-[#dce8e2]" /><span className="text-[10px] font-medium text-[#8aa096]">atau</span><span className="h-px flex-1 bg-[#dce8e2]" /></div>
          <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-[#dce8e2] bg-white text-sm font-medium text-[#30483c] shadow-sm hover:bg-[#f1f7f3]" onClick={signInWithGoogle} disabled={loading}><span className="grid size-5 place-items-center rounded-full bg-[#e5f3eb] text-[11px] font-bold text-[#1f6f4a]">G</span>Lanjutkan dengan Google</Button>

          <div className="mt-auto pt-5 text-center"><p className="text-xs text-[#63756d]">{isLogin ? "Belum punya akun? " : "Sudah punya akun? "}<button type="button" className="font-semibold text-[#1f6f4a] underline underline-offset-4" onClick={() => { setMode(isLogin ? "signup" : "login"); setError(null); }}>{isLogin ? "Daftar sekarang" : "Masuk"}</button></p><p className="mt-3 text-[10px] text-[#a0afa9]">© {new Date().getFullYear()} ENO NIHONGO</p></div>
        </div>
      </section>
    </main>
  );
}
