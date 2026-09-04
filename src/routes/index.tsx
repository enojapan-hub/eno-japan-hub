import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "enonihongo — Belajar Bahasa Jepang" },
      { name: "description", content: "Belajar bahasa Jepang N5–N1 bersama enonihongo." },
    ],
  }),
  component: RootEntry,
});

const CANONICAL_ORIGIN = "https://enonihongo.vercel.app";

function RootEntry() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Menyelesaikan login…");

  useEffect(() => {
    let active = true;

    async function finish() {
      if (typeof window === "undefined") return;

      // Supabase may still fall back to an older Site URL. Move the callback,
      // including its ?code=..., to the canonical host before PKCE exchange.
      if (window.location.origin !== CANONICAL_ORIGIN) {
        window.location.replace(`${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorDescription = params.get("error_description") || params.get("error");

      if (errorDescription) {
        if (active) setMessage(`Login gagal: ${errorDescription}`);
        window.setTimeout(() => navigate({ to: "/auth", replace: true }), 900);
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, document.title, "/");
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          navigate({ to: "/auth", replace: true });
          return;
        }

        const completed = data.session.user.user_metadata?.["onboarding_completed"] === true;
        navigate({ to: completed ? "/dashboard" : "/onboarding", replace: true });
      } catch (caught) {
        const text = caught instanceof Error ? caught.message : "Sesi login tidak dapat diselesaikan.";
        if (active) setMessage(`Login gagal: ${text}`);
        window.setTimeout(() => navigate({ to: "/auth", replace: true }), 1200);
      }
    }

    void finish();
    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7f4] px-6 text-center">
      <div>
        <Loader2 className="mx-auto size-6 animate-spin text-[#1f6f4a]" aria-hidden />
        <p className="mt-3 text-sm font-medium text-[#30483c]">{message}</p>
      </div>
    </main>
  );
}
