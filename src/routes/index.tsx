import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "enonihongo — Belajar Bahasa Jepang" },
      { name: "description", content: "Belajar bahasa Jepang N5–N1 bersama enonihongo." },
    ],
  }),
  component: () => <Navigate to="/auth" replace />,
});
