import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles, MapPin, Clock, Wallet, Calendar } from 'lucide-react'
import { AppShell } from '@/components/layout'
import TrustBlock from '@/features/public-content/components/TrustBlock'
import PageViewTracker from '@/features/public-content/components/PageViewTracker'
import {
  getPublicDestinationBySlug,
  formatFee,
  monthLabels,
  type PublicPlace,
} from '@/features/public-content/services/publicContentService'

// ISR window — matches the trip page / templates cache tiers already in
// use. Published content changes slowly; the admin publish flow still
// renders instantly for the editor via live supabase reads.
export const revalidate = 300

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicDestinationBySlug(params.slug)
  if (!data) return { title: 'Destination not found' }
  const { destination } = data
  return {
    title: `${destination.name} — Tara`,
    description:
      destination.summary ??
      `Plan a trip to ${destination.name}${destination.region ? `, ${destination.region}` : ''} — real days, real budget, real travel times.`,
    openGraph: {
      title: `${destination.name} — Tara`,
      description: destination.summary ?? undefined,
      type: 'article',
    },
    robots: destination.status === 'published' ? undefined : 'noindex',
  }
}

export default async function DestinationPage({ params }: Props) {
  const data = await getPublicDestinationBySlug(params.slug)
  if (!data) notFound()

  const { destination, places, placesByTour, standalonePlaces } = data
  const planHref = `/trip/new?destination=${encodeURIComponent(destination.name)}`

  return (
    <AppShell>
      <PageViewTracker
        event="destination_page_view"
        properties={{
          slug: destination.slug,
          placeCount: places.length,
          hasOverlap: false,
        }}
      />

      <article className="min-h-screen bg-white dark:bg-black">
        {/* Hero */}
        <header className="relative bg-gradient-to-b from-teal-50 to-white dark:from-teal-900/20 dark:to-black px-4 sm:px-8 pt-10 pb-8">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              <Link href="/discover" className="hover:text-teal-600 dark:hover:text-teal-400">Discover</Link>
              <span className="mx-2">·</span>
              <span>Destinations</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {destination.name}
            </h1>
            {destination.region && (
              <p className="mt-1 text-base text-gray-600 dark:text-gray-300">{destination.region}</p>
            )}
            {destination.summary && (
              <p className="mt-4 text-lg text-gray-700 dark:text-gray-200 leading-relaxed">
                {destination.summary}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={planHref}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                Plan a trip here
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-10">
          {/* How many days + travel times */}
          {(destination.typical_days ||
            destination.min_viable_days ||
            (destination.travel_times && Object.keys(destination.travel_times).length > 0)) && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                How many days you need
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {destination.min_viable_days !== null && (
                  <Stat
                    icon={<Clock className="w-5 h-5 text-teal-500" />}
                    label="Minimum"
                    value={`${destination.min_viable_days} ${destination.min_viable_days === 1 ? 'day' : 'days'}`}
                  />
                )}
                {destination.typical_days !== null && (
                  <Stat
                    icon={<Calendar className="w-5 h-5 text-teal-500" />}
                    label="Typical"
                    value={`${destination.typical_days} ${destination.typical_days === 1 ? 'day' : 'days'}`}
                  />
                )}
                {destination.travel_times && Object.keys(destination.travel_times).length > 0 && (
                  <Stat
                    icon={<MapPin className="w-5 h-5 text-teal-500" />}
                    label="Travel time"
                    value={
                      <ul className="text-sm space-y-0.5 text-gray-700 dark:text-gray-200">
                        {Object.entries(destination.travel_times).map(([hub, mins]) => (
                          <li key={hub} className="capitalize tabular-nums">
                            {hub}: {(mins / 60).toFixed(mins % 60 === 0 ? 0 : 1)} h
                          </li>
                        ))}
                      </ul>
                    }
                  />
                )}
              </div>
            </section>
          )}

          {/* Getting there */}
          {destination.getting_there && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">How to get there</h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {destination.getting_there}
              </p>
            </section>
          )}

          {/* Budget bands */}
          {(destination.budget_low || destination.budget_mid || destination.budget_high) && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Budget per person, per day
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {destination.budget_low !== null && (
                  <BandCard label="Budget" amount={destination.budget_low} desc="Hostels, local food, public transport" />
                )}
                {destination.budget_mid !== null && (
                  <BandCard label="Comfortable" amount={destination.budget_mid} desc="Mid-range stays, a few paid activities" />
                )}
                {destination.budget_high !== null && (
                  <BandCard label="Premium" amount={destination.budget_high} desc="Nicer hotels, tours, private transfers" />
                )}
              </div>
            </section>
          )}

          {/* Places grid grouped by part_of_tour */}
          {places.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {places.length} {places.length === 1 ? 'place' : 'places'} worth your time
              </h2>

              {placesByTour.size > 0 &&
                Array.from(placesByTour.entries()).map(([tour, members]) => (
                  <div key={tour} className="mb-6">
                    <h3 className="text-sm uppercase tracking-wider font-semibold text-teal-600 dark:text-teal-400 mb-3">
                      {tour}
                    </h3>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {members.map((p) => (
                        <PlaceCardLink key={p.id} place={p} />
                      ))}
                    </ul>
                  </div>
                ))}

              {standalonePlaces.length > 0 && (
                <div>
                  {placesByTour.size > 0 && (
                    <h3 className="text-sm uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-3">
                      Standalone stops
                    </h3>
                  )}
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {standalonePlaces.map((p) => (
                      <PlaceCardLink key={p.id} place={p} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Tips */}
          {Array.isArray(destination.tips) && destination.tips.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tips worth knowing</h2>
              <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                {destination.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-teal-500 mt-1.5" aria-hidden="true">·</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Best months hint */}
          {destination.best_months && destination.best_months.length > 0 && (
            <section>
              <p className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full">
                <Calendar className="w-4 h-4 text-teal-500" aria-hidden="true" />
                Best time to visit: {monthLabels(destination.best_months)}
              </p>
            </section>
          )}

          {/* Trust block */}
          <TrustBlock
            verifiedAt={destination.verified_at}
            sourceUrls={destination.source_urls}
          />
        </div>
      </article>
    </AppShell>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

function BandCard({ label, amount, desc }: { label: string; amount: number; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums">
        ₱{amount.toLocaleString()}
        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">/day</span>
      </p>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  )
}

function PlaceCardLink({ place }: { place: PublicPlace }) {
  return (
    <li>
      <Link
        href={`/places/${place.slug}`}
        className="group block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
      >
        <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
          {place.name}
        </h4>
        {place.summary && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{place.summary}</p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
            {formatFee(place.entrance_fee, place.fee_notes)}
          </span>
          {place.duration_minutes !== null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {place.duration_minutes >= 60
                ? `${(place.duration_minutes / 60).toFixed(place.duration_minutes % 60 === 0 ? 0 : 1)} h`
                : `${place.duration_minutes} min`}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}
