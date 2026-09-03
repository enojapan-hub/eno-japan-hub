import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock3, ListChecks } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { saveAttempt, type Level, type RunnerQuestion } from "@/lib/learn-queries";

export const Route = createFileRoute("/_authenticated/quiz/$slug")({ component: QuizRunner });

const fallbackQuestions: Record<Level, RunnerQuestion[]> = {
  N5: [
    { id: "fallback-n5-1", prompt: "私は毎朝七時（　）起きます。", prompt_note: null, choices: ["を", "に", "で", "が"], correct_index: 1, explanation_id: "Waktu tertentu menggunakan partikel に." },
    { id: "fallback-n5-2", prompt: "「食べます」の意味は何ですか。", prompt_note: null, choices: ["minum", "makan", "tidur", "pergi"], correct_index: 1, explanation_id: "食べます berarti makan." },
    { id: "fallback-n5-3", prompt: "「大きい」の反対は何ですか。", prompt_note: null, choices: ["小さい", "新しい", "古い", "高い"], correct_index: 0, explanation_id: "大きい berarti besar; lawannya adalah 小さい, kecil." },
    { id: "fallback-n5-4", prompt: "学校（　）行きます。", prompt_note: null, choices: ["を", "が", "へ", "と"], correct_index: 2, explanation_id: "へ menunjukkan arah atau tujuan." },
    { id: "fallback-n5-5", prompt: "「水」は何ですか。", prompt_note: null, choices: ["air", "nasi", "teh", "roti"], correct_index: 0, explanation_id: "水 berarti air." },
  ],
  N4: [
    { id: "fallback-n4-1", prompt: "日本へ行く（　）があります。", prompt_note: null, choices: ["つもり", "そう", "ながら", "ばかり"], correct_index: 0, explanation_id: "つもりです menyatakan niat atau rencana." },
    { id: "fallback-n4-2", prompt: "宿題をして（　）寝ました。", prompt_note: null, choices: ["から", "まで", "しか", "ほど"], correct_index: 0, explanation_id: "～てから berarti setelah melakukan sesuatu." },
    { id: "fallback-n4-3", prompt: "「便利」の意味に近いものはどれですか。", prompt_note: null, choices: ["praktis", "berbahaya", "sunyi", "mahal"], correct_index: 0, explanation_id: "便利 berarti praktis atau nyaman digunakan." },
    { id: "fallback-n4-4", prompt: "明日は雨が（　）と思います。", prompt_note: null, choices: ["降る", "降って", "降り", "降れば"], correct_index: 0, explanation_id: "Dalam pola ～と思います, bentuk biasa 降る digunakan." },
    { id: "fallback-n4-5", prompt: "この本は昨日（　）読みました。", prompt_note: null, choices: ["で", "を", "が", "に"], correct_index: 1, explanation_id: "Objek langsung dari 読みました ditandai dengan を." },
  ],
  N3: [
    { id: "fallback-n3-1", prompt: "健康のために、毎日運動する（　）しています。", prompt_note: null, choices: ["ように", "ことに", "ために", "ところに"], correct_index: 0, explanation_id: "～ようにしています menyatakan kebiasaan yang diusahakan." },
    { id: "fallback-n3-2", prompt: "電車が遅れた（　）、会議に間に合わなかった。", prompt_note: null, choices: ["おかげで", "せいで", "かわりに", "うちに"], correct_index: 1, explanation_id: "せいで digunakan untuk penyebab yang menghasilkan akibat negatif." },
    { id: "fallback-n3-3", prompt: "「十分」の読み方はどれですか。", prompt_note: null, choices: ["じゅうぶん", "じゅうふん", "じゅっぷん", "じゅぶん"], correct_index: 0, explanation_id: "Dalam arti cukup, 十分 dibaca じゅうぶん." },
    { id: "fallback-n3-4", prompt: "忙しい（　）、連絡してください。", prompt_note: null, choices: ["場合でも", "場合は", "ところを", "ものの"], correct_index: 1, explanation_id: "～場合は berarti jika atau dalam keadaan tertentu." },
    { id: "fallback-n3-5", prompt: "彼は日本語が話せる（　）、英語も話せます。", prompt_note: null, choices: ["だけでなく", "ほど", "しか", "わけで"], correct_index: 0, explanation_id: "だけでなく berarti bukan hanya... tetapi juga." },
  ],
  N2: [
    { id: "fallback-n2-1", prompt: "この問題は専門家で（　）難しい。", prompt_note: null, choices: ["さえ", "こそ", "ほど", "だけ"], correct_index: 0, explanation_id: "～でさえ berarti bahkan bagi... dan menekankan tingkat kesulitan." },
    { id: "fallback-n2-2", prompt: "彼の説明は納得できる（　）がある。", prompt_note: null, choices: ["もの", "わけ", "ところ", "こと"], correct_index: 1, explanation_id: "～わけがある menyatakan adanya alasan atau dasar yang masuk akal." },
    { id: "fallback-n2-3", prompt: "「著しい」の意味に最も近いものはどれですか。", prompt_note: null, choices: ["sangat mencolok", "biasa saja", "sangat lambat", "tidak jelas"], correct_index: 0, explanation_id: "著しい berarti sangat mencolok atau terlihat jelas perubahannya." },
    { id: "fallback-n2-4", prompt: "予想に（　）結果となった。", prompt_note: null, choices: ["反して", "沿って", "加えて", "比べて"], correct_index: 0, explanation_id: "～に反して berarti bertentangan dengan atau tidak sesuai dengan." },
    { id: "fallback-n2-5", prompt: "彼は責任者（　）仕事を任された。", prompt_note: null, choices: ["として", "に対して", "において", "にわたって"], correct_index: 0, explanation_id: "として berarti sebagai atau dalam kapasitas sebagai." },
  ],
  N1: [
    { id: "fallback-n1-1", prompt: "事情を考慮した（　）、今回は特別に認めることにした。", prompt_note: null, choices: ["上で", "末に", "ところで", "ばかりに"], correct_index: 0, explanation_id: "～上で menyatakan keputusan setelah mempertimbangkan sesuatu." },
    { id: "fallback-n1-2", prompt: "彼の発言は問題をさらに複雑に（　）ものだった。", prompt_note: null, choices: ["しかねない", "するまい", "したところで", "せざるを得ない"], correct_index: 0, explanation_id: "～しかねない menyatakan kemungkinan terjadinya sesuatu yang tidak diinginkan." },
    { id: "fallback-n1-3", prompt: "「顕著」の意味に最も近いものはどれですか。", prompt_note: null, choices: ["menonjol", "sementara", "tersembunyi", "sederhana"], correct_index: 0, explanation_id: "顕著 berarti menonjol atau sangat terlihat." },
    { id: "fallback-n1-4", prompt: "努力した（　）、結果が出なかった。", prompt_note: null, choices: ["にもかかわらず", "に先立って", "をめぐって", "に基づいて"], correct_index: 0, explanation_id: "にもかかわらず berarti meskipun demikian atau walaupun." },
    { id: "fallback-n1-5", prompt: "この計画は実現する（　）ない。", prompt_note: null, choices: ["に至って", "にほかなら", "にすぎ", "わけでは"], correct_index: 0, explanation_id: "に至って～ない menyatakan bahwa sesuatu belum sampai pada tahap tertentu; pilihan ini melengkapi pola yang dimaksud." },
  ],
};

