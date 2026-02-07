import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from '@/components/Providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tara.ph'),
  title: {
    default: 'Tara - Free Trip Planner for the Philippines',
    template: '%s | Tara',
  },
  description: 'Plan your perfect Philippine adventure with Tara. Discover destinations, create detailed itineraries, and share trips with friends - all for free.',
  keywords: ['Philippines travel', 'trip planner', 'itinerary', 'travel app', 'Philippine destinations', 'free trip planner', 'Palawan', 'Boracay', 'Cebu', 'Siargao'],
  authors: [{ name: 'Tara' }],
  creator: 'Tara',
  publisher: 'Tara',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
    url: '/',
    siteName: 'Tara',
    title: 'Tara - Free Trip Planner for the Philippines',
    description: 'Plan your perfect Philippine adventure with Tara. Discover destinations, create detailed itineraries, and share trips with friends.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Tara - Your Philippine Adventure Awaits',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tara - Free Trip Planner for the Philippines',
    description: 'Plan your perfect Philippine adventure with Tara. Discover destinations, create detailed itineraries, and share trips with friends.',
    images: ['/og-image.png'],
    creator: '@taratravel',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tara',
  },
  formatDetection: {
    telephone: true,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  category: 'travel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (theme === 'system' && systemDark) || (!theme && systemDark);
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-black text-gray-900 dark:text-gray-100 transition-colors">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
