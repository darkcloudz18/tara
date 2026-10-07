import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

// Only genuinely indexable surfaces today — the homepage and the
// templates grid. /bucket is a personal/auth-shaped page with no
// public content; /search is parameterized and reads as thin to
// Google. Both are explicitly noindex'd in robots.ts.
//
// Guides (/guides/[slug]) will land here as they're written —
// that's the content Google should actually see.
//
// Public lakads (/trip/[id] where is_public = true) stay out
// until we have real trips to show. A sitemap listing seeded or
// half-finished trips harms crawl impression more than it helps.
// Reintroduce with a filter like "public AND >= 3 activities AND
// has cover_image_url" once real users ship.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/$/, '')
  const now = new Date()

  return [
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
}
