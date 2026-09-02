import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/progress")({
  beforeLoad: () => {
    throw redirect({ to: "/profil" });
  },
  component: () => null,
});
