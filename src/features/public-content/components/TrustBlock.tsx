import { ShieldCheck, AlertCircle } from 'lucide-react'
import { formatVerifiedAt } from '../services/publicContentService'

interface Props {
  verifiedAt: string | null
  sourceUrls: string[] | null
  reportHref?: string
}

/**
 * Shared trust block for /destinations/[slug] and /places/[slug].
 * Spec copy (docs/places-spec.md §3):
 *
 *   Last verified <date> · Sources: [list]
 *   Fees and schedules change. Tell us if something's wrong.
 *
 * Sources render as external links (rel="noopener nofollow" so we don't
 * pass SEO juice to arbitrary sources). Truncated by domain so a long
 * URL doesn't blow the layout. Full URL in title + aria-label for
 * accessibility and copy-paste.
 */
export default function TrustBlock({ verifiedAt, sourceUrls, reportHref }: Props) {
  const sources = Array.isArray(sourceUrls) ? sourceUrls.filter(Boolean) : []

  return (
    <section
      aria-labelledby="trust-heading"
      className="mt-10 border-t border-gray-200 dark:border-gray-800 pt-6"
    >
      <h2 id="trust-heading" className="sr-only">Verification and sources</h2>

      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-white">Last verified </span>
            {formatVerifiedAt(verifiedAt)}
          </p>

          {sources.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Sources</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {sources.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener nofollow"
                      title={url}
                      aria-label={`Source: ${url}`}
                      className="text-teal-600 dark:text-teal-400 hover:underline break-all"
                    >
                      {domainOf(url)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Fees and schedules change.
            {reportHref ? (
              <>
                {' '}
                <a href={reportHref} className="underline hover:no-underline">Tell us if something's wrong.</a>
              </>
            ) : (
              " Tell us if something's wrong."
            )}
          </p>
        </div>
      </div>
    </section>
  )
}

function domainOf(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
