import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: 'missing_env' },
      { status: 503 }
    )
  }

  const supabase = createClient(url, anonKey)

  const query = supabase.from('places').select('id').limit(1)
  const timeout = new Promise<{ error: { message: string } }>((resolve) =>
    setTimeout(() => resolve({ error: { message: 'timeout' } }), 5000)
  )

  const result = await Promise.race([query, timeout])

  if ('error' in result && result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 503 }
    )
  }

  return NextResponse.json({ ok: true })
}
