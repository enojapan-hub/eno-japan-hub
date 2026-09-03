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
const DEFAULT_LIMIT = 10
const DISCOVERY_PAGE_SIZE = 50
const MAX_BATCH_SIZE = 10

function looksIndonesian(value: string | null | undefined) {
  if (!value) return false
  const text = value.trim().toLowerCase()
  if (!text) return false
  const markers = [' yang ', ' dan ', ' untuk ', ' dengan ', ' dari ', ' dalam ', ' adalah ', ' berarti ', ' digunakan ', ' dapat ', ' atau ', ' bisa ', ' tidak ', ' akan ', ' pada ', ' ke ', ' di ']
  return markers.some((marker) => ` ${text} `.includes(marker))
}

function looksJapanese(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value)
}

function decodeGoogleTranslation(payload: unknown) {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return ''
  return payload[0]
    .filter((part: unknown) => Array.isArray(part) && typeof part[0] === 'string')
    .map((part: unknown[]) => part[0] as string)
    .join('')
    .trim()
}

async function translateNaturalIndonesian(text: string, context: string) {
  // Internet-based translation provider. No OpenAI API key or quota is used.
  // Google Translate's public web endpoint is used only from the server so the
  // browser never contacts the provider directly.
  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', 'en')
  url.searchParams.set('tl', 'id')
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', text)

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'ENO-JAPAN/1.0' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Internet translation ${response.status}`)

  const data = await response.json()
  const translation = decodeGoogleTranslation(data)
  if (!translation) throw new Error(`Internet translation returned no result for ${context}`)

  return { translation, model: 'google-web-translate' }
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

          if (typeof currentTarget === 'string' && currentTarget.trim() && currentTarget.trim() !== sourceText.trim()) continue
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

async function translateOne(job: { type: string; table: string; id: string; sourceField: string; targetField: string; sourceText: string; context: string }) {
  const { data: queueRow } = await (supabaseAdmin as any)
    .from('content_translations')
    .select('id,attempts')
    .eq('source_type', job.type)
    .eq('source_id', job.id)
    .eq('source_field', job.sourceField)
    .eq('language', 'id')
    .maybeSingle()
  if (!queueRow) return { ...job, status: 'skipped' }

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
    return { ...job, status: 'completed' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await (supabaseAdmin as any).from('content_translations').update({
      status: nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      last_error: message.slice(0, 1000),
    }).eq('id', queueRow.id)
    return { ...job, status: 'failed', error: message }
  }
}

export async function runTranslationBatch(limit = DEFAULT_LIMIT) {
  const jobs = await discoverWork(Math.min(Math.max(limit, 1), MAX_BATCH_SIZE))
  const results = []

  for (let index = 0; index < jobs.length; index += MAX_BATCH_SIZE) {
    const chunk = jobs.slice(index, index + MAX_BATCH_SIZE)
    const chunkResults = await Promise.all(chunk.map(translateOne))
    results.push(...chunkResults)
  }

  return { stats: await getTranslationStats(), results }
}

export async function authorizeTranslationRequest(request: Request) {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : ''
  return token ? isAdmin(token) : false
}
