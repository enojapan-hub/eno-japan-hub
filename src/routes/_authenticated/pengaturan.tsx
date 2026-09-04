import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BookOpenCheck, CircleHelp, Globe2, LogOut, MessageSquareText, Moon, RefreshCw, Shield, Sun, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

export const Route=createFileRoute("/_authenticated/pengaturan")({component:SettingsPage});
function Row({icon:Icon,title,desc,onClick,children}:{icon:any;title:string;desc:string;onClick?:()=>void;children?:React.ReactNode}){return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted/50"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4"/></span><span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold">{title}</span><span className="block text-[9px] leading-4 text-muted-foreground">{desc}</span></span>{children}</button>}
function SettingsPage(){
 const qc=useQueryClient();const[notifications,setNotifications]=useState(()=>localStorage.getItem("enonihongo-notifications")!=="off");const[dark,setDark]=useState(()=>localStorage.getItem("enonihongo-theme")==="dark");
 const toggleDark=(v:boolean)=>{setDark(v);document.documentElement.classList.toggle("dark",v);localStorage.setItem("enonihongo-theme",v?"dark":"light")};
 const toggleNotifications=(v:boolean)=>{setNotifications(v);localStorage.setItem("enonihongo-notifications",v?"on":"off")};
 const logout=async()=>{await supabase.auth.signOut();window.location.href="/auth"};
 return <AppShell title="Pengaturan" backTo="/profil" compact><div className="mx-auto max-w-md space-y-3">
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Belajar & Tampilan</CardTitle></CardHeader><CardContent className="p-2"><Row icon={BookOpenCheck} title="Target Belajar" desc="Atur level dan target harian." onClick={()=>window.location.href="/edit-profil"}/><Row icon={Bell} title="Notifikasi" desc="Pemberitahuan target, simulasi, dan akun."><Switch checked={notifications} onCheckedChange={toggleNotifications}/></Row><Row icon={dark?Sun:Moon} title="Mode Tampilan" desc="Terang atau gelap."><Switch checked={dark} onCheckedChange={toggleDark}/></Row><Row icon={RefreshCw} title="Segarkan Data" desc="Ambil data terbaru dari server." onClick={()=>void qc.invalidateQueries().then(()=>toast.success("Data disegarkan."))}/></CardContent></Card>
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Akun</CardTitle></CardHeader><CardContent className="p-2"><Row icon={UserRound} title="Edit Profil" desc="Nama, foto, level bahasa, bahasa aplikasi, dan negara." onClick={()=>window.location.href="/edit-profil"}/><Row icon={Shield} title="Keamanan & Privasi" desc="Kelola informasi akun dengan aman."/><Row icon={LogOut} title="Keluar" desc="Keluar dari akun pada perangkat ini." onClick={()=>void logout()}/></CardContent></Card>
  <Card className="rounded-2xl"><CardHeader className="pb-1"><CardTitle className="text-xs">Bantuan</CardTitle></CardHeader><CardContent className="p-2"><Row icon={MessageSquareText} title="Masukan & Laporan Masalah" desc="Kirim laporan langsung ke ENO NIHONGO." onClick={()=>window.location.href="mailto:enoinjapan@gmail.com?subject=Laporan%20Masalah%20ENO%20NIHONGO"}/><Row icon={Users} title="Layanan Pelanggan" desc="enoinjapan@gmail.com" onClick={()=>window.location.href="mailto:enoinjapan@gmail.com"}/><Row icon={CircleHelp} title="FAQ" desc="Panduan penggunaan ENO NIHONGO."/><Row icon={Globe2} title="Tentang ENO NIHONGO" desc="Platform belajar bahasa Jepang dan persiapan JLPT."/></CardContent></Card>
  <p className="px-2 text-center text-[9px] text-muted-foreground">ENO NIHONGO V1</p>
 </div></AppShell>;
}
