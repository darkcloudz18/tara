'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'
import { pushService } from '@/lib/pushNotifications'

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setLoading(true)
    setSupported(pushService.isSupported())
    setPermission(pushService.getPermissionStatus())
    setSubscribed(await pushService.isSubscribed())
    setLoading(false)
  }

  const handleToggle = async () => {
    setLoading(true)

    if (subscribed) {
      await pushService.unsubscribe()
      setSubscribed(false)
    } else {
      const result = await pushService.subscribe()
      if (result) {
        setSubscribed(true)
        // Here you would save the subscription to your backend
        console.log('Subscription:', result)
      }
    }

    setPermission(pushService.getPermissionStatus())
    setLoading(false)
  }

  if (!supported) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <BellOff className="w-5 h-5" />
          <span className="text-sm">Push notifications are not supported in this browser</span>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <BellOff className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Notifications blocked</p>
            <p className="text-xs mt-1">Please enable notifications in your browser settings</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${subscribed ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <Bell className={`w-5 h-5 ${subscribed ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subscribed ? 'You will receive notifications' : 'Get notified about trip updates'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            subscribed
              ? 'bg-teal-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
          ) : (
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                subscribed ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            >
              {subscribed && (
                <Check className="w-3 h-3 text-teal-500 absolute top-1 left-1" />
              )}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
