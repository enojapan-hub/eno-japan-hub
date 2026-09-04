import { createFileRoute } from "@tanstack/react-router";
import { Bell, BookOpenCheck, CircleHelp, Globe2, LogOut, MessageSquareText, Moon, RefreshCw, Shield, Sun, UserRound, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/_authenticated/pengaturan")({component:SettingsPage});
function Row({icon:Icon,title,desc,onClick,children}:{icon:any;title:string;desc:string;onClick?:()=>void;children?:React.ReactNode}){return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-muted/50 active:bg-muted"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4"/></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{title}</span><span className="block text-[9px] leading-4 text-muted-foreground">{desc}</span></span>{children}</button>}

type ModalKind="faq"|"about"|"guide"|null;
const modalCopy={
 guide:{title:"Instruksi & Panduan",sections:[
  ["Mulai belajar","Pilih level aktif sesuai kemampuanmu. Gunakan menu Target untuk mengikuti rencana harian dan menu Materi untuk belajar bebas."],
  ["Alur belajar","Pelajari Kanji, Kosakata, dan Bunpou terlebih dahulu. Lanjutkan ke Dokkai dan Choukai, lalu ukur kemampuan melalui Simulasi JLPT."],
  ["XP & Poin","Materi memberi XP. Poin didapat dari penyelesaian Target Harian dan Simulasi sesuai aturan akun."],
 ]},
 faq:{title:"FAQ",sections:[
  ["Apa itu ENO NIHONGO?","Platform belajar bahasa Jepang untuk N5 sampai N1 dengan materi, target adaptif, review, simulasi, dan pelacakan progres."],
  ["Apakah progres tersimpan?","Ya. Materi yang dipelajari, XP, streak, hasil simulasi, dan statistik akun disimpan pada akun pengguna."],
  ["Apa beda Free, Premium, dan Lifetime?","Free memiliki batas simulasi penuh 1 kali per bulan. Premium dapat mengulang simulasi penuh dan mengikuti ENO Monthly Exam. Lifetime membuka seluruh fitur membership."],
  ["Bagaimana melaporkan masalah?","Gunakan menu Masukan & Laporan Masalah. Email akan diarahkan ke enoinjapan@gmail.com."],
 ]},
 about:{title:"Tentang ENO NIHONGO",sections:[
  ["ENO NIHONGO","Aplikasi belajar bahasa Jepang yang dirancang agar pengguna tahu apa yang harus dipelajari hari ini, tetap konsisten, dan dapat mengukur kesiapan JLPT."],
  ["Fitur utama","Adaptive Study Planner, Kanji, Kosakata, Bunpou, Dokkai, Choukai, review, simulasi JLPT, leaderboard, XP, Poin, dan statistik belajar."],
  ["Tujuan","Membantu pembelajar dari level dasar sampai mahir belajar lebih terarah dengan antarmuka ringkas dan progres yang sinkron dengan akun."],
 ]},
} as const;

function InfoModal({kind,onClose}:{kind:Exclude<ModalKind,null>;onClose:()=>void}){const data=modalCopy[kind];return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 p-3 sm:items-center" onClick={onClose}><div role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()} className="max-h-[72vh] w-full max-w-md overflow-hidden rounded-[24px] border bg-background shadow-2xl"><div className="flex items-center gap-3 border-b px-4 py-3"><div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary"><CircleHelp className="size-4"/></div><h2 className="flex-1 text-[14px] font-bold">{data.title}</h2><button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-muted"><X className="size-4"/></button></div><div className="max-h-[58vh] space-y-2 overflow-y-auto p-3">{data.sections.map(([title,text])=><section key={title} className="rounded-2xl border bg-card p-3"><h3 className="text-[11px] font-bold">{title}</h3><p className="mt-1 text-[10px] leading-5 text-muted-foreground">{text}</p></section>)}</div></div></div>}

function SettingsPage(){
 const qc=useQueryClient();const[notifications,setNotifications]=useState(()=>localStorage.getItem("enonihongo-notifications")!=="off");const[dark,setDark]=useState(()=>localStorage.getItem("enonihongo-theme")==="dark");const[modal,setModal]=useState<ModalKind>(null);
 const toggleDark=(v:boolean)=>{setDark(v);document.documentElement.classList.toggle("dark",v);localStorage.setItem("enonihongo-theme",v?"dark":"light")};
 const toggleNotifications=(v:boolean)=>{setNotifications(v);localStorage.setItem("enonihongo-notifications",v?"on":"off")};
 const logout=async()=>{await supabase.auth.signOut();window.location.href="/auth"};
 return <AppShell title="Pengaturan" backTo="/profil" compact><div className="mx-auto max-w-md space-y-3">
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Aplikasi & Belajar</CardTitle></CardHeader><CardContent className="p-2"><Row icon={BookOpenCheck} title="Instruksi & Panduan" desc="Cara menggunakan ENO NIHONGO." onClick={()=>setModal("guide")}/><Row icon={BookOpenCheck} title="Target Belajar" desc="Atur level dan target belajar." onClick={()=>window.location.href="/edit-profil"}/><Row icon={Bell} title="Notifikasi" desc="Pemberitahuan target, simulasi, dan akun."><Switch checked={notifications} onCheckedChange={toggleNotifications}/></Row><Row icon={dark?Sun:Moon} title="Mode Tampilan" desc="Terang atau gelap."><Switch checked={dark} onCheckedChange={toggleDark}/></Row><Row icon={RefreshCw} title="Segarkan Data" desc="Ambil data terbaru dari server." onClick={()=>void qc.invalidateQueries().then(()=>toast.success("Data disegarkan."))}/></CardContent></Card>
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Akun</CardTitle></CardHeader><CardContent className="p-2"><Row icon={UserRound} title="Edit Profil" desc="Nama, foto, level bahasa, bahasa aplikasi, dan negara." onClick={()=>window.location.href="/edit-profil"}/><Row icon={Shield} title="Keamanan & Privasi" desc="Kelola informasi akun dengan aman."/><Row icon={LogOut} title="Keluar" desc="Keluar dari akun pada perangkat ini." onClick={()=>void logout()}/></CardContent></Card>
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Bantuan & Tentang</CardTitle></CardHeader><CardContent className="p-2"><Row icon={MessageSquareText} title="Masukan & Laporan Masalah" desc="Kirim laporan langsung ke ENO NIHONGO." onClick={()=>window.location.href="mailto:enoinjapan@gmail.com?subject=Laporan%20Masalah%20ENO%20NIHONGO"}/><Row icon={Users} title="Layanan Pelanggan" desc="enoinjapan@gmail.com" onClick={()=>window.location.href="mailto:enoinjapan@gmail.com"}/><Row icon={CircleHelp} title="FAQ" desc="Pertanyaan umum tentang aplikasi." onClick={()=>setModal("faq")}/><Row icon={Globe2} title="Tentang ENO NIHONGO" desc="Platform belajar bahasa Jepang dan persiapan JLPT." onClick={()=>setModal("about")}/></CardContent></Card>
  <p className="px-2 text-center text-[9px] text-muted-foreground">ENO NIHONGO V1</p>
 </div>{modal&&<InfoModal kind={modal} onClose={()=>setModal(null)}/>}</AppShell>;
}