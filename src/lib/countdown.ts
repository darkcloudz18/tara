export function daysUntil(startDate: string, now: Date = new Date()): number {
  const start = new Date(startDate)
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffMs = startMidnight.getTime() - todayMidnight.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export type TripPhase = 'upcoming' | 'today' | 'active' | 'past'

export function tripPhase(
  startDate: string,
  endDate: string | null,
  now: Date = new Date()
): TripPhase {
  const days = daysUntil(startDate, now)
  if (days > 0) return 'upcoming'
  if (days === 0) return 'today'
  if (endDate) {
    const daysAfterEnd = daysUntil(endDate, now)
    if (daysAfterEnd >= 0) return 'active'
  }
  return 'past'
}

export function tripPhaseCopy(
  startDate: string,
  endDate: string | null,
  destination: string,
  now: Date = new Date()
): string {
  switch (tripPhase(startDate, endDate, now)) {
    case 'upcoming': {
      const n = daysUntil(startDate, now)
      return `${destination} is ${n} ${n === 1 ? 'day' : 'days'} away`
    }
    case 'today':
      return `${destination} starts today`
    case 'active':
      return `${destination} is happening now`
    case 'past':
      return `How was ${destination}?`
  }
}
