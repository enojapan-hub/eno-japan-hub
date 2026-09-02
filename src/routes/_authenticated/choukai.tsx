import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/choukai")({
  beforeLoad: () => {
    throw redirect({ to: "/listening" });
  },
});
