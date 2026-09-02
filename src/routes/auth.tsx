import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — enonihongo" },
      { name: "description", content: "Masuk atau daftar di enonihongo untuk belajar bahasa Jepang dan menyiapkan JLPT N5–N1." },
      { property: "og:title", content: "Masuk — enonihongo" },
      { property: "og:description", content: "Masuk dengan email atau Google untuk melanjutkan belajar di enonihongo." },
    ],
  }),
  component: AuthPage,
});

const PRODUCTION_ORIGIN = "https://eno-japan-hub.vercel.app";

type AuthMode = "login" | "signup";

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
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
    return () => { active = false; };
  }, [navigate]);

  async function submitEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setError("Masukkan email yang valid.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: `${PRODUCTION_ORIGIN}/dashboard` },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Pendaftaran berhasil. Periksa email untuk verifikasi akun.");
          setMode("login");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) throw signInError;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Autentikasi gagal.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${PRODUCTION_ORIGIN}/dashboard` },
      });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal masuk dengan Google.";
      setError(message); toast.error(message); setLoading(false);
    }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 aria-label="Memuat" className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6"><BrandMark size="lg" /></Link>
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="space-y-2">
          <CardTitle>{mode === "login" ? "Selamat datang di enonihongo" : "Buat akun enonihongo"}</CardTitle>
          <CardDescription>{mode === "login" ? "Masuk untuk melanjutkan belajar bahasa Jepang." : "Buat akun gratis untuk menyimpan progres belajar."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form onSubmit={submitEmailAuth} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email</Label>
              <div className="relative"><Mail aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-email" type="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label htmlFor="auth-password">Kata sandi</Label>{mode === "login" && <Link to="/reset-password" className="text-xs underline underline-offset-4">Lupa kata sandi?</Link>}</div>
              <div className="relative"><Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="auth-password" type="password" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></div>
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>{loading && <Loader2 aria-hidden className="size-4 animate-spin" />}{loading ? "Memproses…" : mode === "login" ? "Masuk dengan Email" : "Daftar dengan Email"}</Button>
          </form>

          <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">atau</span></div></div>

          <Button type="button" variant="outline" className="h-11 w-full" onClick={signInWithGoogle} disabled={loading}>Lanjutkan dengan Google</Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}>
              {mode === "login" ? "Daftar sekarang" : "Masuk"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
