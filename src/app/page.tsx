'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Compass, User, Bookmark, Search, X } from 'lucide-react'
import { DiscoverFeed } from '@/features/discover'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [currentCreatorId, setCurrentCreatorId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLoginRequired = () => {
    setShowLoginPrompt(true)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌴</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Tara
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {user ? (
              <>
                {/* Bucket List */}
                <Link
                  href="/planner"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bookmark className="w-5 h-5 text-gray-600" />
                </Link>

                {/* Profile */}
                <Link
                  href="/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="pt-16">
        <DiscoverFeed
          onLoginRequired={handleLoginRequired}
          currentVideoCreatorId={currentCreatorId}
          setCurrentVideoCreatorId={setCurrentCreatorId}
        />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="flex items-center justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-1 px-4 py-2 text-primary-600">
            <Compass className="w-6 h-6" />
            <span className="text-xs font-medium">Discover</span>
          </Link>
          <Link href="/planner" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-900">
            <Bookmark className="w-6 h-6" />
            <span className="text-xs font-medium">Bucket List</span>
          </Link>
          <Link
            href={user ? '/dashboard' : '/login'}
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 hover:text-gray-900"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">{user ? 'Profile' : 'Login'}</span>
          </Link>
        </div>
      </nav>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative animate-scale-in">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Save to Bucket List
              </h2>
              <p className="text-gray-600">
                Create a free account to save places and plan your trips!
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/register"
                className="block w-full py-3 bg-primary-600 text-white text-center rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Sign Up Free
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 bg-gray-100 text-gray-700 text-center rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Already have an account? Login
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              By signing up, you agree to our Terms of Service
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
