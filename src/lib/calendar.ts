/**
 * Calendar Export Utilities
 * Generates ICS files for trip itineraries
 */

interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startDate: Date
  endDate: Date
  url?: string
}

/**
 * Generate ICS file content from events
 */
export function generateICS(events: CalendarEvent[], calendarName: string): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  const uid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tara.ph`

  const icsEvents = events.map((event) => {
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid()}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startDate)}`,
      `DTEND:${formatDate(event.endDate)}`,
      `SUMMARY:${escapeText(event.title)}`,
    ]

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`)
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`)
    }

    if (event.url) {
      lines.push(`URL:${event.url}`)
    }

    lines.push('END:VEVENT')
    return lines.join('\r\n')
  })

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tara//Trip Planner//EN',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...icsEvents,
    'END:VCALENDAR',
  ].join('\r\n')

  return ics
}

/**
 * Convert itinerary to calendar events
 */
export function itineraryToEvents(
  itinerary: {
    title: string
    start_date: string
    end_date: string
  },
  days: {
    id: string
    date: string
    title?: string
    day_number: number
  }[],
  activities: {
    id: string
    day_id: string
    title: string
    description?: string
    location?: string
    start_time?: string
    end_time?: string
  }[]
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // Add each activity as an event
  for (const day of days) {
    const dayActivities = activities.filter((a) => a.day_id === day.id)
    const dayDate = new Date(day.date)

    for (const activity of dayActivities) {
      // Parse start time or default to 9:00 AM
      const startHour = activity.start_time
        ? parseInt(activity.start_time.split(':')[0])
        : 9
      const startMinute = activity.start_time
        ? parseInt(activity.start_time.split(':')[1])
        : 0

      // Parse end time or default to 1 hour after start
      const endHour = activity.end_time
        ? parseInt(activity.end_time.split(':')[0])
        : startHour + 1
      const endMinute = activity.end_time
        ? parseInt(activity.end_time.split(':')[1])
        : startMinute

      const startDate = new Date(dayDate)
      startDate.setHours(startHour, startMinute, 0, 0)

      const endDate = new Date(dayDate)
      endDate.setHours(endHour, endMinute, 0, 0)

      // If end is before start (overnight), add a day
      if (endDate <= startDate) {
        endDate.setHours(startHour + 1, startMinute, 0, 0)
      }

      events.push({
        title: activity.title,
        description: activity.description,
        location: activity.location,
        startDate,
        endDate,
      })
    }

    // If no activities for the day, add a placeholder event
    if (dayActivities.length === 0) {
      const startDate = new Date(dayDate)
      startDate.setHours(9, 0, 0, 0)

      const endDate = new Date(dayDate)
      endDate.setHours(18, 0, 0, 0)

      events.push({
        title: `${itinerary.title} - Day ${day.day_number}`,
        description: day.title || `Day ${day.day_number} of your trip`,
        startDate,
        endDate,
      })
    }
  }

  return events
}

/**
 * Download ICS file
 */
export function downloadICS(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate Google Calendar URL for an event
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`,
    details: event.description || '',
    location: event.location || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate Google Calendar URL for entire trip
 */
export function getTripGoogleCalendarUrl(
  itinerary: { title: string; start_date: string; end_date: string },
  tripUrl: string
): string {
  const startDate = new Date(itinerary.start_date)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(itinerary.end_date)
  endDate.setHours(23, 59, 59, 0)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: itinerary.title,
    dates: `${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    details: `Trip planned with Tara. View full itinerary: ${tripUrl}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
