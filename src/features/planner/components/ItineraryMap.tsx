'use client'

import { useState, useCallback, useRef } from 'react'
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow } from '@react-google-maps/api'
import { ItineraryActivity, ItineraryDay } from '@/types/database'
import { useGoogleMaps, useDirections, useMapBounds } from '../hooks/useGoogleMaps'
import {
  MAP_CONTAINER_STYLE,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  DEFAULT_MAP_OPTIONS,
  getDayColor,
  coordinatesToLatLng,
  PLACE_TYPES,
  PlaceType,
} from '@/lib/google-maps'

interface ItineraryMapProps {
  days: ItineraryDay[]
  activities: ItineraryActivity[]
  selectedDayId?: string | null
  onActivityClick?: (activity: ItineraryActivity) => void
  height?: string
}

export default function ItineraryMap({
  days,
  activities,
  selectedDayId,
  onActivityClick,
  height = '400px',
}: ItineraryMapProps) {
  const { isLoaded, loadError } = useGoogleMaps()
  const { directions, calculateRoute, clearDirections, loading: directionsLoading } = useDirections()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<ItineraryActivity | null>(null)
  const [showDirections, setShowDirections] = useState(false)

  // Filter activities by selected day if provided
  const visibleActivities = selectedDayId
    ? activities.filter((a) => {
        const day = days.find((d) => d.id === a.day_id)
        return day?.id === selectedDayId
      })
    : activities

  // Only activities with coordinates
  const activitiesWithCoords = visibleActivities.filter((a) => a.coordinates)

  const { fitBounds } = useMapBounds(map, activitiesWithCoords)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const handleMarkerClick = (activity: ItineraryActivity) => {
    setSelectedActivity(activity)
    onActivityClick?.(activity)
  }

  const handleShowDirections = async () => {
    if (showDirections) {
      clearDirections()
      setShowDirections(false)
    } else {
      const result = await calculateRoute(activitiesWithCoords)
      if (result) {
        setShowDirections(true)
      }
    }
  }

  // Get day number for an activity
  const getDayNumber = (activity: ItineraryActivity): number => {
    const day = days.find((d) => d.id === activity.day_id)
    return day?.day_number || 1
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-500">
          <p>Failed to load Google Maps</p>
          <p className="text-sm mt-1">Please check your API key configuration</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg animate-pulse" style={{ height }}>
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }

  if (activitiesWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-500">
          <span className="text-4xl mb-2 block">🗺️</span>
          <p>No locations to show yet</p>
          <p className="text-sm mt-1">Add activities with locations to see them on the map</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={
          activitiesWithCoords[0]?.coordinates
            ? coordinatesToLatLng(activitiesWithCoords[0].coordinates)
            : DEFAULT_CENTER
        }
        zoom={DEFAULT_ZOOM}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* Markers */}
        {!showDirections &&
          activitiesWithCoords.map((activity, index) => {
            const dayNumber = getDayNumber(activity)
            const position = coordinatesToLatLng(activity.coordinates)
            if (!position) return null

            return (
              <Marker
                key={activity.id}
                position={position}
                label={{
                  text: String(index + 1),
                  color: 'white',
                  fontWeight: 'bold',
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: getDayColor(dayNumber),
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                  scale: 15,
                }}
                onClick={() => handleMarkerClick(activity)}
              />
            )
          })}

        {/* Directions */}
        {showDirections && directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 4,
              },
            }}
          />
        )}

        {/* Info Window */}
        {selectedActivity && selectedActivity.coordinates && (
          <InfoWindow
            position={coordinatesToLatLng(selectedActivity.coordinates)}
            onCloseClick={() => setSelectedActivity(null)}
          >
            <div className="p-2 max-w-xs">
              <h4 className="font-medium text-gray-900">{selectedActivity.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{selectedActivity.location}</p>
              {selectedActivity.start_time && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedActivity.start_time.slice(0, 5)}
                  {selectedActivity.end_time && ` - ${selectedActivity.end_time.slice(0, 5)}`}
                </p>
              )}
              {selectedActivity.place_type && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                  {PLACE_TYPES[selectedActivity.place_type as PlaceType]?.label || selectedActivity.place_type}
                </span>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={fitBounds}
          className="px-3 py-2 bg-white shadow-md rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          title="Fit all markers"
        >
          Fit All
        </button>
        {activitiesWithCoords.length >= 2 && (
          <button
            onClick={handleShowDirections}
            disabled={directionsLoading}
            className={`px-3 py-2 shadow-md rounded-lg text-sm font-medium ${
              showDirections
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {directionsLoading ? 'Loading...' : showDirections ? 'Hide Route' : 'Show Route'}
          </button>
        )}
      </div>

      {/* Legend */}
      {!selectedDayId && days.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-white shadow-md rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-2">Days</p>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <div key={day.id} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getDayColor(day.day_number) }}
                />
                <span className="text-xs text-gray-600">{day.day_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
