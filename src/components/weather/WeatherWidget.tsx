'use client'

import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Loader2, AlertCircle } from 'lucide-react'
import {
  fetchWeatherForecast,
  getWeatherDescription,
  getDestinationCoordinates,
  WeatherDay,
} from '@/lib/weather'

interface WeatherWidgetProps {
  destination: string
  startDate: string
  endDate: string
  className?: string
}

export default function WeatherWidget({
  destination,
  startDate,
  endDate,
  className = '',
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWeather() {
      setLoading(true)
      setError(null)

      const coords = getDestinationCoordinates(destination)
      if (!coords) {
        setError('Location not found')
        setLoading(false)
        return
      }

      // Check if dates are within forecast range (typically 16 days)
      const start = new Date(startDate)
      const end = new Date(endDate)
      const now = new Date()
      const maxForecastDate = new Date(now)
      maxForecastDate.setDate(now.getDate() + 16)

      if (start > maxForecastDate) {
        setError('Forecast not available for these dates yet')
        setLoading(false)
        return
      }

      // Adjust dates to be within forecast range
      const adjustedStart = start < now ? now.toISOString().split('T')[0] : startDate
      const adjustedEnd = end > maxForecastDate
        ? maxForecastDate.toISOString().split('T')[0]
        : endDate

      const forecast = await fetchWeatherForecast(
        coords.lat,
        coords.lng,
        adjustedStart,
        adjustedEnd
      )

      if (forecast) {
        setWeather(forecast.days)
      } else {
        setError('Failed to load weather')
      }

      setLoading(false)
    }

    loadWeather()
  }, [destination, startDate, endDate])

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading weather...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  if (weather.length === 0) {
    return null
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          Weather Forecast
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{destination}</p>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {weather.slice(0, 7).map((day) => {
            const { description, icon } = getWeatherDescription(day.weatherCode)
            const date = new Date(day.date)

            return (
              <div
                key={day.date}
                className="flex-shrink-0 w-24 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"
              >
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>

                <span className="text-2xl">{icon}</span>

                <div className="mt-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.round(day.temperatureMax)}°
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(day.temperatureMin)}°
                  </p>
                </div>

                {day.precipitationProbability > 20 && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-blue-500">
                    <Droplets className="w-3 h-3" />
                    <span className="text-xs">{day.precipitationProbability}%</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Powered by Open-Meteo
        </p>
      </div>
    </div>
  )
}
