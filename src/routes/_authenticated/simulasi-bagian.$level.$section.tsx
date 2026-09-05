import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/simulasi-bagian/$level/$section")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/simulasi/$level",
      params: { level: params.level.toUpperCase() },
      replace: true,
    });
  },
  component: () => null,
});
