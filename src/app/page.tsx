'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bookmark, X } from 'lucide-react'
import { DiscoverFeed } from '@/features/discover'
import { Sidebar, MobileNav, DestinationStories, RightSidebar } from '@/components/layout'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [currentCreatorId, setCurrentCreatorId] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)

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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Left Sidebar - Desktop */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="lg:ml-[245px] xl:mr-[320px]">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌴</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                Tara
              </span>
            </Link>
          </div>
        </header>

        {/* Destination Stories */}
        <div className="lg:pt-0 pt-14">
          <DestinationStories
            selected={selectedDestination}
            onSelect={setSelectedDestination}
          />
        </div>

        {/* Feed */}
        <main className="max-w-[470px] mx-auto">
          <DiscoverFeed
            onLoginRequired={handleLoginRequired}
            currentVideoCreatorId={currentCreatorId}
            setCurrentVideoCreatorId={setCurrentCreatorId}
          />
        </main>
      </div>

      {/* Right Sidebar - Desktop */}
      <div className="fixed right-0 top-0 h-full hidden xl:block">
        <RightSidebar user={user} />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav user={user} />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 relative animate-scale-in">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Save to Bucket List
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
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
                className="block w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-center rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Already have an account? Login
              </Link>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
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
