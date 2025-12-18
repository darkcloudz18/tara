import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">✈️</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
              Tara
            </h1>
          </div>
          <div className="space-x-4">
            <Link href="/explore" className="text-gray-600 hover:text-gray-900">
              Explore
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Travel Together,<br />Book Better
            </h2>
            <p className="text-xl md:text-2xl mb-8 text-gray-700">
              The all-in-one travel platform for the Philippines.<br />
              Plan trips, discover content, and book with confidence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg">
                Start Planning for Free
              </Link>
              <Link href="/explore" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:border-gray-400 transition-colors text-lg">
                Explore Destinations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center mb-4">Everything You Need to Travel</h3>
          <p className="text-center text-gray-600 mb-16 text-lg">One platform. Endless possibilities.</p>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-2xl font-bold mb-3">Free Trip Planner</h4>
              <p className="text-gray-600 text-lg">
                Create detailed itineraries. Tag places, book services, add notes, and share with friends.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">📸</div>
              <h4 className="text-2xl font-bold mb-3">Travel Content</h4>
              <p className="text-gray-600 text-lg">
                Discover authentic travel stories from real people. Get inspired by posts, reels, and guides.
              </p>
            </div>

            <div className="text-center">
              <div className="text-6xl mb-4">🏨</div>
              <h4 className="text-2xl font-bold mb-3">Book Everything</h4>
              <p className="text-gray-600 text-lg">
                Hotels, tours, transport—all in one place. Best prices, local payments, instant confirmation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-4xl font-bold text-center mb-12">Popular Destinations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.name}
                href={`/destinations/${dest.slug}`}
                className="card text-center hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="text-4xl mb-2">{dest.emoji}</div>
                <h4 className="font-semibold text-lg">{dest.name}</h4>
                <p className="text-sm text-gray-500">{dest.type}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Creators */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold mb-4">For Content Creators</h3>
          <p className="text-xl mb-8 opacity-90">
            Share your travel content. Earn money when people book through your recommendations.
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div>
              <div className="text-3xl font-bold">6%</div>
              <div className="text-sm opacity-90">Commission Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">₱₱₱</div>
              <div className="text-sm opacity-90">Unlimited Earnings</div>
            </div>
            <div>
              <div className="text-3xl font-bold">0</div>
              <div className="text-sm opacity-90">Setup Cost</div>
            </div>
          </div>
          <Link href="/creator/apply" className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block text-lg">
            Become a Creator
          </Link>
        </div>
      </section>

      {/* For Suppliers */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold mb-4">List Your Business</h3>
              <p className="text-xl text-gray-600 mb-6">
                Hotels, resorts, tour operators—reach thousands of travelers looking for authentic Philippine experiences.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-lg">Lower commission than other platforms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-lg">Direct payments via GCash, bank, or card</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-lg">Free listing, only pay when you get bookings</span>
                </li>
              </ul>
              <Link href="/supplier/register" className="btn-primary text-lg px-8 py-4">
                List Your Business
              </Link>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🏖️</div>
              <div className="text-4xl font-bold mb-2">12%</div>
              <div className="text-gray-600 mb-4">Platform Fee (vs 15-25% elsewhere)</div>
              <div className="text-2xl font-bold mb-2">₱0</div>
              <div className="text-gray-600">Setup Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✈️</span>
                <h5 className="text-xl font-bold">Tara</h5>
              </div>
              <p className="text-gray-400">
                Travel together, book better. Made for the Philippines.
              </p>
            </div>

            <div>
              <h6 className="font-semibold mb-4">For Travelers</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/explore" className="hover:text-white">Explore</Link></li>
                <li><Link href="/planner" className="hover:text-white">Trip Planner</Link></li>
                <li><Link href="/bookings" className="hover:text-white">My Bookings</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold mb-4">For Partners</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/creator/apply" className="hover:text-white">Become a Creator</Link></li>
                <li><Link href="/supplier/register" className="hover:text-white">List Your Business</Link></li>
              </ul>
            </div>

            <div>
              <h6 className="font-semibold mb-4">Company</h6>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Tara. Made with ❤️ for the Philippines.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const destinations = [
  { name: 'Palawan', emoji: '🏝️', type: 'Island', slug: 'palawan' },
  { name: 'Boracay', emoji: '🏖️', type: 'Beach', slug: 'boracay' },
  { name: 'Siargao', emoji: '🏄', type: 'Surf', slug: 'siargao' },
  { name: 'Baguio', emoji: '⛰️', type: 'Mountains', slug: 'baguio' },
  { name: 'Cebu', emoji: '🌆', type: 'City', slug: 'cebu' },
  { name: 'Bohol', emoji: '👀', type: 'Nature', slug: 'bohol' },
]
