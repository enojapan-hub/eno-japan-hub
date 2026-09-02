import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const schema = {
  type: 'object',
  properties: {
    examples: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'object', properties: { jp: { type: 'string' }, id: { type: 'string' }, reading: { type: 'string' } }, required: ['jp','id','reading'], additionalProperties: false } },
    synonyms: { type: 'array', items: { type: 'string' } },
    antonyms: { type: 'array', items: { type: 'string' } },
    explanation: { type: 'string' },
  },
  required: ['examples','synonyms','antonyms','explanation'], additionalProperties: false,
} as const

async function generateContent(grammar: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_TRANSLATION_MODEL
  if (!apiKey || !model) throw new Error('OpenAI configuration is missing')
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model, store: false,
      input: [
        { role: 'system', content: 'Anda adalah editor materi JLPT ENO JAPAN. Buat tepat 3 contoh kalimat Jepang yang natural untuk pola tata bahasa yang diberikan, sesuai level. Setiap contoh wajib memiliki reading hiragana seluruh kalimat dan terjemahan Indonesia natural. Jelaskan penggunaan pola secara spesifik. Berikan 2-4 sinonim/pola terkait bila benar-benar relevan dan 1-4 antonim atau pola berlawanan bila ada; jika tidak ada yang tepat, kembalikan array kosong. Jangan membuat relasi yang salah hanya agar daftar terisi.' },
        { role: 'user', content: JSON.stringify({ pattern: grammar.pattern, meaning: grammar.meaning_id, structure: grammar.structure, level: grammar.level }) },
      ],
      text: { format: { type: 'json_schema', name: 'bunpo_content', strict: true, schema } },
    }),
  })
  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0,500)}`)
  const data = await response.json()
  const outputText = data.output?.flatMap((item: any) => item.content ?? [])?.find((item: any) => item.type === 'output_text')?.text
  if (!outputText) throw new Error('OpenAI returned no output text')
  const parsed = JSON.parse(outputText)
  if (!Array.isArray(parsed.examples) || parsed.examples.length !== 3) throw new Error('Invalid examples')
  return { examples: parsed.examples, synonyms: parsed.synonyms ?? [], antonyms: parsed.antonyms ?? [], explanation: String(parsed.explanation) }
}

export const Route = createFileRoute('/api/bunpo/examples')({ server: { handlers: { POST: async ({ request }) => {
  const authorization = request.headers.get('authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id) return Response.json({ error: 'Missing grammar id' }, { status: 400 })
  const { data: grammar, error } = await (supabaseAdmin as any).from('grammar_points').select('id, pattern, meaning_id, structure, level, examples').eq('id', body.id).eq('is_published', true).maybeSingle()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!grammar) return Response.json({ error: 'Grammar not found' }, { status: 404 })
  const existing = Array.isArray(grammar.examples) ? grammar.examples : []
  if (existing.length >= 3) return Response.json({ examples: existing.slice(0,3), synonyms: [], antonyms: [], generated: false })
  try {
    const content = await generateContent(grammar)
    await (supabaseAdmin as any).from('grammar_points').update({ examples: content.examples, explanation_id: content.explanation }).eq('id', body.id)
    return Response.json({ ...content, generated: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 502 })
  }
} } } })
