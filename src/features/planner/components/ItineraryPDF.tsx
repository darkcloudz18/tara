'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import { Itinerary, ItineraryDay, ItineraryActivity } from '@/types/database'

// Register fonts (using system fonts)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: '#6b7280',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    gap: 20,
  },
  statBox: {
    backgroundColor: '#f0fdfa',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 16,
  },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    color: 'white',
    textAlign: 'center',
    lineHeight: 32,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  dayDate: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  activityList: {
    paddingLeft: 44,
  },
  activity: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityTime: {
    width: 50,
    fontSize: 9,
    color: '#6b7280',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 9,
    color: '#6b7280',
  },
  activityDescription: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 2,
  },
  activityCost: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0d9488',
    textAlign: 'right',
    width: 70,
  },
  budgetSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
  },
  budgetTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  budgetValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  budgetTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#99f6e4',
  },
  budgetTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  budgetTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 9,
    color: '#0d9488',
    fontWeight: 'bold',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

interface ItineraryPDFProps {
  itinerary: Itinerary
  days: ItineraryDay[]
  activities: ItineraryActivity[]
  travelers?: number
}

// PDF Document Component
export function ItineraryPDFDocument({
  itinerary,
  days,
  activities,
  travelers = 1,
}: ItineraryPDFProps) {
  const destination = itinerary.destinations?.[0] || 'Philippines'
  const totalDays = days.length
  const totalActivities = activities.length
  const totalBudget = activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0)
  const perPerson = travelers > 0 ? totalBudget / travelers : totalBudget

  // Group activities by day
  const dayActivities = days.map((day) => ({
    ...day,
    activities: activities
      .filter((a) => a.day_id === day.id)
      .sort((a, b) => a.order_index - b.order_index),
  }))

  // Calculate budget by category
  const budgetByCategory: Record<string, number> = {}
  activities.forEach((a) => {
    const category = a.place_type || 'other'
    budgetByCategory[category] = (budgetByCategory[category] || 0) + (a.estimated_cost || 0)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateRange = () => {
    const start = new Date(itinerary.start_date)
    const end = new Date(itinerary.end_date)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Tara</Text>
          <Text style={styles.tagline}>Your Philippine Adventure Awaits</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{itinerary.title}</Text>
        <Text style={styles.subtitle}>{destination} | {formatDateRange()}</Text>
        {itinerary.description && (
          <Text style={styles.subtitle}>{itinerary.description}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalDays}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalActivities}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatCurrency(totalBudget)}</Text>
            <Text style={styles.statLabel}>Total Budget</Text>
          </View>
          {travelers > 1 && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatCurrency(perPerson)}</Text>
              <Text style={styles.statLabel}>Per Person</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Day by Day Itinerary */}
        {dayActivities.map((day) => (
          <View key={day.id} style={styles.daySection} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayNumber}>{day.day_number}</Text>
              <View>
                <Text style={styles.dayTitle}>
                  {day.title || `Day ${day.day_number}`}
                </Text>
                <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
              </View>
            </View>

            <View style={styles.activityList}>
              {day.activities.length === 0 ? (
                <Text style={styles.activityDescription}>No activities planned</Text>
              ) : (
                day.activities.map((activity) => (
                  <View key={activity.id} style={styles.activity}>
                    <Text style={styles.activityTime}>
                      {activity.start_time || '--:--'}
                    </Text>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.location && (
                        <Text style={styles.activityLocation}>{activity.location}</Text>
                      )}
                      {activity.description && (
                        <Text style={styles.activityDescription}>
                          {activity.description}
                        </Text>
                      )}
                    </View>
                    {activity.estimated_cost ? (
                      <Text style={styles.activityCost}>
                        {formatCurrency(activity.estimated_cost)}
                      </Text>
                    ) : (
                      <Text style={styles.activityCost}>-</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        ))}

        {/* Budget Summary */}
        <View style={styles.budgetSection} wrap={false}>
          <Text style={styles.budgetTitle}>Budget Summary</Text>
          {Object.entries(budgetByCategory)
            .filter(([_, amount]) => amount > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <View key={category} style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.budgetValue}>{formatCurrency(amount)}</Text>
              </View>
            ))}
          <View style={styles.budgetTotal}>
            <Text style={styles.budgetTotalLabel}>Total</Text>
            <Text style={styles.budgetTotalValue}>{formatCurrency(totalBudget)}</Text>
          </View>
          {travelers > 1 && (
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Per Person ({travelers} travelers)</Text>
              <Text style={styles.budgetValue}>{formatCurrency(perPerson)}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerBrand}>Planned with Tara</Text>
          <Text style={styles.footerText}>tara.ph - Free Trip Planner for the Philippines</Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

// Function to generate and download PDF
export async function downloadItineraryPDF(
  itinerary: Itinerary,
  days: ItineraryDay[],
  activities: ItineraryActivity[],
  travelers?: number
): Promise<void> {
  const blob = await pdf(
    <ItineraryPDFDocument
      itinerary={itinerary}
      days={days}
      activities={activities}
      travelers={travelers}
    />
  ).toBlob()

  // Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${itinerary.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-itinerary.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
