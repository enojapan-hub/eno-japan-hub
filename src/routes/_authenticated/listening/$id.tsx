import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/listening/$id")({
  beforeLoad: () => {
    throw redirect({ to: "/choukai", replace: true });
  },
  component: () => null,
});
