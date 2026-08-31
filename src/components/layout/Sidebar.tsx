'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Map,
  PlusCircle,
  Bell,
  User,
  Moon,
  Sun,
  HelpCircle,
  ChevronRight,
  MapPin,
  Calendar,
  LogOut,
} from 'lucide-react'
import BucketPin from '@/components/icons/BucketPin'
import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@/contexts/UserContext'
import TaraLogo from '@/components/icons/TaraLogo'
import { useLocalizedTrip } from '@/hooks/useLocalizedTrip'
import { supabase } from '@/lib/supabase'
import { Itinerary } from '@/types/database'
import { readCachedTripSummary, writeCachedTripSummary } from '@/lib/tripCache'
import { notificationService } from '@/features/notifications/services/notificationService'

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  requiresAuth?: boolean
  badge?: number
}

export default function Sidebar() {
  const { user, loading: authLoading } = useUser()
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    // Providers' SIGNED_OUT listener resets analytics; UserContext's
    // subscription drops the user. Push to /login for the immediate visual.
    router.push('/login')
  }
  const [collapsed, setCollapsed] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()
  const t = useLocalizedTrip()
  // Seed activeTrip from the localStorage summary so BUILDING renders
  // immediately for returning users. Real fetch overwrites with fresh
  // data. See src/lib/tripCache.ts for the trade-off.
  const [activeTrip, setActiveTrip] = useState<Itinerary | null>(() => {
    const cached = readCachedTripSummary()
    return cached ? (cached as Itinerary) : null
  })
  // Split "resolved" into two independent signals so we never briefly
  // render the empty-state hero for a user whose trip fetch just hasn't
  // returned yet. Both must be true before showing "Start your lakad";
  // "Building lakad" renders as soon as activeTrip is set (data trumps
  // both flags — no confirmation needed for the affirmative case).
  const [tripFetchDone, setTripFetchDone] = useState(false)
  const [sdkConfirmed, setSdkConfirmed] = useState(false)
  const [tripPlaceCount, setTripPlaceCount] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Fetch user's most recent trip + notifications.
  //
  // Two subtleties keyed to the slow Supabase getSession() path:
  //
  // 1. We depend on user?.id, not the full user object. onAuthStateChange
  //    fires SIGNED_IN with a fresh User reference at ~7s (same id, new
  //    object identity) after the SDK's initial validation lands. Re-running
  //    the effect on that fire was flipping tripsResolved false → true and
  //    causing the hero to blink.
  //
  // 2. The first fetch can race the SDK's real auth arriving and come back
  //    empty for users who genuinely do have trips (RLS sees no JWT yet).
  //    We only latch tripsResolved when either the fetch returns data OR
  //    Supabase confirms the session via INITIAL_SESSION / SIGNED_IN. The
  //    same events also trigger a re-fetch, so a raced-empty gets corrected.
  const userId = user?.id ?? null
  useEffect(() => {
    if (!userId) {
      setActiveTrip(null)
      setTripPlaceCount(0)
      setUnreadNotifications(0)
      setTripFetchDone(!authLoading)
      setSdkConfirmed(!authLoading)
      return
    }

    let cancelled = false
    setTripFetchDone(false)
    setSdkConfirmed(false)

    // sdkKnown is passed in explicitly (rather than read from
    // sdkConfirmed state) because the closure captured at effect-run
    // time would always see false. The retry from onAuthStateChange
    // passes true.
    const fetchTrip = (sdkKnown: boolean) => {
      supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (cancelled) return
          setTripFetchDone(true)
          if (data) {
            setActiveTrip(data)
            writeCachedTripSummary({
              id: data.id,
              user_id: data.user_id,
              title: data.title,
              destinations: data.destinations ?? [],
              start_date: data.start_date,
              end_date: data.end_date,
              updated_at: data.updated_at,
            })
          } else if (sdkKnown) {
            // SDK settled + fetch empty = user really has no trip. Clear
            // both the state (in case the cached-summary initializer
            // populated it) and the cache.
            setActiveTrip(null)
            writeCachedTripSummary(null)
          }
          if (data) {
            supabase
              .from('itinerary_days')
              .select('id')
              .eq('itinerary_id', data.id)
              .then(({ data: days }) => {
                if (cancelled || !days || days.length === 0) return
                supabase
                  .from('itinerary_activities')
                  .select('id', { count: 'exact' })
                  .in('day_id', days.map((d) => d.id))
                  .then(({ count }) => {
                    if (!cancelled) setTripPlaceCount(count || 0)
                  })
              })
          }
        })
    }

    fetchTrip(false)
    notificationService.getUnreadCount(userId).then(setUnreadNotifications)

    // SDK confirmation + retry. We only flip sdkConfirmed once we've
    // seen an INITIAL_SESSION or SIGNED_IN — that's the earliest point
    // at which an empty fetch result is trustworthy. Also re-fires
    // fetchTrip so a raced-empty first attempt gets corrected.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setSdkConfirmed(true)
          if (session?.user.id === userId) fetchTrip(true)
        }
      }
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [userId, authLoading])

  // Subscribe to real-time notifications. Keyed on userId (not user
  // object) so the fresh-reference SIGNED_IN fire doesn't tear down and
  // rebuild the subscription for no reason.
  useEffect(() => {
    if (!userId) return

    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      () => {
        notificationService.getUnreadCount(userId).then(setUnreadNotifications)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const mainNavItems: NavItem[] = [
    { icon: Compass, label: 'Discover', href: '/' },
    // Bucket list works logged-out — no requiresAuth. Placed in main nav
    // because the funnel is Discover → Bucket → dated lakad.
    { icon: BucketPin, label: 'Bucket list', href: '/bucket' },
  ]

  const tripNavItems: NavItem[] = [
    { icon: Map, label: t.myTrips, href: '/dashboard', requiresAuth: true },
    { icon: PlusCircle, label: `New ${t.trip}`, href: '/trip/new', requiresAuth: true },
  ]

  const accountNavItems: NavItem[] = [
    { icon: Bell, label: 'Notifications', href: '/notifications', requiresAuth: true, badge: unreadNotifications },
    { icon: User, label: 'Profile', href: '/profile', requiresAuth: true },
  ]

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href)
    const Icon = item.icon
    const href = item.requiresAuth && !user ? '/login' : item.href

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
          active
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <div className="relative">
          <Icon
            className={`w-6 h-6 transition-transform group-hover:scale-110 ${
              active ? 'text-gray-900 dark:text-white' : ''
            }`}
          />
          {item.badge && item.badge > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
            {item.label}
          </span>
        )}
      </Link>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } hidden lg:flex flex-col`}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <TaraLogo className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Tara</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Travel Philippines</p>
            </div>
          )}
        </Link>
      </div>

      {/* Hero slot — reserve height so a late-arriving card (SDK auth
          taking 7s+ on cold loads) can't shift the nav 100+px 8 seconds
          into the session. Height is set to the max the slot can hold
          (BUILDING LAKAD ~148px) plus its own mb-4. */}
      {!collapsed && <div className="min-h-[164px]">
      {user && activeTrip && (
        <div className="px-3 mb-4">
          <Link
            href={`/trip/${activeTrip.id}/edit`}
            className="block p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl text-white hover:from-teal-600 hover:to-teal-700 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-teal-100 uppercase tracking-wide">
                Building lakad
              </span>
              <ChevronRight className="w-4 h-4 text-teal-200 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="font-bold text-sm truncate mb-1">{activeTrip.title}</p>
            <div className="flex items-center gap-3 text-xs text-teal-100">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tripPlaceCount} places
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(activeTrip.start_date)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-teal-400/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all"
                style={{ width: `${Math.min(tripPlaceCount * 10, 100)}%` }}
              />
            </div>
          </Link>
        </div>
      )}

      {/* Create Trip CTA for users without trips. Requires BOTH the
          fetch to have returned AND the SDK to have confirmed, so we
          never briefly render "Start your lakad" for a user whose fetch
          just raced the SDK's slow initial validation. */}
      {user && !activeTrip && tripFetchDone && sdkConfirmed && (
        <div className="px-3 mb-4">
          <Link
            href="/trip/new"
            className="block p-4 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-xl text-center hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            <PlusCircle className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              Start your lakad
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Browse & add places
            </p>
          </Link>
        </div>
      )}
      </div>}

      {/* Main Navigation */}
      {/* Bottom fade so any content clipped by the scroll edge (e.g. the
          Account label at ~719px viewport heights) reads as a soft
          cutoff rather than a broken row. */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,black_0,black_calc(100%-20px),transparent_100%)]">
        {/* Discover Section */}
        {!collapsed && (
          <p className="px-4 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Explore
          </p>
        )}
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Trip Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Your {t.trips}
          </p>
        )}
        {tripNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {/* Account Section */}
        {!collapsed && (
          <p className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Account
          </p>
        )}
        {accountNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-6 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 group"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-6 h-6 transition-transform group-hover:scale-110" />
          ) : (
            <Moon className="w-6 h-6 transition-transform group-hover:scale-110" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Help */}
        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 group"
        >
          <HelpCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
          {!collapsed && <span className="text-sm font-medium">Help & Support</span>}
        </Link>

        {/* User Profile / Login — during auth-resolve, render a placeholder
            with the same height as the profile row so we don't flash
            "Sign in" and then swap to the user card. */}
        {authLoading ? (
          <div
            aria-hidden="true"
            className="flex items-center gap-3 px-4 py-3 mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            {!collapsed && (
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            )}
          </div>
        ) : user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-3 mt-2 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 mt-1 w-full rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">Sign out</span>}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <User className="w-6 h-6" />
            {!collapsed && <span className="text-sm font-medium">Sign in</span>}
          </Link>
        )}
      </div>
    </aside>
  )
}
