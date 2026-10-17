import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Place guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default async function PlaceOGImage({ params }: { params: { slug: string } }) {
  const { data: place } = await supabase
    .from('places')
    .select('name, summary, entrance_fee, fee_notes, duration_minutes, destination_id, photos')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!place) {
    return new ImageResponse(
      (
        <div style={fallbackStyle}>
          <div style={{ fontSize: 60, fontWeight: 'bold', color: 'white' }}>
            Place not found
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
            Plan your trip at taralakad.com
          </div>
        </div>
      ),
      { ...size },
    )
  }

  let destinationName: string | null = null
  if (place.destination_id) {
    const { data: dest } = await supabase
      .from('destinations')
      .select('name')
      .eq('id', place.destination_id)
      .maybeSingle()
    destinationName = dest?.name ?? null
  }

  const feeLabel = formatFee(place.entrance_fee, place.fee_notes)
  const duration = formatDuration(place.duration_minutes)

  return new ImageResponse(
    (
      <div style={{ ...pageStyle, backgroundColor: '#0f172a' }}>
        <div style={patternStyle} />
        <div style={contentWrapperStyle}>
          <div style={brandRowStyle}>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Tara</span>
            {destinationName && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22 }}>
                · {destinationName}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <div style={{ fontSize: 72, fontWeight: 'bold', color: 'white', lineHeight: 1.05, marginBottom: 20, maxWidth: 950 }}>
              {place.name}
            </div>
            {place.summary && (
              <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3, maxWidth: 900, marginBottom: 36 }}>
                {place.summary.slice(0, 200)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16 }}>
              <StatPill label="Fee" value={feeLabel} />
              {duration && <StatPill label="Visit" value={duration} />}
            </div>
          </div>
          <div style={bottomRowStyle}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>
              Current · sourced · Philippine-specific
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }}>
              taralakad.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 24px',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
      }}
    >
      <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 32, fontWeight: 'bold', color: 'white' }}>{value}</span>
    </div>
  )
}

function formatFee(fee: number | null, notes: string | null): string {
  if (fee === 0) return 'Free'
  if (fee !== null && fee !== undefined) return `₱${fee.toLocaleString()}`
  if (typeof notes === 'string' && /free/i.test(notes)) return 'Free'
  return '—'
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const hours = minutes / 60
  if (hours % 1 === 0) return `${hours} h`
  return `${hours.toFixed(1)} h`
}

const pageStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  fontFamily: 'sans-serif',
}

const patternStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.06) 2px, transparent 0)',
  backgroundSize: '50px 50px',
}

const contentWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '60px',
  height: '100%',
  position: 'relative',
}

const brandRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 40,
}

const bottomRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 24,
  borderTop: '1px solid rgba(255,255,255,0.15)',
}

const fallbackStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0f172a',
  fontFamily: 'sans-serif',
}
