import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Atur Ulang Kata Sandi — ENO JAPAN" },
      { name: "description", content: "Minta tautan atur ulang kata sandi akun ENO JAPAN kamu." },
      { property: "og:title", content: "Atur Ulang Kata Sandi — ENO JAPAN" },
      { property: "og:description", content: "Pulihkan akses ke akun ENO JAPAN kamu." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Supabase mengirim pengguna kembali dengan event PASSWORD_RECOVERY.
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setMode("update");
    }
    return () => data.subscription.unsubscribe();
  }, []);

  async function requestLink(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid.");
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
    toast.success("Tautan atur ulang dikirim bila email terdaftar.");
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    toast.success("Kata sandi diperbarui.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-6">
        <BrandMark size="lg" />
      </Link>
      <Card className="w-full max-w-md border-border/70 bg-card">
        <CardHeader>
          <CardTitle>
            {mode === "update" ? "Buat kata sandi baru" : "Atur ulang kata sandi"}
          </CardTitle>
          <CardDescription>
            {mode === "update"
              ? "Masukkan kata sandi baru untuk akun kamu."
              : "Kami akan mengirim tautan atur ulang ke email kamu."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "update" ? (
            <form onSubmit={updatePassword} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="new-password">Kata sandi baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
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
                Simpan kata sandi
              </Button>
            </form>
          ) : sent ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Jika email tersebut terdaftar, tautan atur ulang sudah dikirim. Periksa juga folder
                spam.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                Kirim ulang
              </Button>
            </div>
          ) : (
            <form onSubmit={requestLink} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                Kirim tautan
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">
              Kembali ke halaman masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
