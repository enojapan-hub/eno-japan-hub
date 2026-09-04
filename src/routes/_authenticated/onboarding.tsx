import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, Camera, Check, ChevronLeft, ChevronRight, GraduationCap, Loader2, Target, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, updateMyAccount } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Mulai di enonihongo" }] }),
  component: OnboardingPage,
});

const LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
type Level = (typeof LEVELS)[number];
type DurationChoice = "2m" | "3m" | "custom";

function addMonths(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Pilih file gambar."));
    if (file.size > 5 * 1024 * 1024) return reject(new Error("Ukuran foto maksimal 5 MB."));
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    reader.onerror = () => reject(new Error("Foto tidak dapat dibaca."));
    img.onload = () => {
      const max = 360;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Foto tidak dapat diproses."));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("Foto tidak dapat diproses."));
    reader.readAsDataURL(file);
  });
}

async function loadProfile() {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sesi masuk tidak ditemukan.");
  const account = await getMyAccount();
  return { user: auth.user, profile: account.profile };
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Level>("N5");
  const [avatar, setAvatar] = useState("");
  const [duration, setDuration] = useState<DurationChoice>("3m");
  const [customDate, setCustomDate] = useState(addMonths(3));
  const [error, setError] = useState<string | null>(null);

  const targetDate = useMemo(() => duration === "2m" ? addMonths(2) : duration === "3m" ? addMonths(3) : customDate, [duration, customDate]);

  useEffect(() => {
    loadProfile()
      .then(({ user, profile }) => {
        const meta = user.user_metadata ?? {};
        if (meta["onboarding_completed"] === true) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        setName(profile?.display_name?.trim() || String(meta["full_name"] ?? meta["name"] ?? ""));
        setLevel(LEVELS.includes(profile?.target_level as Level) ? profile?.target_level as Level : "N5");
        setAvatar(String(meta["avatar_url"] ?? meta["picture"] ?? ""));
      })
      .catch(e => setError(e instanceof Error ? e.message : "Gagal memuat profil."))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function save() {
    if (name.trim().length < 2) {
      setError("Nama tampilan minimal 2 karakter.");
      setStep(0);
      return;
    }
    if (!targetDate || targetDate <= new Date().toISOString().slice(0, 10)) {
      setError("Tanggal target harus setelah hari ini.");
      setStep(3);
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Sesi masuk tidak ditemukan.");
      const current = await getMyAccount();

      await updateMyAccount({
        data: {
          display_name: name.trim(),
          target_level: level,
          ui_language: "id",
          daily_kanji_target: current.settings.daily_kanji_target,
          daily_vocab_target: current.settings.daily_vocab_target,
          daily_grammar_target: current.settings.daily_grammar_target,
          furigana_enabled: current.settings.furigana_enabled,
          daily_reminder: current.settings.daily_reminder,
        },
      });

      const rpc = (supabase as any).rpc.bind(supabase);
      const { error: planError } = await rpc("create_or_replace_study_plan", {
        p_target_level: level,
        p_target_date: targetDate,
        p_daily_minutes: 45,
      });
      if (planError) throw planError;

      const { error: taskError } = await rpc("generate_daily_study_tasks", {});
      if (taskError) throw taskError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          display_name: name.trim(),
          avatar_url: avatar || null,
          onboarding_completed: true,
          study_target_date: targetDate,
        },
      });
      if (metadataError) throw metadataError;

      toast.success("Rencana belajar berhasil dibuat. ENO NIHONGO sudah menyiapkan target hari ini.");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Profil gagal disimpan.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (error && !name) return <div className="grid min-h-screen place-items-center bg-background p-4"><Card className="w-full max-w-md"><CardContent className="p-6 text-center text-sm">{error}<Button className="mt-4 w-full" onClick={() => window.location.reload()}>Coba lagi</Button></CardContent></Card></div>;

  const steps = [
    { title: "Kenalan dulu 👋", desc: "Bagaimana kami memanggil kamu?", icon: UserRound },
    { title: "Pilih foto profil", desc: "Opsional. Kamu bisa melewati bagian ini.", icon: Camera },
    { title: "Target JLPT", desc: "Pilih level yang ingin kamu capai.", icon: GraduationCap },
    { title: "Mau selesai kapan?", desc: "ENO NIHONGO akan menghitung beban belajar harian secara otomatis.", icon: Target },
  ];
  const StepIcon = steps[step].icon;

  return <div className="min-h-screen bg-background px-4 py-8 sm:py-12"><div className="mx-auto w-full max-w-lg">
    <div className="mb-7 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><StepIcon className="size-6" /></div><p className="text-xs font-semibold text-primary">{step + 1} / {steps.length}</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{steps[step].title}</h1><p className="mt-1 text-sm text-muted-foreground">{steps[step].desc}</p></div>
    <div className="mb-6 flex gap-1.5">{steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}</div>

    <Card className="rounded-3xl border-border/70 shadow-sm"><CardContent className="p-5 sm:p-7">
      {step === 0 && <div className="space-y-3"><Label htmlFor="onboarding-name">Nama tampilan</Label><Input id="onboarding-name" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Andi" className="h-12 rounded-xl" maxLength={60} /><p className="text-xs text-muted-foreground">Nama ini akan tampil di beranda, profil, dan peringkat.</p></div>}

      {step === 1 && <div className="flex flex-col items-center gap-5"><Avatar className="size-32 border-4 border-background shadow-md"><AvatarImage src={avatar} /><AvatarFallback className="text-3xl font-bold">{name.slice(0, 1).toUpperCase() || "E"}</AvatarFallback></Avatar><label htmlFor="onboarding-photo" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border bg-background px-5 text-sm font-semibold shadow-sm"><Camera className="size-4" />Pilih foto</label><input id="onboarding-photo" type="file" accept="image/*" className="hidden" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setAvatar(await compressImage(file)); setError(null); } catch (err) { setError(err instanceof Error ? err.message : "Foto gagal diproses."); } }} /><p className="text-center text-xs text-muted-foreground">JPG/PNG • maksimal 5 MB • foto diperkecil otomatis.</p>{avatar && <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar("")}>Gunakan tanpa foto</Button>}</div>}

      {step === 2 && <div className="grid gap-3">{LEVELS.map(l => <button type="button" key={l} onClick={() => setLevel(l)} className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${level === l ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:bg-muted/50"}`}><span><span className="block text-base font-bold">{l}</span><span className="text-xs text-muted-foreground">{l === "N5" ? "Pemula" : l === "N4" ? "Dasar" : l === "N3" ? "Menengah" : l === "N2" ? "Menengah atas" : "Mahir"}</span></span>{level === l && <Check className="size-5 text-primary" />}</button>)}</div>}

      {step === 3 && <div className="space-y-3">
        <button type="button" onClick={() => setDuration("2m")} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${duration === "2m" ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:bg-muted/50"}`}><span><span className="block font-semibold">2 bulan</span><span className="text-xs text-muted-foreground">Tempo lebih cepat, target harian lebih padat.</span></span>{duration === "2m" && <Check className="size-5 text-primary" />}</button>
        <button type="button" onClick={() => setDuration("3m")} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${duration === "3m" ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:bg-muted/50"}`}><span><span className="block font-semibold">3 bulan</span><span className="text-xs text-muted-foreground">Seimbang untuk belajar konsisten.</span></span>{duration === "3m" && <Check className="size-5 text-primary" />}</button>
        <button type="button" onClick={() => setDuration("custom")} className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${duration === "custom" ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "hover:bg-muted/50"}`}><span><span className="block font-semibold">Tentukan sendiri</span><span className="text-xs text-muted-foreground">Pilih tanggal target sesuai rencanamu.</span></span>{duration === "custom" && <Check className="size-5 text-primary" />}</button>
        {duration === "custom" && <div className="pt-2"><Label htmlFor="target-date">Tanggal target</Label><div className="relative mt-2"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input id="target-date" type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={customDate} onChange={e => setCustomDate(e.target.value)} className="h-12 rounded-xl pl-10" /></div></div>}
        <div className="rounded-2xl bg-primary/5 p-4 text-sm"><p className="font-semibold">Rencana awal: {level}</p><p className="mt-1 text-xs text-muted-foreground">Target selesai {new Date(`${targetDate}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}. Beban belajar akan berubah mengikuti akurasi kuis, review yang jatuh tempo, hari yang terlewat, dan sisa waktu.</p></div>
      </div>}

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    </CardContent></Card>

    <div className="mt-5 flex gap-3"><Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" disabled={saving || step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="size-4" />Kembali</Button>{step < steps.length - 1 ? <Button type="button" className="h-11 flex-1 rounded-xl" onClick={() => { if (step === 0 && name.trim().length < 2) { setError("Nama tampilan minimal 2 karakter."); return; } setError(null); setStep(step + 1); }}><span>Lanjut</span><ChevronRight className="size-4" /></Button> : <Button type="button" className="h-11 flex-1 rounded-xl" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Susun rencana</Button>}</div>
    <p className="mt-5 text-center text-[11px] text-muted-foreground">Bahasa aplikasi difokuskan ke Bahasa Indonesia. Target belajar dapat diubah kembali dari Profil.</p>
  </div></div>;
}
