/**
 * Web Push Notifications Service
 *
 * Note: For production, you'll need to:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set up a backend endpoint to send push notifications
 * 3. Store subscription in your database
 */

// Public VAPID key (replace with your own in production)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export const pushService = {
  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    )
  },

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported')
    }

    const permission = await Notification.requestPermission()
    return permission
  },

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported')
      return null
    }

    try {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return null
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY ? this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : undefined,
      })

      const json = subscription.toJSON()

      return {
        endpoint: json.endpoint!,
        keys: {
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
      }
    } catch (error) {
      console.error('Failed to subscribe to push:', error)
      return null
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      return false
    }
  },

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      return !!subscription
    } catch {
      return false
    }
  },

  /**
   * Show a local notification (doesn't require push subscription)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.isSupported()) return

    const permission = await this.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    })
  },

  /**
   * Convert VAPID key to Uint8Array
   */
  urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }

    return outputArray.buffer
  },
}

// Notification types for the app
export type NotificationType =
  | 'trip_reminder'
  | 'collaborator_joined'
  | 'trip_comment'
  | 'trip_like'
  | 'trip_shared'

export interface AppNotification {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, any>
  url?: string
}

/**
 * Show app notification (uses local notification if push not available)
 */
export async function showAppNotification(notification: AppNotification): Promise<void> {
  await pushService.showLocalNotification(notification.title, {
    body: notification.body,
    tag: notification.type,
    data: {
      url: notification.url,
      ...notification.data,
    },
  })
}
