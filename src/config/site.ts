export const siteConfig = {
  name: 'Tara',
  description: 'All-in-one travel platform for the Philippines. Plan trips, discover content, and book with confidence.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.jpg',
  links: {
    facebook: 'https://facebook.com/taraph',
    instagram: 'https://instagram.com/taraph',
    tiktok: 'https://tiktok.com/@taraph',
  },
  keywords: [
    'Philippines travel',
    'travel planner',
    'book hotels Philippines',
    'travel content',
    'trip planning',
    'Palawan',
    'Boracay',
    'Siargao',
    'budget travel Philippines',
  ],
}

export const appConfig = {
  features: {
    socialFeed: true,
    tripPlanner: true,
    booking: true,
    messaging: false, // Coming soon
    liveStreaming: false, // Phase 2
  },
  limits: {
    maxItinerariesPerUser: 50,
    maxPhotosPerPost: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  commission: {
    platform: 0.12, // 12% platform fee
    creator: 0.06, // 6% creator affiliate
  },
}
