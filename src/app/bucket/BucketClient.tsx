'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, AlertCircle, Trash2 } from 'lucide-react'
import BucketPin from '@/components/icons/BucketPin'
import { AppShell } from '@/components/layout'
import { useUser } from '@/contexts/UserContext'
import { getBucketList, removeFromBucketList, BucketListItem } from '@/features/planner/services/bucketListService'
import { PlaceCardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/contexts/ToastContext'
import { capture } from '@/lib/analytics'
import DatePromptCard from '@/features/planner/components/DatePromptCard'
import MatchingTemplateCard from '@/features/planner/components/MatchingTemplateCard'

export default function BucketClient() {
  const { user } = useUser()
  const [items, setItems] = useState<BucketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    loadBucket()
  }, [])

  async function loadBucket() {
    setLoading(true)
    setHasError(false)
    try {
      const data = await getBucketList()
      setItems(data)
      capture('date_prompt_shown', { itemCount: data.length })
    } catch (err) {
      console.error('Failed to load bucket list:', err)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id)
    const previous = items
    setItems((prev) => prev.filter((it) => it.id !== id)) // optimistic
    try {
      await removeFromBucketList(id)
    } catch (err) {
      console.error('Failed to remove from bucket:', err)
      setItems(previous)
      toast.error('Couldn\u2019t remove', 'Try again in a moment.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <AppShell>
      <main className="max-w-7xl mx-auto px-4 py-6 pb-20 lg:pb-8">
        {/* Section title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your bucket list</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Places you&rsquo;ve saved, ready to become a lakad.
          </p>
        </div>

        {/* Matching template + date prompt — only surface when the
            bucket has at least one saved place. Empty-state message
            below handles the zero case. */}
        {!loading && !hasError && items.length > 0 && (
          <>
            <MatchingTemplateCard />
            <DatePromptCard itemCount={items.length} />
          </>
        )}

        {/* Template matching placeholder — filled in a later task */}
        {/* TODO: template matching — recommend templates that overlap with saved places */}

        {/* Saved places grid — four states */}
        {hasError ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Couldn&rsquo;t load your bucket list
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
              Check your connection and try again.
            </p>
            <button
              onClick={loadBucket}
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
              <BucketPin className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No places saved yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-4 max-w-sm">
              Tap the bookmark on any place in Discover to start your list.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-teal-500 text-white rounded-xl font-semibold hover:bg-teal-600 transition-colors"
            >
              Explore destinations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                  {item.place_image_url ? (
                    <Image
                      src={item.place_image_url}
                      alt={item.place_name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {item.place_name}
                  </h3>
                  {item.place_location && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {item.place_location}
                    </p>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    aria-label={`Remove ${item.place_name} from bucket list`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}
