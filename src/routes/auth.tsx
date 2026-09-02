import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — ENO JAPAN" },
      {
        name: "description",
        content:
          "Masuk atau buat akun ENO JAPAN untuk belajar kanji, kotoba, bunpo, dan menyiapkan JLPT N5–N1.",
      },
      { property: "og:title", content: "Masuk atau Daftar — ENO JAPAN" },
      {
        property: "og:description",
        content: "Buat akun gratis dan lanjutkan belajar bahasa Jepang di ENO JAPAN.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  function validate(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Masukkan alamat email yang valid.";
    if (mode !== "reset" && password.length < 8) return "Kata sandi minimal 8 karakter.";
    if (mode === "signup" && displayName.trim().length < 2) return "Nama tampilan minimal 2 karakter.";
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        toast.success("Berhasil masuk.");
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: displayName.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          toast.success("Akun dibuat. Selamat belajar!");
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setNotice("Akun dibuat. Cek email kamu dan klik tautan konfirmasi untuk mengaktifkan akun.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("Tautan pengaturan ulang kata sandi telah dikirim ke email kamu.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Terjadi kesalahan. Coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 aria-label="Memuat" className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6">
        <BrandMark size="lg" />
      </Link>
      <Card className="w-full max-w-md border-border/70 bg-card">
        <CardHeader>
          <CardTitle>
            {mode === "reset" ? "Atur ulang kata sandi" : "Selamat datang di ENO JAPAN"}
          </CardTitle>
          <CardDescription>
            {mode === "reset"
              ? "Masukkan email akun kamu. Kami akan mengirim tautan untuk membuat kata sandi baru."
              : "Gunakan email dan kata sandi untuk masuk atau membuat akun gratis."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode !== "reset" ? (
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as Mode);
                setError(null);
                setNotice(null);
              }}
              className="mb-5"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" />
              <TabsContent value="signup" />
            </Tabs>
          ) : null}

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="display_name">Nama tampilan</Label>
                <Input
                  id="display_name"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama kamu"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>

            {mode !== "reset" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Kata sandi</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                />
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
              {mode === "signin" ? "Masuk" : mode === "signup" ? "Buat akun" : "Kirim tautan reset"}
            </Button>
          </form>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-4 text-sm text-primary">
              {notice}
            </p>
          ) : null}

          <div className="mt-5 text-center text-xs text-muted-foreground">
            {mode === "reset" ? (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setNotice(null);
                }}
              >
                Kembali ke halaman masuk
              </button>
            ) : (
              <button
                type="button"
                className="underline underline-offset-4 hover:text-foreground"
                onClick={() => {
                  setMode("reset");
                  setError(null);
                  setNotice(null);
                }}
              >
                Lupa kata sandi?
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
