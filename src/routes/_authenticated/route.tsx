import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Use the locally persisted Supabase session here. After a successful PKCE
    // exchange, getSession resolves immediately and avoids another /user request
    // during route entry, which could leave the client route in a pending state.
    const { data, error } = await supabase.auth.getSession();

    if (!error && data.session?.user) {
      return { user: data.session.user };
    }

    if (error) {
      await supabase.auth.signOut({ scope: "local" });
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
