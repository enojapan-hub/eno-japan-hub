import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/bunpo")({
  head: () => ({ meta: [{ title: "Bunpō — ENO JAPAN" }] }),
  component: BunpoPage,
});

function BunpoPage() {
  return (
    <AppShell title="文法 Bunpō" description="Tata bahasa Jepang N5–N1." backTo="/belajar" backLabel="Belajar">
      <Card>
        <CardHeader><CardTitle>Belajar Bunpō</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Modul tata bahasa sedang disiapkan. Halaman authenticated sudah tersedia dan siap dikembangkan.
        </CardContent>
      </Card>
    </AppShell>
  );
}
