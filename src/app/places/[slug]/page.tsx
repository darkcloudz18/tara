import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Wallet, Clock, CalendarCheck, MapPin, ExternalLink, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout'
import TrustBlock from '@/features/public-content/components/TrustBlock'
import PageViewTracker from '@/features/public-content/components/PageViewTracker'
import {
  getPublicPlaceBySlug,
  formatFee,
  formatDuration,
  monthLabels,
  type PublicPlace,
} from '@/features/public-content/services/publicContentService'

export const revalidate = 300

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicPlaceBySlug(params.slug)
  if (!data) return { title: 'Place not found' }
  const { place, destination } = data
  const where = destination ? ` in ${destination.name}` : ''
  return {
    title: `${place.name}${where} — Tara`,
    description:
      place.summary ??
      `What ${place.name} actually costs and how to get there — current, sourced, Philippines-specific.`,
    openGraph: {
      title: `${place.name}${where} — Tara`,
      description: place.summary ?? undefined,
      type: 'article',
      images: place.photos?.[0] ? [{ url: place.photos[0] }] : undefined,
    },
    robots: place.status === 'published' ? undefined : 'noindex',
  }
}

export default async function PlacePage({ params }: Props) {
  const data = await getPublicPlaceBySlug(params.slug)
  if (!data) notFound()

  const { place, destination, pairsWith, tourSiblings, partnerProducts } = data
  const planHref = destination
    ? `/trip/new?destination=${encodeURIComponent(destination.name)}`
    : null

  return (
    <AppShell>
      <PageViewTracker
        event="place_page_view"
        properties={{
          slug: place.slug,
          destinationSlug: destination?.slug ?? null,
          hasBooking: partnerProducts.length > 0,
        }}
      />

      <article className="min-h-screen bg-white dark:bg-black">
        {/* Hero photo */}
        {place.photos?.[0] && (
          <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <Image
              src={place.photos[0]}
              alt={place.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
          {/* Breadcrumb + title */}
          <header>
            <nav className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              <Link href="/discover" className="hover:text-teal-600 dark:hover:text-teal-400">Discover</Link>
              {destination && (
                <>
                  <span className="mx-2">·</span>
                  <Link
                    href={`/destinations/${destination.slug}`}
                    className="hover:text-teal-600 dark:hover:text-teal-400"
                  >
                    {destination.name}
                  </Link>
                </>
              )}
              <span className="mx-2">·</span>
              <span>Places</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {place.name}
            </h1>
            {place.summary && (
              <p className="mt-3 text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                {place.summary}
              </p>
            )}
          </header>

          {/* Fee / Duration / Booking — above the fold per spec */}
          <section className="grid sm:grid-cols-3 gap-3">
            <FactCard
              icon={<Wallet className="w-5 h-5 text-teal-500" />}
              label="Fee"
              value={formatFee(place.entrance_fee, place.fee_notes)}
              secondary={place.fee_notes && place.entrance_fee !== null ? place.fee_notes : null}
            />
            <FactCard
              icon={<Clock className="w-5 h-5 text-teal-500" />}
              label="Typical visit"
              value={formatDuration(place.duration_minutes) ?? 'Not published yet'}
            />
            <FactCard
              icon={<CalendarCheck className="w-5 h-5 text-teal-500" />}
              label="Booking"
              value={place.booking_required ? 'Required ahead' : 'Walk in'}
              secondary={place.booking_notes}
            />
          </section>

          {/* Getting there */}
          {place.getting_there && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-500" aria-hidden="true" />
                Getting there
              </h2>
              {place.nearest_hub && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  From {place.nearest_hub}
                </p>
              )}
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {place.getting_there}
              </p>
            </section>
          )}

          {/* Tips */}
          {Array.isArray(place.tips) && place.tips.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Tips worth knowing
              </h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                {place.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-teal-500 mt-1.5" aria-hidden="true">·</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Best time of day / best months */}
          {(place.best_time_of_day || (place.best_months && place.best_months.length > 0)) && (
            <section className="flex flex-wrap gap-3">
              {place.best_time_of_day && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
                  <Clock className="w-4 h-4 text-teal-500" aria-hidden="true" />
                  Best time of day: {place.best_time_of_day}
                </span>
              )}
              {place.best_months && place.best_months.length > 0 && (
                <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
                  <CalendarCheck className="w-4 h-4 text-teal-500" aria-hidden="true" />
                  Best months: {monthLabels(place.best_months)}
                </span>
              )}
            </section>
          )}

          {/* Pairs with */}
          {pairsWith.length > 0 && (
            <SiblingGrid heading="Pairs well with" places={pairsWith} />
          )}

          {/* Part of tour */}
          {tourSiblings.length > 0 && (
            <SiblingGrid
              heading={`Part of ${place.part_of_tour}`}
              places={tourSiblings}
              subheading="Covered on the same trip — plan them together."
            />
          )}

          {/* Partner products — booking CTA with sponsored/nofollow */}
          {partnerProducts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Book this
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                We earn a commission on some bookings. It costs you nothing extra.
              </p>
              <ul className="space-y-2">
                {partnerProducts.map((pp) => (
                  <li key={pp.id}>
                    <a
                      href={`/go/${pp.id}`}
                      target="_blank"
                      rel="sponsored nofollow noopener"
                      className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {pp.product_name ?? `${pp.partner} ${pp.product_type}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          via {pp.partner}
                          {pp.includes && <> · {pp.includes}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-right flex-shrink-0">
                        {pp.price_from !== null && (
                          <span className="font-semibold text-gray-900 dark:text-white tabular-nums">
                            from ₱{pp.price_from.toLocaleString()}
                          </span>
                        )}
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-500" aria-hidden="true" />
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Plan a trip CTA to the destination */}
          {planHref && destination && (
            <section className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-teal-900 dark:text-teal-100">
                  Planning a trip to {destination.name}?
                </p>
                <p className="text-sm text-teal-700 dark:text-teal-200">
                  Open the wizard and we'll build a draft lakad around places like this.
                </p>
              </div>
              <Link
                href={planHref}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700"
              >
                <Sparkles className="w-4 h-4" />
                Plan a trip here
              </Link>
            </section>
          )}

          {/* Trust block */}
          <TrustBlock
            verifiedAt={place.verified_at}
            sourceUrls={place.source_urls}
          />
        </div>
      </article>
    </AppShell>
  )
}

function FactCard({
  icon,
  label,
  value,
  secondary,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  secondary?: string | null
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-gray-900 dark:text-white">{value}</div>
      {secondary && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{secondary}</p>
      )}
    </div>
  )
}

function SiblingGrid({
  heading,
  subheading,
  places,
}: {
  heading: string
  subheading?: string
  places: PublicPlace[]
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{heading}</h2>
      {subheading && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{subheading}</p>
      )}
      <ul className="grid sm:grid-cols-2 gap-3">
        {places.map((p) => (
          <li key={p.id}>
            <Link
              href={`/places/${p.slug}`}
              className="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                {p.name}
              </h3>
              {p.summary && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{p.summary}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
