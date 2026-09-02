// Cron authentication supports Vercel's native cron header and optional
// CRON_SECRET / Lovable secrets for manual or legacy scheduled invocations.
export async function authenticateCronRequest(
  request: Request,
): Promise<Response | null> {
  // Vercel adds this header to configured Cron invocations.
  const cronSchedule = request.headers.get('x-vercel-cron-schedule')
  if (cronSchedule === '*/5 * * * *') {
    return null
  }

  const currentSecret = process.env['CRON_SECRET'] ?? process.env['LOVABLE_CRON_SECRET']
  const previousSecret = process.env['LOVABLE_CRON_SECRET_PREVIOUS']

  if (!currentSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const match = /^Bearer ([^\s,]+)$/.exec(
    request.headers.get('authorization') ?? '',
  )
  const token = match?.[1]
  if (!token) return new Response('Unauthorized', { status: 401 })

  const { createHash, timingSafeEqual } = await import('node:crypto')
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest()
  const providedDigest = digest(token)
  const currentMatches = timingSafeEqual(providedDigest, digest(currentSecret))
  const previousMatches = timingSafeEqual(
    providedDigest,
    digest(previousSecret ?? currentSecret),
  )

  if (!currentMatches && !previousMatches) {
    return new Response('Unauthorized', { status: 401 })
  }

  return null
}
