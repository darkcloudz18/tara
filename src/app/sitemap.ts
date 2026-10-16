import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { siteConfig } from '@/config/site'

// Sitemap combines static routes + published destinations + published
// places. Drafts are excluded — RLS already restricts the read, and the
// public pages 404 on thin content, so a sitemap entry for a thin page
// would ask Google to crawl a dead URL. We re-apply the thin-page bar
// here as belt-and-braces: an editor-published-by-hand thin place must
// not appear in the sitemap even if someone bypasses the admin guard.
//
// lastmod comes from verified_at for places/destinations — that's the
// signal 'the content we're asserting is fresh', not when the row was
// touched. Static routes use `now` because they change with every build.
//
// This file is server-rendered at request time; the result is cached by
// the Vercel edge for the sitemap endpoint.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export const revalidate = 3600

interface DestinationRow {
  slug: string
  verified_at: string | null
  updated_at: string | null
}

interface PlaceRow {
  slug: string | null
  verified_at: string | null
  created_at: string | null
  getting_there: string | null
  entrance_fee: number | null
  fee_notes: string | null
  tips: string[] | null
}

function placeMeetsThinPageBar(place: PlaceRow): boolean {
  if (!place.slug) return false
  if (!place.getting_there) return false
  if (!Array.isArray(place.tips) || place.tips.length < 3) return false
  const hasFee =
    place.entrance_fee !== null ||
    (typeof place.fee_notes === 'string' && /free/i.test(place.fee_notes))
  if (!hasFee) return false
  return true
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/templates`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Destinations — published only, lastmod from verified_at (fallback to
  // updated_at if the editor hasn't stamped yet).
  const { data: destinations } = await supabase
    .from('destinations')
    .select('slug, verified_at, updated_at')
    .eq('status', 'published')

  for (const d of (destinations ?? []) as DestinationRow[]) {
    const lastmod = d.verified_at ?? d.updated_at
    entries.push({
      url: `${base}/destinations/${d.slug}`,
      lastModified: lastmod ? new Date(lastmod) : now,
      changeFrequency: 'monthly',
      priority: 0.9,
    })
  }

  // Places — published AND cleared the thin-page bar.
  // places has no updated_at column (Task 15 migration added timestamps
  // to destinations/partner_products but left places alone — the admin
  // path writes verified_at explicitly). Fall back to created_at if the
  // editor hasn't verified yet.
  const { data: places } = await supabase
    .from('places')
    .select('slug, verified_at, created_at, getting_there, entrance_fee, fee_notes, tips')
    .eq('status', 'published')

  for (const p of (places ?? []) as PlaceRow[]) {
    if (!placeMeetsThinPageBar(p)) continue
    const lastmod = p.verified_at ?? p.created_at
    entries.push({
      url: `${base}/places/${p.slug}`,
      lastModified: lastmod ? new Date(lastmod) : now,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  return entries
}
