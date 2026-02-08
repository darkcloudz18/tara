import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Plane,
  Hotel,
  UtensilsCrossed,
  Camera,
  Sparkles,
  Eye,
  Copy,
} from 'lucide-react'
import { itineraryService } from '@/features/planner/services/itineraryService'
import { TripComments, LikeButton } from '@/features/social'
import { TripMap } from '@/components/maps'
import { WeatherWidget } from '@/components/weather'
import TripActions from './TripActions'

interface PageProps {
  params: { id: string }
}

// Generate metadata for social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await itineraryService.getFullItinerary(params.id, true)

  if (!data) {
    return {
      title: 'Trip Not Found | Tara',
    }
  }

  const { itinerary, days } = data
  const destination = itinerary.destinations?.[0] || 'Philippines'
  const totalDays = days.length || 1
  const budget = itinerary.total_budget
    ? `₱${itinerary.total_budget.toLocaleString()}`
    : 'Budget TBD'

  const title = `${totalDays}-Day ${destination} Trip | Tara`
  const description = `${itinerary.title} • ${totalDays} days • ${budget} budget. Plan your own trip with Tara - the free trip planner for the Philippines.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Tara',
      images: [
        {
          url: `/trip/${params.id}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${destination} Trip Itinerary`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/trip/${params.id}/opengraph-image`],
    },
  }
}

export default async function PublicTripPage({ params }: PageProps) {
  const data = await itineraryService.getFullItinerary(params.id, true)

  if (!data) {
    notFound()
  }

  // Increment view count (fire and forget)
  itineraryService.incrementViews(params.id).catch(() => {})

  const { itinerary, days, activities, owner } = data
  const destination = itinerary.destinations?.[0] || 'Philippines'
  const totalDays = days.length || 1

  // Calculate total budget from activities
  const totalBudget = activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0)

  // Format dates
  const startDate = new Date(itinerary.start_date)
  const endDate = new Date(itinerary.end_date)
  const dateRange = `${startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`

  // Group activities by day
  const dayActivities = days.map((day) => ({
    ...day,
    activities: activities.filter((a) => a.day_id === day.id),
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 text-white">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="trip-pattern"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trip-pattern)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
          {/* Tara Branding */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold">Tara</span>
          </Link>

          {/* Trip Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{itinerary.title}</h1>

          {/* Trip Meta */}
          <div className="flex flex-wrap items-center gap-4 text-teal-100 mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{dateRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{totalDays} days</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 md:gap-8 mb-8">
            <div>
              <p className="text-3xl font-bold">{totalDays}</p>
              <p className="text-sm text-teal-100">Days</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{activities.length}</p>
              <p className="text-sm text-teal-100">Activities</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                ₱{(itinerary.total_budget || totalBudget).toLocaleString()}
              </p>
              <p className="text-sm text-teal-100">Est. Budget</p>
            </div>
            {(itinerary.views_count || 0) > 0 && (
              <div>
                <p className="text-3xl font-bold flex items-center gap-2">
                  <Eye className="w-6 h-6" />
                  {itinerary.views_count?.toLocaleString()}
                </p>
                <p className="text-sm text-teal-100">Views</p>
              </div>
            )}
            {(itinerary.copies_count || 0) > 0 && (
              <div>
                <p className="text-3xl font-bold flex items-center gap-2">
                  <Copy className="w-6 h-6" />
                  {itinerary.copies_count?.toLocaleString()}
                </p>
                <p className="text-sm text-teal-100">Copies</p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/trip/new?destination=${encodeURIComponent(destination)}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-colors"
            >
              Plan Your Own Trip
              <ArrowRight className="w-5 h-5" />
            </Link>
            <TripActions
              tripId={params.id}
              title={itinerary.title}
              itinerary={itinerary}
              days={days}
              activities={activities}
            />
          </div>

          {/* Created by */}
          {owner && (
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                  {owner.photo_url ? (
                    <img
                      src={owner.photo_url}
                      alt={owner.username || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold">
                      {(owner.first_name || owner.username || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-teal-100">Planned by</p>
                  <p className="font-semibold">
                    {owner.first_name || owner.username || 'Tara Traveler'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Itinerary Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Weather & Map Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Weather Widget */}
          <WeatherWidget
            destination={destination}
            startDate={itinerary.start_date}
            endDate={itinerary.end_date}
          />

          {/* Trip Map */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Trip Map</h3>
              </div>
              <TripMap
                activities={activities.map((a, i) => ({
                  id: a.id,
                  title: a.title,
                  location: a.location,
                  coordinates: a.coordinates,
                  day_number: days.find(d => d.id === a.day_id)?.day_number,
                  start_time: a.start_time,
                  place_type: a.place_type,
                }))}
                className="h-[280px]"
                showRoute={true}
              />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Day-by-Day Itinerary</h2>

        <div className="space-y-6">
          {dayActivities.map((day) => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>

        {/* Social Section */}
        <div className="mt-8 space-y-6">
          {/* Like Button */}
          <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <LikeButton itineraryId={params.id} size="lg" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Like this trip to show your appreciation
            </span>
          </div>

          {/* Comments */}
          <TripComments itineraryId={params.id} isPublic={true} />
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">Love this itinerary?</h3>
          <p className="text-teal-100 mb-6">
            Create your own trip plan for free with Tara
          </p>
          <Link
            href="/trip/new"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-colors"
          >
            Start Planning Your Trip
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-teal-600">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">Planned with Tara</span>
          </Link>
          <p className="text-sm text-gray-400 mt-2">
            The free trip planner for the Philippines
          </p>
        </footer>
      </div>
    </div>
  )
}

// Day Card Component
function DayCard({ day }: { day: any }) {
  const getActivityIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'transport':
        return Plane
      case 'accommodation':
        return Hotel
      case 'meal':
      case 'food':
        return UtensilsCrossed
      default:
        return Camera
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Day Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-xl flex items-center justify-center">
            <span className="text-teal-600 dark:text-teal-400 font-bold text-lg">
              {day.day_number}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {day.title || `Day ${day.day_number}`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(day.date)}</p>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="p-6">
        {day.activities.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No activities planned for this day</p>
        ) : (
          <div className="space-y-4">
            {day.activities.map((activity: any, index: number) => {
              const Icon = getActivityIcon(activity.place_type)
              return (
                <div key={activity.id} className="flex gap-4">
                  {/* Time */}
                  <div className="w-16 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {activity.start_time || '--:--'}
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-teal-500" />
                    {index < day.activities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                        {activity.location && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </p>
                        )}
                        {activity.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                      {activity.estimated_cost > 0 && (
                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400 flex-shrink-0">
                          ₱{activity.estimated_cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

