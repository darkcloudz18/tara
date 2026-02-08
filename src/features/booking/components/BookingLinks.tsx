'use client'

import { ExternalLink, Hotel, Plane, Ticket, Car } from 'lucide-react'

interface BookingLinksProps {
  destination: string
  startDate?: string
  endDate?: string
  compact?: boolean
}

const BOOKING_PARTNERS = [
  {
    id: 'agoda',
    name: 'Agoda',
    type: 'hotel',
    icon: <Hotel className="w-5 h-5" />,
    color: 'bg-red-500',
    getUrl: (dest: string, checkIn?: string, checkOut?: string) =>
      `https://www.agoda.com/search?city=${encodeURIComponent(dest)}&checkIn=${checkIn || ''}&checkOut=${checkOut || ''}`,
  },
  {
    id: 'booking',
    name: 'Booking.com',
    type: 'hotel',
    icon: <Hotel className="w-5 h-5" />,
    color: 'bg-blue-600',
    getUrl: (dest: string, checkIn?: string, checkOut?: string) =>
      `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest)}&checkin=${checkIn || ''}&checkout=${checkOut || ''}`,
  },
  {
    id: 'klook',
    name: 'Klook',
    type: 'activity',
    icon: <Ticket className="w-5 h-5" />,
    color: 'bg-orange-500',
    getUrl: (dest: string) =>
      `https://www.klook.com/search/?keyword=${encodeURIComponent(dest)}`,
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    type: 'flight',
    icon: <Plane className="w-5 h-5" />,
    color: 'bg-cyan-500',
    getUrl: (dest: string, date?: string) =>
      `https://www.skyscanner.com.ph/transport/flights/mnl/${getAirportCode(dest)}/${date || ''}`,
  },
  {
    id: 'grab',
    name: 'Grab',
    type: 'transport',
    icon: <Car className="w-5 h-5" />,
    color: 'bg-green-500',
    getUrl: () => 'https://www.grab.com/ph/',
  },
]

// Simple airport code mapping
function getAirportCode(destination: string): string {
  const codes: Record<string, string> = {
    'manila': 'mnl',
    'cebu': 'ceb',
    'boracay': 'klb',
    'palawan': 'pps',
    'siargao': 'iah',
    'bohol': 'tag',
    'davao': 'dvo',
    'iloilo': 'ilo',
    'baguio': 'mnl', // No direct airport, use Manila
    'coron': 'usb',
    'el nido': 'eni',
  }
  return codes[destination.toLowerCase()] || 'mnl'
}

export default function BookingLinks({
  destination,
  startDate,
  endDate,
  compact = false,
}: BookingLinksProps) {
  const formatDate = (date?: string) => {
    if (!date) return undefined
    return date.split('T')[0]
  }

  const hotels = BOOKING_PARTNERS.filter((p) => p.type === 'hotel')
  const activities = BOOKING_PARTNERS.filter((p) => p.type === 'activity')
  const flights = BOOKING_PARTNERS.filter((p) => p.type === 'flight')
  const transport = BOOKING_PARTNERS.filter((p) => p.type === 'transport')

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-teal-600" />
          Book for {destination}
        </h4>
        <div className="flex flex-wrap gap-2">
          {BOOKING_PARTNERS.slice(0, 4).map((partner) => (
            <a
              key={partner.id}
              href={partner.getUrl(destination, formatDate(startDate), formatDate(endDate))}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-3 py-1.5 ${partner.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity`}
            >
              {partner.icon}
              {partner.name}
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-teal-600" />
          Book Your Trip
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find deals for {destination}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Hotels */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            Hotels & Accommodation
          </h4>
          <div className="flex flex-wrap gap-2">
            {hotels.map((partner) => (
              <a
                key={partner.id}
                href={partner.getUrl(destination, formatDate(startDate), formatDate(endDate))}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 ${partner.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity`}
              >
                {partner.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Flights */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Plane className="w-4 h-4" />
            Flights
          </h4>
          <div className="flex flex-wrap gap-2">
            {flights.map((partner) => (
              <a
                key={partner.id}
                href={partner.getUrl(destination, formatDate(startDate))}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 ${partner.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity`}
              >
                {partner.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Tours & Activities
          </h4>
          <div className="flex flex-wrap gap-2">
            {activities.map((partner) => (
              <a
                key={partner.id}
                href={partner.getUrl(destination)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 ${partner.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity`}
              >
                {partner.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>

        {/* Transport */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Local Transport
          </h4>
          <div className="flex flex-wrap gap-2">
            {transport.map((partner) => (
              <a
                key={partner.id}
                href={partner.getUrl(destination)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 ${partner.color} text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity`}
              >
                {partner.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
        These are affiliate links. Booking through them helps support Tara at no extra cost to you.
      </div>
    </div>
  )
}
