import { createFileRoute } from '@tanstack/react-router'
import { runTranslationBatch } from '@/lib/translation.server'

export const Route = createFileRoute('/api/translate-kanji-now')({
  server: {
    handlers: {
      GET: async () => {
        const startedAt = Date.now()
        let total = 0
        const batches: Array<{ processed: number; remaining: number }> = []

        try {
          for (let i = 0; i < 30; i++) {
            const result = await runTranslationBatch('kanji', 100)
            total += result.processed
            const remaining = Math.max(0, 2217 - total)
            batches.push({ processed: result.processed, remaining })
            if (result.processed === 0) break
            await new Promise(resolve => setTimeout(resolve, 1500))
          }

          return Response.json({ ok: true, total, batches, durationMs: Date.now() - startedAt })
        } catch (error) {
          return Response.json({ ok: false, total, batches, error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - startedAt }, { status: 500 })
        }
      },
    },
  },
})
