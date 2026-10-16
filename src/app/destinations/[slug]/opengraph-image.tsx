import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Destination guide'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export default async function DestinationOGImage({ params }: { params: { slug: string } }) {
  const { data } = await supabase
    .from('destinations')
    .select('name, region, summary, min_viable_days, typical_days, best_months')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) {
    return new ImageResponse(
      (
        <div style={fallbackStyle}>
          <div style={{ fontSize: 60, fontWeight: 'bold', color: 'white' }}>
            Destination not found
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginTop: 20 }}>
            Plan your trip at taralakad.com
          </div>
        </div>
      ),
      { ...size },
    )
  }

  const typical =
    data.typical_days && data.min_viable_days
      ? `${data.min_viable_days}–${data.typical_days} days`
      : data.typical_days
      ? `~${data.typical_days} days`
      : data.min_viable_days
      ? `${data.min_viable_days}+ days`
      : null

  return new ImageResponse(
    (
      <div style={{ ...pageStyle, backgroundColor: '#0d9488' }}>
        <div style={patternStyle} />
        <div style={contentWrapperStyle}>
          <div style={brandRowStyle}>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Tara</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            {data.region && (
              <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                {data.region}
              </div>
            )}
            <div style={{ fontSize: 84, fontWeight: 'bold', color: 'white', lineHeight: 1, marginBottom: 24 }}>
              {data.name}
            </div>
            {data.summary && (
              <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3, maxWidth: 900, marginBottom: 32 }}>
                {data.summary.slice(0, 180)}
              </div>
            )}
            {typical && (
              <div style={pillStyle}>
                <span>Typical: {typical}</span>
              </div>
            )}
          </div>
          <div style={bottomRowStyle}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 20 }}>
              Current · sourced · Philippine-specific
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 20 }}>
              taralakad.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
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
  backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 0)',
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
  marginBottom: 40,
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: '10px 20px',
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: 'white',
  fontSize: 22,
  borderRadius: 999,
  alignSelf: 'flex-start',
}

const bottomRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: 24,
  borderTop: '1px solid rgba(255,255,255,0.2)',
}

const fallbackStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#0d9488',
  fontFamily: 'sans-serif',
}
