import { supabaseAdmin } from '@/integrations/supabase/client.server'

const SOURCE_DEFINITIONS = [
  { type: 'kanji', table: 'kanji', fields: [{ source: 'meaning_en', target: 'meaning_id' }] },
  { type: 'vocab', table: 'vocabulary', fields: [{ source: 'meaning_en', target: 'meaning_id' }] },
  { type: 'grammar', table: 'grammar_points', fields: [
    { source: 'meaning_en', target: 'meaning_id' },
    { source: 'explanation_en', target: 'explanation_id' },
  ] },
  { type: 'reading', table: 'reading_passages', fields: [{ source: 'translation_en', target: 'translation_id' }] },
] as const

const MAX_ATTEMPTS = 3
const DEFAULT_LIMIT = 5
const DISCOVERY_PAGE_SIZE = 50

function looksIndonesian(value: string | null | undefined) {
  if (!value) return false
  const text = value.trim().toLowerCase()
  if (!text) return false
  const markers = [' yang ', ' dan ', ' untuk ', ' dengan ', ' dari ', ' dalam ', ' adalah ', ' berarti ', ' digunakan ', ' dapat ', ' atau ']
  return markers.some((marker) => ` ${text} `.includes(marker))
}

function looksJapanese(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value)
}

async function translateNaturalIndonesian(text: string, context: string) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_TRANSLATION_MODEL
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  if (!model) throw new Error('Missing OPENAI_TRANSLATION_MODEL')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      store: false,
      input: [
        {
          role: 'system',
          content: 'Anda adalah editor materi pembelajaran bahasa Jepang ENO JAPAN. Terjemahkan ke Bahasa Indonesia yang natural, ringkas, jelas, dan mudah dipahami pelajar JLPT. Jangan menerjemahkan kata per kata secara kaku. Pertahankan istilah Jepang, kanji, kana, contoh bahasa Jepang, angka, nama, dan simbol apa adanya jika muncul. Jangan menambahkan informasi yang tidak ada.',
        },
        { role: 'user', content: `Konteks materi: ${context}\n\nTeks sumber:\n${text}` },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'translation',
          strict: true,
          schema: {
            type: 'object',
            properties: { translation: { type: 'string' } },
            required: ['translation'],
            additionalProperties: false,
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI ${response.status}: ${detail.slice(0, 500)}`)
  }

  const data = await response.json()
  const outputText = data.output?.flatMap((item: any) => item.content ?? [])?.find((item: any) => item.type === 'output_text')?.text
  if (!outputText) throw new Error('OpenAI returned no output text')
  const parsed = JSON.parse(outputText)
  if (!parsed.translation || typeof parsed.translation !== 'string') throw new Error('Invalid translation response')
  return { translation: parsed.translation.trim(), model }
}

async function isAdmin(accessToken: string) {
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
  if (userError || !userData.user) return false
  const { data, error } = await (supabaseAdmin as any)
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .in('role', ['admin', 'teacher'])
    .limit(1)
  return !error && !!data?.length
}

export async function getTranslationStats() {
  const { data, error } = await (supabaseAdmin as any).from('content_translations').select('status')
  if (error) throw error
  const stats = { total: data?.length ?? 0, pending: 0, processing: 0, completed: 0, failed: 0 }
  for (const row of data ?? []) if (row.status in stats) (stats as any)[row.status]++
  return stats
}

async function discoverWork(limit: number) {
  const jobs: Array<{ type: string; table: string; id: string; sourceField: string; targetField: string; sourceText: string; context: string }> = []

  for (const definition of SOURCE_DEFINITIONS) {
    if (jobs.length >= limit) break

    for (const fields of definition.fields) {
      if (jobs.length >= limit) break

      // Paginate through source rows so completed/Indonesian rows at the beginning
      // cannot permanently block the rest of the dataset from being discovered.
      for (let offset = 0; jobs.length < limit; offset += DISCOVERY_PAGE_SIZE) {
        const { data, error } = await (supabaseAdmin as any)
          .from(definition.table)
          .select(`id,${fields.source},${fields.target}`)
          .not(fields.source, 'is', null)
          .range(offset, offset + DISCOVERY_PAGE_SIZE - 1)
        if (error || !data?.length) break

        for (const row of data) {
          if (jobs.length >= limit) break
          const sourceText = row[fields.source]
          const currentTarget = row[fields.target]
          if (typeof sourceText !== 'string' || !sourceText.trim()) continue
          if (looksIndonesian(currentTarget)) continue
          if (looksJapanese(currentTarget ?? '') && currentTarget !== sourceText) continue

          const { data: existing } = await (supabaseAdmin as any)
            .from('content_translations')
            .select('id,status,attempts,source_text')
            .eq('source_type', definition.type)
            .eq('source_id', row.id)
            .eq('source_field', fields.source)
            .eq('language', 'id')
            .maybeSingle()

          if (existing?.status === 'completed' && existing.source_text === sourceText) continue
          if (existing?.attempts >= MAX_ATTEMPTS && existing?.status === 'failed') continue

          await (supabaseAdmin as any).from('content_translations').upsert({
            id: existing?.id,
            source_type: definition.type,
            source_id: row.id,
            source_field: fields.source,
            source_text: sourceText,
            status: 'pending',
          }, { onConflict: 'source_type,source_id,source_field,language' })

          jobs.push({ type: definition.type, table: definition.table, id: row.id, sourceField: fields.source, targetField: fields.target, sourceText, context: definition.type })
        }

        if (data.length < DISCOVERY_PAGE_SIZE) break
      }
    }
  }
  return jobs
}

export async function runTranslationBatch(limit = DEFAULT_LIMIT) {
  const jobs = await discoverWork(Math.min(Math.max(limit, 1), 10))
  const results = []

  for (const job of jobs) {
    const { data: queueRow } = await (supabaseAdmin as any)
      .from('content_translations')
      .select('id,attempts')
      .eq('source_type', job.type)
      .eq('source_id', job.id)
      .eq('source_field', job.sourceField)
      .eq('language', 'id')
      .maybeSingle()
    if (!queueRow) continue

    const nextAttempts = (queueRow.attempts ?? 0) + 1
    await (supabaseAdmin as any).from('content_translations').update({ status: 'processing', attempts: nextAttempts, last_error: null }).eq('id', queueRow.id)

    try {
      const translated = await translateNaturalIndonesian(job.sourceText, job.context)
      const { error: updateError } = await (supabaseAdmin as any)
        .from(job.table)
        .update({ [job.targetField]: translated.translation })
        .eq('id', job.id)
      if (updateError) throw updateError

      await (supabaseAdmin as any).from('content_translations').update({
        translated_text: translated.translation,
        status: 'completed',
        model: translated.model,
        translated_at: new Date().toISOString(),
        last_error: null,
      }).eq('id', queueRow.id)
      results.push({ ...job, status: 'completed' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await (supabaseAdmin as any).from('content_translations').update({
        status: nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
        last_error: message.slice(0, 1000),
      }).eq('id', queueRow.id)
      results.push({ ...job, status: 'failed', error: message })
    }
  }

  return { stats: await getTranslationStats(), results }
}

export async function authorizeTranslationRequest(request: Request) {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  return token ? isAdmin(token) : false
}
