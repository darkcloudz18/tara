import HomeClient, { FeedItem } from './HomeClient'
import { fetchTaraPlaces, DiscoverPlace } from '@/features/planner/services/placeService'
import { fetchCuratedVideos, FeedVideo } from '@/features/discover/services/videoService'

export const revalidate = 300

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

function interleave(places: DiscoverPlace[], videos: FeedVideo[]): FeedItem[] {
  const placeItems: FeedItem[] = places.map((p) => ({ type: 'place', data: p }))
  const videoItems: FeedItem[] = videos.map((v) => ({ type: 'video', data: v }))
  const mixed: FeedItem[] = []
  let videoIndex = 0

  placeItems.forEach((place, index) => {
    mixed.push(place)
    if ((index + 1) % 3 === 0 && videoIndex < videoItems.length) {
      mixed.push(videoItems[videoIndex])
      videoIndex++
    }
  })

  while (videoIndex < videoItems.length) {
    mixed.push(videoItems[videoIndex])
    videoIndex++
  }

  return mixed
}

export default async function HomePage() {
  let initialItems: FeedItem[] = []
  let initialError = false

  try {
    const [places, videos] = await Promise.all([
      withTimeout(fetchTaraPlaces(30), 3000),
      withTimeout(fetchCuratedVideos(10), 3000),
    ])
    initialItems = interleave(places, videos)
    if (initialItems.length === 0) {
      initialError = true
    }
  } catch {
    initialError = true
  }

  return <HomeClient initialItems={initialItems} initialError={initialError} />
}
