'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Share2,
  Users,
  Calendar,
  MapPin,
  MessageCircle,
  Info,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { notificationService } from '@/features/notifications/services/notificationService'
import { Notification, NotificationType } from '@/features/notifications/types'
import { supabase, getUserSafe } from '@/lib/supabase'
import { AppShell } from '@/components/layout'
import { formatDistanceToNow } from 'date-fns'

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  trip_shared: <Share2 className="w-5 h-5 text-blue-500" />,
  collaborator_joined: <Users className="w-5 h-5 text-green-500" />,
  trip_reminder: <Calendar className="w-5 h-5 text-orange-500" />,
  place_recommendation: <MapPin className="w-5 h-5 text-teal-500" />,
  trip_comment: <MessageCircle className="w-5 h-5 text-purple-500" />,
  system: <Info className="w-5 h-5 text-gray-500" />,
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getUserSafe()
      if (currentUser) {
        setUser(currentUser)
        setUserId(currentUser.id)
        fetchNotifications(currentUser.id)
      } else {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (notification) => {
        setNotifications((prev) => [notification, ...prev])
      }
    )

    return () => unsubscribe()
  }, [userId])

  const fetchNotifications = async (uid: string) => {
    setLoading(true)
    const data = await notificationService.getAll(uid)
    setNotifications(data)
    setLoading(false)
  }

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.is_read) return
    const success = await notificationService.markAsRead(notification.id)
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return
    const success = await notificationService.markAllAsRead(userId)
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
    }
  }

  const handleDelete = async (notificationId: string) => {
    const success = await notificationService.delete(notificationId)
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    }
  }

  const handleClearAll = async () => {
    if (!userId) return
    const success = await notificationService.clearAll(userId)
    if (success) {
      setNotifications([])
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification)
    if (notification.data?.action_url) {
      router.push(notification.data.action_url)
    } else if (notification.data?.trip_id) {
      router.push(`/trip/${notification.data.trip_id}/edit`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (!userId && !loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Sign in to view notifications</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 -ml-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 text-gray-500 hover:text-teal-600 dark:hover:text-teal-400"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                  title="Clear all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              When you get notifications, they&apos;ll show up here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white dark:bg-gray-900 rounded-xl border ${
                  notification.is_read
                    ? 'border-gray-200 dark:border-gray-800'
                    : 'border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20'
                } p-4 cursor-pointer hover:shadow-md transition-shadow`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    {NOTIFICATION_ICONS[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-medium ${
                          notification.is_read
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-teal-500 rounded-full mt-2" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start gap-1">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification)
                        }}
                        className="p-1.5 text-gray-400 hover:text-teal-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(notification.id)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </AppShell>
  )
}
