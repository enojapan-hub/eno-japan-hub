import { createFileRoute } from '@tanstack/react-router'
import { authorizeTranslationRequest, getTranslationStats, runTranslationBatch } from '@/lib/translation.server'

export const Route = createFileRoute('/api/admin-translation')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await authorizeTranslationRequest(request))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          return Response.json(await getTranslationStats())
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        if (!(await authorizeTranslationRequest(request))) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = await request.json().catch(() => ({}))
          return Response.json(await runTranslationBatch(Number(body.limit) || 5))
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
        }
      },
    },
  },
})
