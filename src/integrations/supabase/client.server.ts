// Server-side Supabase client.
// Prefer the service-role key when configured. In environments where only the
// publishable key is available, fall back to it so authenticated read-only
// server routes do not crash just because SERVICE_ROLE_KEY is absent.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const FALLBACK_SUPABASE_URL = 'https://upxtqsvgppvqpbrjoitz.supabase.co'
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_lOFCqoqCndJ5DE_3S4RKjQ_28F6nK6u'

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_')
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    )
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization')
    }
    headers.set('apikey', supabaseKey)
    return fetch(input, { ...init, headers })
  }
}

function createSupabaseAdminClient() {
  const url = process.env['SUPABASE_URL'] || FALLBACK_SUPABASE_URL
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
  const publishableKey = process.env['SUPABASE_PUBLISHABLE_KEY'] || FALLBACK_SUPABASE_PUBLISHABLE_KEY
  const key = serviceRoleKey || publishableKey

  if (!url || !key) throw new Error('Supabase configuration is unavailable')
  if (!serviceRoleKey) console.warn('[Supabase] SERVICE_ROLE_KEY is not configured; using publishable key fallback')

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient()
    return Reflect.get(_supabaseAdmin, prop, receiver)
  },
})
