import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { getMyAccount, updateMyAccount } from "@/lib/profile.functions";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const LANGUAGES = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
] as const;

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil & Pengaturan — ENO JAPAN" },
      { name: "description", content: "Atur nama, level target, bahasa, dan target belajar harian." },
      { property: "og:title", content: "Profil & Pengaturan — ENO JAPAN" },
      { property: "og:description", content: "Personalisasi belajar bahasa Jepang kamu." },
    ],
  }),
  component: ProfilePage,
});

type FormState = {
  display_name: string;
  target_level: (typeof LEVELS)[number];
  ui_language: "id" | "en" | "ja";
  daily_kanji_target: number;
  daily_vocab_target: number;
  daily_grammar_target: number;
  furigana_enabled: boolean;
  daily_reminder: boolean;
};

function ProfilePage() {
  const fetchAccount = useServerFn(getMyAccount);
  const saveAccount = useServerFn(updateMyAccount);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-account"],
    queryFn: () => fetchAccount(),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setForm({
      display_name: data.profile?.display_name ?? "",
      target_level: (data.profile?.target_level as FormState["target_level"]) ?? "N5",
      ui_language: (data.profile?.ui_language as FormState["ui_language"]) ?? "id",
      daily_kanji_target: data.settings?.daily_kanji_target ?? 5,
      daily_vocab_target: data.settings?.daily_vocab_target ?? 10,
      daily_grammar_target: data.settings?.daily_grammar_target ?? 5,
      furigana_enabled: data.settings?.furigana_enabled ?? true,
      daily_reminder: data.settings?.daily_reminder ?? false,
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: (values: FormState) => saveAccount({ data: values }),
    onSuccess: () => {
      toast.success("Pengaturan tersimpan.");
      queryClient.invalidateQueries({ queryKey: ["my-account"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
    },
  });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    if (form.display_name.trim().length < 2) {
      setFormError("Nama tampilan minimal 2 karakter.");
      return;
    }
    setFormError(null);
    mutation.mutate({ ...form, display_name: form.display_name.trim() });
  }

  return (
    <AppShell title="Profil & Pengaturan" description="Data ini tersimpan aman di akun kamu.">
      {isLoading || !form ? (
        isError ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle>Gagal memuat profil</CardTitle>
              <CardDescription>{(error as Error).message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => refetch()}>
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        )
      ) : (
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profil</CardTitle>
              <CardDescription>Nama dan preferensi bahasa antarmuka.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nama tampilan</Label>
                <Input
                  id="display_name"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target_level">Level target JLPT</Label>
                  <Select
                    value={form.target_level}
                    onValueChange={(v) =>
                      setForm({ ...form, target_level: v as FormState["target_level"] })
                    }
                  >
                    <SelectTrigger id="target_level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ui_language">Bahasa antarmuka</Label>
                  <Select
                    value={form.ui_language}
                    onValueChange={(v) =>
                      setForm({ ...form, ui_language: v as FormState["ui_language"] })
                    }
                  >
                    <SelectTrigger id="ui_language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target harian</CardTitle>
              <CardDescription>Bawaan: 5 kanji, 10 kotoba, 5 bunpo per hari.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField
                  id="daily_kanji_target"
                  label="Kanji"
                  value={form.daily_kanji_target}
                  max={100}
                  onChange={(v) => setForm({ ...form, daily_kanji_target: v })}
                />
                <NumberField
                  id="daily_vocab_target"
                  label="Kotoba"
                  value={form.daily_vocab_target}
                  max={200}
                  onChange={(v) => setForm({ ...form, daily_vocab_target: v })}
                />
                <NumberField
                  id="daily_grammar_target"
                  label="Bunpo"
                  value={form.daily_grammar_target}
                  max={100}
                  onChange={(v) => setForm({ ...form, daily_grammar_target: v })}
                />
              </div>

              <ToggleRow
                id="furigana_enabled"
                label="Tampilkan furigana"
                description="Bantu baca kanji dengan hiragana kecil."
                checked={form.furigana_enabled}
                onChange={(v) => setForm({ ...form, furigana_enabled: v })}
              />
              <ToggleRow
                id="daily_reminder"
                label="Pengingat harian"
                description="Preferensi tersimpan; pengiriman notifikasi menyusul di fase retensi."
                checked={form.daily_reminder}
                onChange={(v) => setForm({ ...form, daily_reminder: v })}
              />
            </CardContent>
          </Card>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            Simpan perubahan
          </Button>
        </form>
      )}
    </AppShell>
  );
}

function NumberField({
  id,
  label,
  value,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(0, Number(e.target.value) || 0)))}
      />
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
