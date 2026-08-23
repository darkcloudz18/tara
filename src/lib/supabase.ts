import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a singleton instance that's only initialized when env vars are available
let supabaseInstance: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}

// For backwards compatibility - lazy getter
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})

// Race any promise against a timeout that resolves to `fallback`.
function raceWithTimeout<T>(p: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
  ])
}

// Wrapped auth calls. On timeout or error, treat as logged out and return null
// so the caller can render immediately. Prevents infinite skeletons when
// Supabase is unreachable (paused free-tier project, network partition, etc).
export async function getUserSafe(timeoutMs = 3000): Promise<User | null> {
  const call = getSupabase()
    .auth.getUser()
    .then((r) => r.data.user)
    .catch(() => null)
  return raceWithTimeout(call, timeoutMs, null)
}

export async function getSessionSafe(timeoutMs = 3000): Promise<Session | null> {
  const call = getSupabase()
    .auth.getSession()
    .then((r) => r.data.session)
    .catch(() => null)
  return raceWithTimeout(call, timeoutMs, null)
}
