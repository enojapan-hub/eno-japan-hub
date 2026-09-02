import { createFileRoute } from '@tanstack/react-router'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

const routeSchema = {
  type: 'object',
  properties: {
    examples: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          jp: { type: 'string' },
          id: { type: 'string' },
          reading: { type: 'string' },
        },
        required: ['jp', 'id', 'reading'],
        additionalProperties: false,
      },
    },
  },
  required: ['examples'],
  additionalProperties: false,
} as const

async function generateExamples(vocab: Record<string, unknown>) {
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
          content: 'Anda adalah editor materi JLPT ENO JAPAN. Buat tepat 3 contoh kalimat bahasa Jepang yang natural dan benar-benar menggunakan kosakata target. Sesuaikan tingkat JLPT. Berikan terjemahan Bahasa Indonesia yang natural, bukan terjemahan kata per kata. Contoh harus berbeda konteks dan berguna untuk pelajar. Jangan membuat kalimat aneh atau terlalu kaku. Reading harus berupa cara baca hiragana untuk kalimat Jepang.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            target: vocab.term,
            reading: vocab.reading,
            meaning: vocab.meaning_id,
            partOfSpeech: vocab.part_of_speech,
            level: vocab.level,
          }),
        },
      ],
      text: { format: { type: 'json_schema', name: 'kotoba_examples', strict: true, schema: routeSchema } },
    }),
  })

  if (!response.ok) throw new Error(`OpenAI ${response.status}: ${(await response.text()).slice(0, 500)}`)
  const data = await response.json()
  const outputText = data.output?.flatMap((item: any) => item.content ?? [])?.find((item: any) => item.type === 'output_text')?.text
  if (!outputText) throw new Error('OpenAI returned no output text')
  const parsed = JSON.parse(outputText)
  if (!Array.isArray(parsed.examples) || parsed.examples.length < 3) throw new Error('Invalid examples response')
  return parsed.examples.slice(0, 3).map((x: any) => ({ jp: String(x.jp), id: String(x.id), reading: String(x.reading) }))
}

export const Route = createFileRoute('/api/kotoba/examples')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get('authorization')
        const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
        if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: auth, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !auth.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json().catch(() => null) as { id?: string } | null
        if (!body?.id) return Response.json({ error: 'Missing vocabulary id' }, { status: 400 })

        const { data: vocab, error } = await (supabaseAdmin as any)
          .from('vocabulary')
          .select('id, term, reading, meaning_id, part_of_speech, level, examples')
          .eq('id', body.id)
          .eq('is_published', true)
          .maybeSingle()
        if (error) return Response.json({ error: error.message }, { status: 500 })
        if (!vocab) return Response.json({ error: 'Vocabulary not found' }, { status: 404 })

        const existing = Array.isArray(vocab.examples) ? vocab.examples : []
        if (existing.length >= 3) return Response.json({ examples: existing.slice(0, 3), generated: false })

        const examples = await generateExamples(vocab)
        const { error: updateError } = await (supabaseAdmin as any).from('vocabulary').update({ examples }).eq('id', body.id)
        if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
        return Response.json({ examples, generated: true })
      },
    },
  },
})
