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
        const user = data.session?.user;
        if (!user) {
          navigate({ to: "/auth", replace: true });
          return;
        }

        // Profile is the canonical onboarding source. Older accounts can have a
        // complete profile while auth metadata is missing/stale, which previously
        // sent them back to onboarding after every login.
        const profileResult = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profileResult.error) {
          console.warn("Profile onboarding lookup failed; using auth metadata fallback.", profileResult.error);
        }

        const profileCompleted = profileResult.data?.onboarding_completed === true;
        const metadataCompleted = user.user_metadata?.["onboarding_completed"] === true;
        const completed = profileResult.error ? metadataCompleted : profileCompleted;

        // Repair stale metadata opportunistically so later route decisions stay consistent.
        if (profileCompleted && !metadataCompleted) {
          void supabase.auth.updateUser({ data: { onboarding_completed: true } });
        }

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
