import { createFileRoute } from '@tanstack/react-router'
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth'
import { runQuestionTranslationBatch } from '@/lib/question-translation.server'
import { runTranslationBatch } from '@/lib/translation.server'

export const Route = createFileRoute('/api/cron/translation')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const authError = await authenticateCronRequest(request)
        if (authError) return authError

        try {
          const questions = await runQuestionTranslationBatch(100)
          const kanji = questions.remaining === 0 ? await runTranslationBatch('kanji', 100) : null
          return Response.json({ ok: true, questions, kanji })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return Response.json({ ok: false, error: message }, { status: 500 })
        }
      },
    },
  },
})
