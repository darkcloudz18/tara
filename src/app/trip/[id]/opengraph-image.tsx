import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

// Use Node runtime for Supabase compatibility
export const runtime = 'nodejs'
// OG images are heavy to render and rarely change. Match a typical
// share-preview cache expectation (~1 hour) so Slack / Twitter / iMessage
// unfurls don't hammer origin.
export const revalidate = 3600
export const alt = 'Trip Itinerary'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Create Supabase client for server-side use
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fetchTripData(id: string) {
  // Fetch itinerary
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!itinerary) return null

  // Fetch days
  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('itinerary_id', id)
    .order('day_number', { ascending: true })

  // Fetch activities
  const dayIds = (days || []).map((d: any) => d.id)
  const { data: activities } = await supabase
    .from('itinerary_activities')
    .select('*')
    .in('day_id', dayIds)
    .order('order_index', { ascending: true })

  return { itinerary, days: days || [], activities: activities || [] }
}

export default async function OGImage({ params }: { params: { id: string } }) {
  const data = await fetchTripData(params.id)

  if (!data) {
    // Return a default image if trip not found
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d9488',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 60, fontWeight: 'bold', color: 'white' }}>
            Trip Not Found
          </div>
          <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
            Plan your trip at tara.ph
          </div>
        </div>
      ),
      { ...size }
    )
  }

  const { itinerary, days, activities } = data
  const destination = itinerary.destinations?.[0] || 'Philippines'
  const totalDays = days.length || 1
  const totalActivities = activities.length
  const budget = itinerary.total_budget || activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0)

  // Get top 3 activities for preview
  const topActivities = activities.slice(0, 3).map((a) => a.title)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d9488',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '60px',
            height: '100%',
            position: 'relative',
          }}
        >
          {/* Top: Tara logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>Tara</span>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Destination badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '24px' }}>{destination}</span>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '24px',
                maxWidth: '900px',
              }}
            >
              {itinerary.title}
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: '48px',
                marginBottom: '32px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>{totalDays}</span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>Days</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
                  {totalActivities}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>Activities</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
                  {budget > 0 ? `₱${Math.round(budget / 1000)}k` : 'Free'}
                </span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)' }}>Budget</span>
              </div>
            </div>

            {/* Activities preview */}
            {topActivities.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                {topActivities.map((activity, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '18px',
                    }}
                  >
                    {activity}
                  </div>
                ))}
                {activities.length > 3 && (
                  <div
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '20px',
                      color: 'white',
                      fontSize: '18px',
                    }}
                  >
                    +{activities.length - 3} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '20px' }}>
              Plan your own trip for free
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                color: '#0d9488',
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              Start Planning
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
