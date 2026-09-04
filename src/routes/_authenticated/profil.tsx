import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Edit3, Flame, Globe2, Settings, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyAccount } from "@/lib/profile.functions";
import { fetchLeaderboard } from "@/lib/leaderboard";
import { fetchMyProgress } from "@/lib/learn-queries";

export const Route=createFileRoute("/_authenticated/profil")({component:ProfilePage});
function ProfilePage(){
 const account=useQuery({queryKey:["my-account-profile"],queryFn:()=>getMyAccount()});
 const leaderboard=useQuery({queryKey:["leaderboard",100],queryFn:()=>fetchLeaderboard(100)});
 const progress=useQuery({queryKey:["my-progress"],queryFn:fetchMyProgress});
 if(account.isLoading)return <AppShell title="Profil"><p className="py-10 text-center text-xs text-muted-foreground">Memuat profil…</p></AppShell>;
 const p=account.data?.profile;const me=leaderboard.data?.find(x=>x.userId===p?.id);const rows=(progress.data?.progress??[]) as Array<{item_type:string;status:string}>;const mastered=rows.filter(x=>x.status==="mastered");
 const name=p?.display_name?.trim()||"Pembelajar ENO NIHONGO";const avatar=p?.avatar_url??null;const country=p?.country??"Belum diatur";const plan=p?.plan==="lifetime"?"Lifetime":p?.plan==="premium"?"Premium":"Free";
 return <AppShell title="Profil" compact><div className="mx-auto max-w-md space-y-3">
  <Card className="overflow-hidden rounded-3xl"><div className="h-24 bg-primary/10"/><CardContent className="relative p-5 pt-10"><div className="absolute -top-9 left-5 size-20 overflow-hidden rounded-full border-4 border-background bg-muted">{avatar?<img src={avatar} alt="Foto profil" className="size-full object-cover"/>:<div className="grid size-full place-items-center text-2xl font-bold text-primary">{name[0]}</div>}</div><div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-bold">{name}</h1><p className="mt-1 text-[10px] text-muted-foreground">JLPT {p?.target_level??"N5"} · {country}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold text-primary">{plan}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><Stat icon={Zap} label="XP" value={(me?.xp??0).toLocaleString("id-ID")}/><Stat icon={Trophy} label="Materi" value={String(mastered.length)}/><Stat icon={Flame} label="Streak" value={`${me?.streak??0} hari`}/></div><div className="mt-4 grid grid-cols-2 gap-2"><Button asChild className="rounded-xl"><Link to="/edit-profil"><Edit3 className="mr-2 size-4"/>Edit Profil</Link></Button><Button asChild variant="outline" className="rounded-xl"><Link to="/profil-foto"><Camera className="mr-2 size-4"/>Foto</Link></Button></div></CardContent></Card>
  <Card className="rounded-2xl"><CardContent className="space-y-2 p-3"><Row icon={Globe2} label="Negara" value={country}/><Row icon={Globe2} label="Bahasa aplikasi" value={p?.ui_language==="en"?"English":p?.ui_language==="ja"?"日本語":"Bahasa Indonesia"}/><Row icon={Trophy} label="Level bahasa" value={p?.target_level??"N5"}/></CardContent></Card>
  <Button asChild variant="outline" className="w-full rounded-xl"><Link to="/pengaturan"><Settings className="mr-2 size-4"/>Pengaturan</Link></Button>
 </div></AppShell>;
}
function Stat({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <div className="rounded-2xl border bg-card p-3 text-center"><Icon className="mx-auto size-4 text-primary"/><p className="mt-1 text-[12px] font-bold">{value}</p><p className="text-[8px] text-muted-foreground">{label}</p></div>}
function Row({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <div className="flex items-center gap-3 rounded-xl px-2 py-2"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4"/></span><span className="flex-1 text-[11px] font-semibold">{label}</span><span className="text-[10px] text-muted-foreground">{value}</span></div>}
