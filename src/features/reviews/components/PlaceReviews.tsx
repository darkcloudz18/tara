'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, User, Send, Loader2 } from 'lucide-react'
import { supabase, getUserSafe } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/contexts/ToastContext'

interface Review {
  id: string
  place_id: string
  user_id: string
  rating: number
  content: string
  helpful_count: number
  created_at: string
  user?: {
    username: string | null
    first_name: string | null
    photo_url: string | null
  }
}

interface PlaceReviewsProps {
  placeId: string
  placeName: string
}

export default function PlaceReviews({ placeId, placeName }: PlaceReviewsProps) {
  const { success, error } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)

  // Review form state
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    const init = async () => {
      const user = await getUserSafe()
      if (user) {
        setUserId(user.id)
      }
      loadReviews()
    }
    init()
  }, [placeId])

  const loadReviews = async () => {
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('place_reviews')
      .select(`
        *,
        user:profiles(username, first_name, photo_url)
      `)
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error loading reviews:', fetchError)
    } else {
      const transformedReviews = (data || []).map((r: any) => ({
        ...r,
        user: Array.isArray(r.user) ? r.user[0] : r.user,
      }))
      setReviews(transformedReviews)

      // Check if user has already reviewed
      if (userId) {
        const existing = transformedReviews.find((r: Review) => r.user_id === userId)
        setUserReview(existing || null)
      }
    }

    setLoading(false)
  }

  const submitReview = async () => {
    if (!userId || !content.trim()) return

    setSubmitting(true)

    try {
      if (userReview) {
        // Update existing review
        const { error: updateError } = await supabase
          .from('place_reviews')
          .update({ rating, content, updated_at: new Date().toISOString() })
          .eq('id', userReview.id)

        if (updateError) throw updateError
        success('Review updated!')
      } else {
        // Create new review
        const { error: insertError } = await supabase
          .from('place_reviews')
          .insert({
            place_id: placeId,
            user_id: userId,
            rating,
            content,
          })

        if (insertError) throw insertError
        success('Review submitted!')
      }

      setShowForm(false)
      setContent('')
      setRating(5)
      loadReviews()
    } catch (err: any) {
      error(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const markHelpful = async (reviewId: string) => {
    const { error: updateError } = await supabase
      .from('place_reviews')
      .update({ helpful_count: supabase.rpc('increment_helpful', { review_id: reviewId }) })
      .eq('id', reviewId)

    if (!updateError) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: r.helpful_count + 1 } : r
        )
      )
    }
  }

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Reviews
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(avgRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {avgRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
          </div>
          {userId && !showForm && (
            <button
              onClick={() => {
                if (userReview) {
                  setRating(userReview.rating)
                  setContent(userReview.content)
                }
                setShowForm(true)
              }}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
            >
              {userReview ? 'Edit Review' : 'Write Review'}
            </button>
          )}
        </div>
      </div>

      {/* Review form */}
      {showForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Your Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Your Review
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Share your experience at ${placeName}...`}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={submitReview}
              disabled={!content.trim() || submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No reviews yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Be the first to review {placeName}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* User avatar */}
                {review.user?.photo_url ? (
                  <img
                    src={review.user.photo_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {(review.user?.first_name?.[0] ||
                      review.user?.username?.[0] ||
                      'U'
                    ).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {review.user?.first_name || review.user?.username || 'Traveler'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Rating stars */}
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review content */}
                  <p className="mt-2 text-gray-700 dark:text-gray-300">
                    {review.content}
                  </p>

                  {/* Helpful button */}
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    Helpful ({review.helpful_count || 0})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
