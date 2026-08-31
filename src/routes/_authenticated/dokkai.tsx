import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dokkai")({
  head: () => ({ meta: [{ title: "Dokkai — ENO JAPAN" }] }),
  component: DokkaiPage,
});

function DokkaiPage() {
  return (
    <AppShell title="読解 Dokkai" description="Latihan membaca bahasa Jepang." backTo="/belajar" backLabel="Belajar">
      <Card>
        <CardHeader><CardTitle>Latihan Dokkai</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Modul membaca sedang disiapkan. Halaman sudah aktif agar navigasi Belajar dapat digunakan tanpa dead link.
        </CardContent>
      </Card>
    </AppShell>
  );
}
