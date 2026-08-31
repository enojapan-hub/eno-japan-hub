import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/kotoba")({
  head: () => ({ meta: [{ title: "Kotoba — ENO JAPAN" }] }),
  component: KotobaPage,
});

function KotobaPage() {
  return (
    <AppShell title="言葉 Kotoba" description="Kosakata bahasa Jepang N5–N1." backTo="/belajar" backLabel="Belajar">
      <Card>
        <CardHeader><CardTitle>Belajar Kotoba</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Modul kosakata sedang disiapkan. Struktur halaman sudah aktif sehingga menu tidak lagi menjadi dead link.
        </CardContent>
      </Card>
    </AppShell>
  );
}
