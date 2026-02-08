/**
 * Weather Service using Open-Meteo API (free, no API key required)
 */

export interface WeatherDay {
  date: string
  temperatureMax: number
  temperatureMin: number
  weatherCode: number
  precipitation: number
  precipitationProbability: number
  windSpeed: number
}

export interface WeatherForecast {
  latitude: number
  longitude: number
  timezone: string
  days: WeatherDay[]
}

// Weather code to description mapping
const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Foggy', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️' },
  53: { description: 'Moderate drizzle', icon: '🌦️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  56: { description: 'Light freezing drizzle', icon: '🌧️' },
  57: { description: 'Dense freezing drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌧️' },
  67: { description: 'Heavy freezing rain', icon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '❄️' },
  77: { description: 'Snow grains', icon: '🌨️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌧️' },
  82: { description: 'Violent rain showers', icon: '⛈️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
}

export function getWeatherDescription(code: number): { description: string; icon: string } {
  return WEATHER_CODES[code] || { description: 'Unknown', icon: '❓' }
}

/**
 * Fetch weather forecast for a location
 * @param lat Latitude
 * @param lng Longitude
 * @param startDate Start date for forecast
 * @param endDate End date for forecast
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<WeatherForecast | null> {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
      timezone: 'Asia/Manila',
    })

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    )

    if (!response.ok) {
      throw new Error('Weather API request failed')
    }

    const data = await response.json()

    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      temperatureMax: data.daily.temperature_2m_max[i],
      temperatureMin: data.daily.temperature_2m_min[i],
      weatherCode: data.daily.weather_code[i],
      precipitation: data.daily.precipitation_sum[i],
      precipitationProbability: data.daily.precipitation_probability_max[i],
      windSpeed: data.daily.wind_speed_10m_max[i],
    }))

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      days,
    }
  } catch (error) {
    console.error('Error fetching weather:', error)
    return null
  }
}

// Common Philippine destinations with coordinates
export const PHILIPPINE_DESTINATIONS: Record<string, { lat: number; lng: number }> = {
  'Manila': { lat: 14.5995, lng: 120.9842 },
  'Cebu': { lat: 10.3157, lng: 123.8854 },
  'Boracay': { lat: 11.9674, lng: 121.9248 },
  'Palawan': { lat: 9.8349, lng: 118.7384 },
  'El Nido': { lat: 11.1784, lng: 119.4060 },
  'Coron': { lat: 11.9986, lng: 120.2043 },
  'Siargao': { lat: 9.8482, lng: 126.0458 },
  'Bohol': { lat: 9.8500, lng: 124.1435 },
  'Baguio': { lat: 16.4023, lng: 120.5960 },
  'Davao': { lat: 7.1907, lng: 125.4553 },
  'Iloilo': { lat: 10.7202, lng: 122.5621 },
  'Vigan': { lat: 17.5747, lng: 120.3869 },
  'Sagada': { lat: 17.0833, lng: 120.9000 },
  'Batanes': { lat: 20.4487, lng: 121.9702 },
  'Puerto Princesa': { lat: 9.7392, lng: 118.7353 },
  'Tagaytay': { lat: 14.1153, lng: 120.9621 },
  'La Union': { lat: 16.6159, lng: 120.3209 },
  'Zambales': { lat: 15.5082, lng: 119.9698 },
  'Batangas': { lat: 13.7565, lng: 121.0583 },
  'Camiguin': { lat: 9.1732, lng: 124.7291 },
}

/**
 * Get coordinates for a destination name
 */
export function getDestinationCoordinates(destination: string): { lat: number; lng: number } | null {
  // Try exact match first
  if (PHILIPPINE_DESTINATIONS[destination]) {
    return PHILIPPINE_DESTINATIONS[destination]
  }

  // Try partial match
  const lowerDest = destination.toLowerCase()
  for (const [name, coords] of Object.entries(PHILIPPINE_DESTINATIONS)) {
    if (lowerDest.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerDest)) {
      return coords
    }
  }

  return null
}
