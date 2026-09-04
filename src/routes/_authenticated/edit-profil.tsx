import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getMyAccount, updateMyAccount } from "@/lib/profile.functions";
import { COUNTRIES } from "@/lib/countries";

export const Route=createFileRoute("/_authenticated/edit-profil")({component:EditProfilePage});
const LEVELS=["N5","N4","N3","N2","N1"] as const;
function EditProfilePage(){
 const navigate=useNavigate();
 const account=useQuery({queryKey:["my-account-edit"],queryFn:()=>getMyAccount()});
 const[data,setData]=useState({display_name:"",target_level:"N5",ui_language:"id",country:"Indonesia"});
 useEffect(()=>{if(account.data?.profile)setData({display_name:account.data.profile.display_name??"",target_level:account.data.profile.target_level??"N5",ui_language:account.data.profile.ui_language??"id",country:account.data.profile.country??"Indonesia"})},[account.data]);
 const save=async()=>{if(data.display_name.trim().length<2)return toast.error("Nama minimal 2 karakter.");const s=account.data?.settings;if(!s)return;try{await updateMyAccount({data:{display_name:data.display_name.trim(),target_level:data.target_level as any,ui_language:data.ui_language as any,country:data.country,daily_kanji_target:s.daily_kanji_target??5,daily_vocab_target:s.daily_vocab_target??10,daily_grammar_target:s.daily_grammar_target??5,furigana_enabled:s.furigana_enabled??true,daily_reminder:s.daily_reminder??false}} as any);toast.success("Profil diperbarui.");await navigate({to:"/profil"});}catch(e){toast.error(e instanceof Error?e.message:"Gagal menyimpan profil.")}};
 return <AppShell title="Edit Profil" backTo="/profil" compact><div className="mx-auto max-w-md space-y-3"><Card className="rounded-2xl"><CardContent className="space-y-4 p-4">
  <div className="flex items-center gap-3"><div className="grid size-14 place-items-center overflow-hidden rounded-full border bg-muted">{account.data?.profile?.avatar_url?<img src={account.data.profile.avatar_url} alt="Foto profil" className="size-full object-cover"/>:<Camera className="size-5 text-muted-foreground"/>}</div><div><p className="text-[12px] font-semibold">Foto profil</p><Button asChild variant="outline" size="sm" className="mt-1 h-8 text-[10px]"><Link to="/profil-foto">Ganti foto</Link></Button></div></div>
  <label className="block text-[11px] font-semibold">Nama<Input className="mt-1" value={data.display_name} onChange={e=>setData(v=>({...v,display_name:e.target.value}))}/></label>
  <label className="block text-[11px] font-semibold">Level bahasa<select className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-[12px]" value={data.target_level} onChange={e=>setData(v=>({...v,target_level:e.target.value}))}>{LEVELS.map(x=><option key={x}>{x}</option>)}</select></label>
  <label className="block text-[11px] font-semibold">Bahasa aplikasi<select className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-[12px]" value={data.ui_language} onChange={e=>setData(v=>({...v,ui_language:e.target.value}))}><option value="id">Bahasa Indonesia</option><option value="en">English</option><option value="ja">日本語</option></select></label>
  <label className="block text-[11px] font-semibold">Negara<select className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-[12px]" value={data.country} onChange={e=>setData(v=>({...v,country:e.target.value}))}>{COUNTRIES.map(x=><option key={x}>{x}</option>)}</select></label>
  <Button className="w-full rounded-xl" onClick={()=>void save()}><Save className="mr-2 size-4"/>Simpan Profil</Button>
 </CardContent></Card></div></AppShell>;
}
