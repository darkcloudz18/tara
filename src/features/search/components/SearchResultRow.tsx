'use client'

import { useEffect, useState } from 'react'
import { MapPin, Star } from 'lucide-react'
import { DiscoverPlace } from '@/features/planner/services/placeService'
import {
  addToBucketList,
  removeFromBucketByPlace,
  isInBucketList,
} from '@/features/planner/services/bucketListService'
import { useToast } from '@/contexts/ToastContext'
import BucketPin from '@/components/icons/BucketPin'

interface SearchResultRowProps {
  place: DiscoverPlace
  onOpen: () => void
}

// Row layout: image | info | save. Save is the same bucket flow used on
// Discover (PlaceCard). Un-save from this surface still routes to
// /bucket, matching the "un-save needs bucket-item-id caching" followup
// on PlaceCard.
export default function SearchResultRow({ place, onOpen }: SearchResultRowProps) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    const sourceId = place.source === 'tara' ? place.sourceId : place.id
    isInBucketList(sourceId, place.source).then((present) => {
      if (!cancelled) setSaved(present)
    })
    return () => {
      cancelled = true
    }
  }, [place.id, place.source, place.sourceId])

  async function handleSave(e: React.MouseEvent) {
    e.stopPropagation()
    if (saving) return
    setSaving(true)
    const nextSaved = !saved
    setSaved(nextSaved) // optimistic
    const sourceId = place.source === 'tara' ? place.sourceId : place.id
    try {
      if (nextSaved) {
        await addToBucketList(place)
        const shown = localStorage.getItem('tara-first-save-toast-shown')
        if (!shown) {
          toast.success('Saved', 'Sign in anytime to keep your list.')
          localStorage.setItem('tara-first-save-toast-shown', '1')
        }
      } else {
        await removeFromBucketByPlace(sourceId, place.source)
      }
    } catch (err) {
      console.error('Failed to save/unsave from search:', err)
      setSaved(!nextSaved) // revert
      toast.error("Couldn't save", 'Try again in a moment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
        {place.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.photos[0]}
            alt={place.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {place.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          {place.location}
        </p>
        <div className="flex items-center gap-3 mt-2">
          {place.rating > 0 && (
            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {place.rating.toFixed(1)}
            </span>
          )}
          {place.estimatedCost !== undefined && place.estimatedCost !== null && (
            <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">
              ₱{place.estimatedCost.toLocaleString()}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 capitalize">
            {place.category}
          </span>
        </div>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        aria-label={saved ? 'Saved to bucket list' : 'Save to bucket list'}
        aria-pressed={saved}
        className="self-start min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-gray-700 dark:text-gray-200"
      >
        <BucketPin filled={saved} className="w-5 h-5" />
      </button>
    </div>
  )
}
