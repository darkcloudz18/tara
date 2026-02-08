'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)

interface Activity {
  id: string
  title: string
  location?: string
  coordinates?: { lat: number; lng: number } | null
  day_number?: number
  start_time?: string
  place_type?: string
}

interface TripMapProps {
  activities: Activity[]
  className?: string
  showRoute?: boolean
  center?: [number, number]
  zoom?: number
}

// Default center: Philippines
const DEFAULT_CENTER: [number, number] = [12.8797, 121.774]
const DEFAULT_ZOOM = 6

export default function TripMap({
  activities,
  className = '',
  showRoute = true,
  center,
  zoom,
}: TripMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    // Fix Leaflet default icon issue
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setMapReady(true)
    })

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Filter activities with valid coordinates
  const activitiesWithCoords = activities.filter(
    (a) => a.coordinates?.lat && a.coordinates?.lng
  )

  // Calculate map center from activities or use default
  const mapCenter = center || (activitiesWithCoords.length > 0
    ? [
        activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.lat || 0), 0) /
          activitiesWithCoords.length,
        activitiesWithCoords.reduce((sum, a) => sum + (a.coordinates?.lng || 0), 0) /
          activitiesWithCoords.length,
      ] as [number, number]
    : DEFAULT_CENTER)

  const mapZoom = zoom || (activitiesWithCoords.length > 0 ? 10 : DEFAULT_ZOOM)

  // Create route polyline coordinates
  const routeCoords = activitiesWithCoords
    .sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
    .map((a) => [a.coordinates!.lat, a.coordinates!.lng] as [number, number])

  if (!isClient || !mapReady) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`} style={{ minHeight: 300 }}>
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    )
  }

  if (activitiesWithCoords.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`} style={{ minHeight: 300 }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No locations with coordinates to display
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', minHeight: 300 }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Activity markers */}
        {activitiesWithCoords.map((activity, index) => (
          <Marker
            key={activity.id}
            position={[activity.coordinates!.lat, activity.coordinates!.lng]}
          >
            <Popup>
              <div className="p-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-sm">{activity.title}</span>
                </div>
                {activity.location && (
                  <p className="text-xs text-gray-500">{activity.location}</p>
                )}
                {activity.start_time && (
                  <p className="text-xs text-teal-600 mt-1">{activity.start_time}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route line connecting activities */}
        {showRoute && routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            color="#14b8a6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  )
}
