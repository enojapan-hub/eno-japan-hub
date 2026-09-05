import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dokkai-baca/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/dokkai/$id",
      params: { id: params.id },
      replace: true,
    });
  },
  component: () => null,
});
