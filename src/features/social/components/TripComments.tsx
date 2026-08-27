'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, Loader2 } from 'lucide-react'
import { socialService, TripComment } from '../services/socialService'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { formatDistanceToNow } from 'date-fns'

interface TripCommentsProps {
  itineraryId: string
  isPublic: boolean
}

export default function TripComments({ itineraryId, isPublic }: TripCommentsProps) {
  const [comments, setComments] = useState<TripComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { user } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load comments
    loadComments()

    // Subscribe to new comments
    const unsubscribe = socialService.subscribeToComments(itineraryId, (newComment) => {
      setComments(prev => {
        // Avoid duplicates
        if (prev.find(c => c.id === newComment.id)) return prev
        return [...prev, newComment]
      })
    })

    return () => unsubscribe()
  }, [itineraryId])

  const loadComments = async () => {
    setLoading(true)
    const data = await socialService.getComments(itineraryId)
    setComments(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    const comment = await socialService.addComment(itineraryId, user.id, newComment)
    if (comment) {
      setComments(prev => [...prev, comment])
      setNewComment('')
    }
    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    const success = await socialService.deleteComment(commentId)
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  if (!isPublic) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {/* Comments list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                    {comment.user?.photo_url ? (
                      <img
                        src={comment.user.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (comment.user?.first_name?.[0] || comment.user?.username?.[0] || 'U').toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {comment.user?.first_name || comment.user?.username || 'User'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {comment.content}
                    </p>
                  </div>

                  {/* Delete button (only for own comments) */}
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment input */}
      {user ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 dark:text-white"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <a href="/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
              Sign in
            </a>{' '}
            to leave a comment
          </p>
        </div>
      )}
    </div>
  )
}
