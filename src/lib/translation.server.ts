import { supabaseAdmin } from './supabase.server'

type SourceType = 'kanji' | 'vocabulary' | 'grammar' | 'reading'

type TranslationResult = {
  translation: string
  provider: 'gemini'
  model: string
}

const MAX_ATTEMPTS = 3
const DEFAULT_LIMIT = 10
const DISCOVERY_PAGE_SIZE = 50
const MAX_BATCH_SIZE = 3

function looksIndonesian(text: string | null | undefined) {
  if (!text) return false
  const value = text.trim().toLowerCase()
  if (!value) return false
  return /\b(yang|dan|dengan|untuk|dari|dalam|adalah|artinya|kata|contoh|penjelasan|membuat|menjadi|atau|sebagai|karena|jika|ketika|sudah|belum)\b/.test(value)
}

function looksJapanese(text: string | null | undefined) {
  if (!text) return false
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text)
}

function extractJsonTranslation(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (typeof parsed.translation === 'string') return parsed.translation.trim()
  } catch {
    const match = cleaned.match(/"translation"\s*:\s*"((?:\\.|[^"\\])*)"/s)
    if (match) {
      try {
        return JSON.parse(`"${match[1]}"`).trim()
      } catch {
        return match[1].trim()
      }
    }
  }
  return cleaned
}

const TRANSLATION_SYSTEM = `Anda adalah editor materi pembelajaran bahasa Jepang ENO JAPAN. Terjemahkan ke Bahasa Indonesia yang natural, ringkas, jelas, dan mudah dipahami pelajar JLPT. Jangan menerjemahkan kata per kata secara kaku. Pertahankan istilah Jepang, kanji, kana, contoh bahasa Jepang, angka, nama, dan simbol apa adanya jika muncul. Jangan menambahkan informasi yang tidak ada. Kembalikan hanya JSON dengan field translation.`

async function translateWithGemini(text: string, context: string): Promise<TranslationResult> {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_TRANSLATION_MODEL || 'gemini-2.5-flash-lite'
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: TRANSLATION_SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `Konteks materi: ${context}\n\nTeks sumber:\n${text}` }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: { translation: { type: 'STRING' } },
          required: ['translation'],
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Gemini ${response.status}: ${body.slice(0, 500)}`)
  }

  const data = await response.json()
  const raw = data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text || '').filter(Boolean).join('') || ''
  const translation = extractJsonTranslation(raw)
  if (!translation) throw new Error('Gemini returned empty translation')
  return { translation, provider: 'gemini', model }
}

async function translateNaturalIndonesian(text: string, context: string): Promise<TranslationResult> {
  return translateWithGemini(text, context)
}

async function isAdmin(userId: string) {
  const { data } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle()
  return data?.role === 'admin'
}

export async function getTranslationStats() {
  const [kanji, vocabulary, grammar, reading] = await Promise.all([
    supabaseAdmin.from('kanji').select('id, meaning_en, meaning_id', { count: 'exact', head: true }).eq('is_published', true),
    supabaseAdmin.from('vocabulary').select('id, meaning_en, meaning_id', { count: 'exact', head: true }).eq('is_published', true),
    supabaseAdmin.from('grammar_points').select('id, meaning_en, meaning_id', { count: 'exact', head: true }).eq('is_published', true),
    supabaseAdmin.from('reading_passages').select('id, translation_en, translation_id', { count: 'exact', head: true }).eq('is_published', true),
  ])
  return {
    kanji: kanji.count || 0,
    vocabulary: vocabulary.count || 0,
    grammar: grammar.count || 0,
    reading: reading.count || 0,
  }
}

async function discoverWork(sourceType: SourceType, limit: number) {
  const table = sourceType === 'kanji' ? 'kanji' : sourceType === 'vocabulary' ? 'vocabulary' : sourceType === 'grammar' ? 'grammar_points' : 'reading_passages'
  const sourceColumn = sourceType === 'reading' ? 'translation_en' : 'meaning_en'
  const targetColumn = sourceType === 'reading' ? 'translation_id' : 'meaning_id'
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(`id, ${sourceColumn}, ${targetColumn}`)
    .eq('is_published', true)
    .not(sourceColumn, 'is', null)
    .limit(Math.min(Math.max(limit, 1), DISCOVERY_PAGE_SIZE))
  if (error) throw error
  return (data || []).filter((row: any) => {
    const source = row[sourceColumn] as string | null
    const target = row[targetColumn] as string | null
    if (!source || !source.trim()) return false
    if (!target || !target.trim()) return true
    if (target.trim() === source.trim() && !looksJapanese(source)) return true
    return false
  })
}

async function translateOne(sourceType: SourceType, row: any): Promise<TranslationResult> {
  const table = sourceType === 'kanji' ? 'kanji' : sourceType === 'vocabulary' ? 'vocabulary' : sourceType === 'grammar' ? 'grammar_points' : 'reading_passages'
  const sourceColumn = sourceType === 'reading' ? 'translation_en' : 'meaning_en'
  const targetColumn = sourceType === 'reading' ? 'translation_id' : 'meaning_id'
  const context = sourceType === 'kanji' ? 'Kanji JLPT' : sourceType === 'vocabulary' ? 'Kosakata JLPT' : sourceType === 'grammar' ? 'Bunpou JLPT' : 'Dokkai JLPT'
  const result = await translateNaturalIndonesian(row[sourceColumn], context)
  const { error } = await supabaseAdmin.from(table).update({ [targetColumn]: result.translation }).eq('id', row.id)
  if (error) throw error
  return result
}

export async function runTranslationBatch(sourceType: SourceType, requestedLimit = DEFAULT_LIMIT) {
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_BATCH_SIZE)
  const rows = await discoverWork(sourceType, limit)
  const results: Array<{ id: string; translation: string; provider: string; model: string }> = []
  for (const row of rows.slice(0, limit)) {
    let lastError: unknown
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const result = await translateOne(sourceType, row)
        results.push({ id: row.id, translation: result.translation, provider: result.provider, model: result.model })
        lastError = undefined
        break
      } catch (error) {
        lastError = error
        if (attempt < MAX_ATTEMPTS) await new Promise(resolve => setTimeout(resolve, attempt * 500))
      }
    }
    if (lastError) throw lastError
  }
  return { sourceType, requested: limit, processed: results.length, results }
}

export async function authorizeTranslationRequest(userId: string) {
  if (!userId) throw new Error('Unauthorized')
  if (!(await isAdmin(userId))) throw new Error('Admin access required')
  return true
}
