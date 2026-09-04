import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES } from "@/lib/countries";

export const Route=createFileRoute("/_authenticated/onboarding")({component:OnboardingPage});
const LEVELS=["N5","N4","N3","N2","N1"] as const;
function plusMonths(months:number){const d=new Date();d.setMonth(d.getMonth()+months);return d.toISOString().slice(0,10)}
function OnboardingPage(){
 const navigate=useNavigate();const[name,setName]=useState("");const[level,setLevel]=useState("N5");const[country,setCountry]=useState("Indonesia");const[saving,setSaving]=useState(false);
 useEffect(()=>{void supabase.auth.getUser().then(({data})=>{const m=data.user?.user_metadata??{};setName(String(m.full_name??m.name??""))})},[]);
 const save=async()=>{if(name.trim().length<2)return toast.error("Nama minimal 2 karakter.");setSaving(true);try{const{data:auth,error:authError}=await supabase.auth.getUser();if(authError||!auth.user)throw new Error("Sesi tidak ditemukan.");const{error}=await supabase.from("profiles").update({display_name:name.trim(),target_level:level as any,country,onboarding_completed:true}).eq("id",auth.user.id);if(error)throw error;await (supabase as any).rpc("create_or_replace_study_plan",{p_target_level:level,p_target_date:plusMonths(3),p_daily_minutes:45});await (supabase as any).rpc("generate_daily_study_tasks",{});await supabase.auth.updateUser({data:{display_name:name.trim(),onboarding_completed:true}});toast.success("Akun siap digunakan.");await navigate({to:"/dashboard",replace:true});}catch(e){toast.error(e instanceof Error?e.message:"Gagal menyimpan akun.")}finally{setSaving(false)}};
 return <AppShell title="Siapkan Akun" compact><div className="mx-auto max-w-md"><Card className="rounded-2xl"><CardContent className="space-y-4 p-5"><div><h1 className="text-lg font-bold">Selamat datang di ENO NIHONGO</h1><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Sebelum belajar, isi data dasar agar target dan rekomendasi sesuai dengan akunmu.</p></div><label className="block text-[11px] font-semibold">Nama<Input className="mt-1" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama pengguna"/></label><label className="block text-[11px] font-semibold">Level bahasa<select className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-[12px]" value={level} onChange={e=>setLevel(e.target.value)}>{LEVELS.map(x=><option key={x}>{x}</option>)}</select></label><label className="block text-[11px] font-semibold">Negara<select className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-[12px]" value={country} onChange={e=>setCountry(e.target.value)}>{COUNTRIES.map(x=><option key={x}>{x}</option>)}</select></label><p className="rounded-xl bg-primary/5 p-3 text-[10px] leading-4 text-muted-foreground">Target awal dibuat untuk 3 bulan dan dapat diubah lagi dari profil.</p><Button className="w-full rounded-xl" disabled={saving} onClick={()=>void save()}>{saving?"Menyimpan…":"Mulai Belajar"}</Button></CardContent></Card></div></AppShell>;
}
