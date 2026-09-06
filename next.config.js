const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // Cache page navigations
    {
      urlPattern: /^https?:\/\/.*\/(?:planner|trip|search|templates|notifications|profile).*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache Supabase REST / Storage / Functions responses.
    //
    // Excludes /auth/v1/* deliberately. The previous pattern
    // `.supabase.co/*` matched auth token refreshes, and NetworkFirst
    // with networkTimeoutSeconds: 10 was the upstream cause of the
    // ~7.7s cold-load getSession() latency (Task 12): every cold-load
    // token refresh had to wait up to 10s for the service worker to
    // decide network vs cache before Supabase JS's onAuthStateChange
    // could fire. Auth requests must never be cached — a stale token
    // response is actively harmful — and shouldn't race a timeout
    // either. Letting them pass through with no runtimeCaching rule
    // returns them to the browser's default fetch path.
    {
      urlPattern: /^https:\/\/[^/]+\.supabase\.co\/(rest|storage|functions)\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Cache Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache images
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Cache JS and CSS
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Cache Open-Meteo weather API
    {
      urlPattern: /^https:\/\/api\.open-meteo\.com\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'weather-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 3, // 3 hours
        },
        networkTimeoutSeconds: 5,
      },
    },
    // Cache OpenStreetMap tiles
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'map-tiles',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Unsplash — seed photos on places
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage — user-uploaded photos on any project
      { protocol: 'https', hostname: '**.supabase.co' },
      // Google user avatars (OAuth profile pics)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Wikimedia Commons — seed photos on places via fetch-places-wikidata.
      // Special:FilePath serves over http first then redirects to
      // upload.wikimedia.org, so we allow both.
      { protocol: 'https', hostname: 'commons.wikimedia.org' },
      { protocol: 'http', hostname: 'commons.wikimedia.org' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

const sentryOptions = {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
}

module.exports = withSentryConfig(withPWA(nextConfig), sentryOptions)
