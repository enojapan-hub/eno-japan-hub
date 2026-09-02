import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return { user: data.user };

    // Jangan biarkan sesi Supabase yang rusak/kedaluwarsa membuat aplikasi
    // terus menganggap pengguna masih login. Bersihkan sesi lokal sebelum
    // mengarahkan kembali ke halaman masuk.
    if (error) {
      const message = `${error.name ?? ""} ${error.message ?? ""}`.toLowerCase();
      const staleSession = /jwt|session|refresh token|auth session/.test(message);
      if (staleSession) await supabase.auth.signOut({ scope: "local" });
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
