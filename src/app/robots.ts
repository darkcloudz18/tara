import type { MetadataRoute } from 'next'
import { siteConfig } from '@/config/site'

// Disallow auth-shaped and parameterized surfaces that would either
// 404 for Googlebot (no cookie) or get flagged as thin/duplicative:
// - /bucket — personal page, no public content
// - /search — thin by nature, every ?q= variant is near-duplicate
// - /dashboard, /profile, /notifications — auth-only
// - /trip/*/edit — owner-only, not for crawling
// - /register, /login, /forgot-password, /reset-password — redirect
//   or render form; not useful search results
// - /api — not a thing to index
// - /admin — never
//
// /trip/[id] stays allowed — the public share view is indexable per
// is_public, and matters once real public trips exist. Not in the
// sitemap today but Google can discover them through outbound shares.
export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/$/, '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/bucket',
        '/search',
        '/dashboard',
        '/profile',
        '/profile/',
        '/notifications',
        '/trip/*/edit',
        '/trip/new',
        '/register',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/api/',
        '/admin',
        '/admin/',
        '/offline',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
