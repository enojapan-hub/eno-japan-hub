import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/listening")({
  head: () => ({ meta: [{ title: "Choukai — ENO JAPAN" }] }),
  component: ListeningPage,
});

function ListeningPage() {
  return (
    <AppShell title="聴解 Choukai" description="Latihan menyimak bahasa Jepang." backTo="/belajar" backLabel="Belajar">
      <Card>
        <CardHeader><CardTitle>Latihan Choukai</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Modul listening sedang disiapkan. Halaman authenticated sudah aktif dan siap menerima materi audio.
        </CardContent>
      </Card>
    </AppShell>
  );
}