async function loadPracticeQuestions(level: Level) {
  const { data, error } = await supabase.from("questions").select("id, prompt, prompt_note, choices, correct_index, explanation_id").eq("is_published", true).eq("level", level).limit(10);
  if (error || !data?.length) return fallbackQuestions[level];
  return data.map(q => ({ id: String(q.id), prompt: String(q.prompt), prompt_note: q.prompt_note ?? null, choices: Array.isArray(q.choices) ? q.choices.map(String) : [], correct_index: Number(q.correct_index), explanation_id: q.explanation_id ?? null })).filter(q => q.choices.length === 4 && q.correct_index >= 0 && q.correct_index < 4);
}

function QuizRunner() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const level = slug.startsWith("latihan-") ? slug.replace("latihan-", "").toUpperCase() as Level : null;
  const { data: questions = [], isLoading, error } = useQuery({ queryKey: ["practice-quiz", level], enabled: !!level && ["N5", "N4", "N3", "N2", "N1"].includes(level), queryFn: () => loadPracticeQuestions(level!) });
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const current = questions[index];
  const score = useMemo(() => questions.reduce((n, q) => n + (answers[q.id] === q.correct_index ? 1 : 0), 0), [questions, answers]);

  async function finish() {
    if (finished || !questions.length) return;
    setFinished(true); setSaving(true);
    try { await saveAttempt({ quizId: null, level, skill: null, total: questions.length, correct: score, durationSeconds: Math.round((Date.now() - startedAt) / 1000), answers: questions.map(q => ({ questionId: q.id, selectedIndex: answers[q.id] ?? -1, isCorrect: answers[q.id] === q.correct_index })) }); } finally { setSaving(false); }
  }

  if (!level) return <AppShell title="Quiz"><Card><CardContent className="py-10 text-center"><p className="text-sm font-semibold">Quiz tidak ditemukan</p><Button className="mt-4" asChild size="sm"><Link to="/quiz">Kembali ke Quiz</Link></Button></CardContent></Card></AppShell>;
  if (isLoading) return <AppShell title={`Quiz ${level}`}><p className="text-xs text-muted-foreground">Menyiapkan soal…</p></AppShell>;
  if (error || !questions.length) return <AppShell title={`Quiz ${level}`}><Card><CardContent className="py-10 text-center"><p className="text-sm font-semibold">Soal belum tersedia</p><p className="mt-1 text-xs text-muted-foreground">Coba lagi beberapa saat lagi.</p><Button className="mt-4" asChild size="sm"><Link to="/quiz">Kembali</Link></Button></CardContent></Card></AppShell>;

  if (finished) return <AppShell title={`Hasil Quiz ${level}`}>
    <div className="mx-auto max-w-2xl space-y-4"><Card className="border-border/70 shadow-none"><CardContent className="p-6 text-center"><div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Check className="size-7" /></div><p className="text-xs text-muted-foreground">Skor kamu</p><div className="mt-1 text-4xl font-semibold">{score}/{questions.length}</div><Badge className="mt-2">{Math.round(score / questions.length * 100)}%</Badge><p className="mt-3 text-xs text-muted-foreground">{saving ? "Menyimpan hasil…" : "Hasil tersimpan jika kamu sudah login."}</p></CardContent></Card><Card className="shadow-none"><CardContent className="p-4"><h2 className="text-sm font-semibold">Pembahasan</h2><div className="mt-3 space-y-3">{questions.map((q, i) => <div key={q.id} className="rounded-xl border p-3"><p className="text-xs font-medium">{i + 1}. {q.prompt}</p><p className="mt-1 text-[11px] text-muted-foreground">Jawaban: {q.choices[q.correct_index]}</p><p className="mt-1 text-[11px] leading-5 text-muted-foreground">{q.explanation_id ?? "Pembahasan tersedia pada materi terkait."}</p></div>)}</div></CardContent></Card><div className="flex gap-2"><Button className="flex-1" onClick={() => navigate({ to: "/quiz/$slug", params: { slug } })}>Ulangi</Button><Button className="flex-1" variant="outline" asChild><Link to="/quiz">Daftar Quiz</Link></Button></div></div>
  </AppShell>;

  const progress = Math.round((index + 1) / questions.length * 100);
  return <AppShell title={`Quiz ${level}`} description="Pilih satu jawaban yang paling tepat.">
    <div className="mx-auto max-w-2xl pb-6"><div className="mb-4 flex items-center justify-between"><Button variant="ghost" size="sm" asChild><Link to="/quiz"><ArrowLeft className="mr-1.5 size-4" />Keluar</Link></Button><span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><ListChecks className="size-3.5" />{Object.keys(answers).length}/{questions.length}</span></div><div className="mb-4"><div className="mb-1.5 flex justify-between text-[10px] text-muted-foreground"><span>Soal {index + 1} dari {questions.length}</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></div><Card className="border-border/70 shadow-none"><CardContent className="p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><Badge>{level}</Badge><span className="text-[10px] text-muted-foreground">Pilih satu</span></div><h2 className="text-base font-semibold leading-7">{current.prompt}</h2>{current.prompt_note && <p className="mt-2 text-xs text-muted-foreground">{current.prompt_note}</p>}<div className="mt-5 space-y-2">{current.choices.map((choice, i) => { const selected = answers[current.id] === i; return <button key={i} type="button" className={`flex min-h-12 w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-xs transition ${selected ? "border-primary bg-primary/5" : "border-border/70 hover:bg-muted/50"}`} onClick={() => setAnswers(a => ({ ...a, [current.id]: i }))}><span className={`grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{String.fromCharCode(65 + i)}</span><span>{choice}</span></button>; })}</div><div className="mt-6 flex items-center justify-between gap-2"><Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}><ChevronLeft className="mr-1 size-4" />Sebelumnya</Button>{index === questions.length - 1 ? <Button size="sm" disabled={answers[current.id] === undefined} onClick={() => void finish()}>Selesai</Button> : <Button size="sm" disabled={answers[current.id] === undefined} onClick={() => setIndex(i => i + 1)}>Berikutnya<ChevronRight className="ml-1 size-4" /></Button>}</div></CardContent></Card></div>
  </AppShell>;
}
