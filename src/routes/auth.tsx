import { useEffect, useState } from "react";
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
          "Masuk ke ENO JAPAN untuk belajar kanji, kotoba, dan bunpo serta menyiapkan JLPT N5–N1.",
      },
      { property: "og:title", content: "Masuk atau Daftar — ENO JAPAN" },
      {
        property: "og:description",
        content: "Akun gratis ENO JAPAN memberi akses belajar N5–N1.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

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
          <CardTitle>Selamat datang</CardTitle>
          <CardDescription>
            Akun gratis memberi akses materi N5–N1. Premium menambah personalisasi dan fitur AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Masuk</TabsTrigger>
              <TabsTrigger value="signup">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <EmailForm mode="signin" />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <EmailForm mode="signup" />
            </TabsContent>
          </Tabs>

        </CardContent>
      </Card>
    </div>
  );
}

function EmailForm({ mode }: { mode: "signin" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid.");
      return;
    }
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (mode === "signup" && displayName.trim().length < 2) {
      setError("Nama tampilan minimal 2 karakter.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { display_name: displayName.trim() },
          },
        });
        if (signUpError) throw signUpError;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          toast.success("Akun dibuat. Selamat belajar!");
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Cek email kamu untuk konfirmasi akun.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Terjadi kesalahan.";
      setError(
        message.toLowerCase().includes("invalid login")
          ? "Email atau kata sandi salah."
          : message.toLowerCase().includes("already registered")
            ? "Email ini sudah terdaftar. Silakan masuk."
            : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === "signup" ? (
        <div className="space-y-2">
          <Label htmlFor={`${mode}-name`}>Nama tampilan</Label>
          <Input
            id={`${mode}-name`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${mode}-email`}>Email</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-password`}>Kata sandi</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {mode === "signup" ? "Buat akun gratis" : "Masuk"}
      </Button>

      {mode === "signin" ? (
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/reset-password" className="underline underline-offset-4 hover:text-foreground">
            Lupa kata sandi?
          </Link>
        </p>
      ) : null}
    </form>
  );
}
