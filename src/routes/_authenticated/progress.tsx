import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Flame, Lightbulb, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMyProgress } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/progress")({ component: ProgressPage });

function ProgressPage() {
 const { data, isLoading, error, refetch } = useQuery({ queryKey:["my-progress"], queryFn:fetchMyProgress });
 const learned=data?.progress??[], attempts=data?.attempts??[], stats=data?.stats, weak=data?.weak??[];
 const count=(t:string)=>learned.filter(x=>x.item_type===t).length;
 const kanji=count("kanji"), kotoba=count("vocabulary"), bunpo=count("grammar"), total=kanji+kotoba+bunpo;
 const best=attempts.length?Math.max(...attempts.map(a=>Number(a.score)||0)):0, max=Math.max(kanji,kotoba,bunpo,1);
 const suggestion=weak.length?"Ulangi materi yang paling sering salah agar pemahamanmu lebih kuat.":total===0?"Mulai dari target harian kecil dan pertahankan konsistensi setiap hari.":"Perkembanganmu sudah berjalan. Pertahankan ritme belajar dan naikkan target sedikit demi sedikit.";
 const tip=best<70?"Setelah mengerjakan soal, baca kembali alasan jawaban benar dan salah sebelum lanjut.":best<90?"Campurkan Kanji, Kotoba, dan Bunpō dalam satu sesi agar ingatan lebih kuat.":"Pertahankan hasilmu dengan latihan singkat setiap hari dan ulangi materi lama secara berkala.";
 return <AppShell title="Kemajuan" description="Perkembangan, saran, dan tips belajar kamu." backTo="/dashboard" backLabel="Beranda">
  {isLoading?<p className="text-sm text-muted-foreground">Memuat kemajuan…</p>:error?<Card><CardContent className="p-5 text-sm text-destructive">Gagal memuat kemajuan. <button className="font-semibold" onClick={()=>refetch()}>Coba lagi</button></CardContent></Card>:<div className="space-y-4 pb-4">
   <div className="grid grid-cols-3 gap-2"><Metric icon={Trophy} label="XP" value={String(stats?.total_xp??0)}/><Metric icon={Flame} label="Rangkaian" value={`${stats?.current_streak??0} hari`}/><Metric icon={BarChart3} label="Latihan" value={String(attempts.length)}/></div>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">📊 Grafik pencapaian</CardTitle></CardHeader><CardContent><div className="flex h-44 items-end gap-5 border-b px-4">{[["Kanji",kanji],["Kotoba",kotoba],["Bunpō",bunpo]].map(([label,value])=><div key={String(label)} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><b className="text-[11px]">{value}</b><div className="w-full max-w-12 rounded-t-xl bg-primary/70" style={{height:`${Math.max(8,Number(value)/max*100)}%`}}/><span className="mb-1 text-[10px] text-muted-foreground">{label}</span></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-muted-foreground"><span>Materi selesai</span><span>{total} materi</span></div></CardContent></Card>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4 text-amber-500"/>Saran untukmu</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{suggestion}</p></CardContent></Card>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary"/>Tips belajar</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{tip}</p></CardContent></Card>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Materi yang sudah dipelajari</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-2"><Stat label="Kanji" value={kanji}/><Stat label="Kotoba" value={kotoba}/><Stat label="Bunpō" value={bunpo}/></CardContent></Card>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Riwayat latihan</CardTitle></CardHeader><CardContent className="space-y-2">{attempts.length===0?<p className="text-sm text-muted-foreground">Belum ada hasil latihan.</p>:attempts.slice(0,8).map(a=><div key={a.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-sm font-medium">{a.level??"—"} · {a.skill??"Latihan"}</p><p className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} benar</p></div><Badge>{a.score}%</Badge></div>)}</CardContent></Card>
   <Card className="rounded-2xl border-border/70 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Perlu diulang</CardTitle></CardHeader><CardContent>{weak.length===0?<p className="text-sm text-muted-foreground">Belum ada soal yang tercatat salah.</p>:<div className="space-y-2">{weak.slice(0,8).map((w,i)=><div key={`${i}-${w.question?.prompt}`} className="rounded-xl border p-3 text-sm"><Badge variant="outline" className="mr-2">{w.question?.skill??"latihan"}</Badge>{w.question?.prompt}</div>)}</div>}</CardContent></Card>
  </div>}
 </AppShell>;
}
function Metric({icon:Icon,label,value}:{icon:typeof Trophy;label:string;value:string}){return <Card className="rounded-xl border-border/70 shadow-sm"><CardContent className="flex items-center gap-2 p-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="size-4"/></div><div><p className="text-[10px] text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></CardContent></Card>}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-xl bg-muted/50 p-3 text-center"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>}
