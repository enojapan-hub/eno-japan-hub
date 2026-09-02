import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark } from "@/components/layout/BrandMark";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Masuk — enonihongo" },
    { name: "description", content: "Masuk ke enonihongo dengan akun Google untuk belajar bahasa Jepang dan menyiapkan JLPT N5–N1." },
    { property: "og:title", content: "Masuk — enonihongo" },
    { property: "og:description", content: "Masuk dengan Google untuk melanjutkan belajar di enonihongo." },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  async function signInWithGoogle() {
    setError(null); setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
      if (oauthError) throw oauthError;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Gagal masuk dengan Google.";
      setError(message); toast.error(message); setLoading(false);
    }
  }

  if (checking) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 aria-label="Memuat" className="size-6 animate-spin text-muted-foreground" /></div>;
  return <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
    <Link to="/" className="mb-6"><BrandMark size="lg" /></Link>
    <Card className="w-full max-w-md shadow-none">
      <CardHeader className="space-y-2"><CardTitle>Selamat datang di enonihongo</CardTitle><CardDescription>Masuk atau buat akun secara otomatis menggunakan akun Google.</CardDescription></CardHeader>
      <CardContent>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={signInWithGoogle} disabled={loading}>{loading && <Loader2 className="size-4 animate-spin" />}{loading ? "Menghubungkan ke Google…" : "Lanjutkan dengan Google"}</Button>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Dengan melanjutkan, kamu menyetujui penggunaan akun Google untuk autentikasi enonihongo.</p>
      </CardContent>
    </Card>
  </div>;
}
