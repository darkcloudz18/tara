'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plane,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Search,
  Sparkles,
} from 'lucide-react'
import { getPopularDestinations } from '../services/suggestionService'
import { TripTemplate } from '../data/tripTemplates'

interface TripWizardProps {
  onComplete: (data: TripWizardData) => void
  initialTemplate?: TripTemplate
}

export interface TripWizardData {
  origin: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  tripType: 'leisure' | 'adventure' | 'budget' | 'luxury'
}

const TRIP_TYPES = [
  { id: 'leisure', label: 'Leisure', icon: '🏖️', desc: 'Relaxing beach & resort vibes' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️', desc: 'Outdoor activities & exploration' },
  { id: 'budget', label: 'Budget', icon: '💰', desc: 'Best value for money' },
  { id: 'luxury', label: 'Luxury', icon: '✨', desc: 'Premium experiences' },
]

const POPULAR_ORIGINS = ['Manila', 'Cebu', 'Davao', 'Clark', 'Iloilo']

export default function TripWizard({ onComplete, initialTemplate }: TripWizardProps) {
  const [step, setStep] = useState(1)
  const [destinations, setDestinations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchingDestinations, setSearchingDestinations] = useState(false)

  const [formData, setFormData] = useState<TripWizardData>({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    tripType: 'leisure',
  })

  const [originSearch, setOriginSearch] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [showOriginDropdown, setShowOriginDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)

  useEffect(() => {
    loadDestinations()
  }, [])

  // Pre-fill form with template data
  useEffect(() => {
    if (initialTemplate) {
      // Calculate dates based on template duration
      const start = new Date()
      start.setDate(start.getDate() + 7) // Start a week from now
      const end = new Date(start)
      end.setDate(end.getDate() + initialTemplate.duration - 1)

      setFormData({
        origin: initialTemplate.startingFrom,
        destination: initialTemplate.destination,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        travelers: 2,
        tripType: initialTemplate.bestFor.includes('adventure') ? 'adventure' :
                  initialTemplate.bestFor.includes('budget') ? 'budget' :
                  initialTemplate.bestFor.includes('luxury') ? 'luxury' : 'leisure',
      })
    }
  }, [initialTemplate])

  const loadDestinations = async () => {
    setSearchingDestinations(true)
    try {
      const dests = await getPopularDestinations()
      setDestinations(dests)
    } catch (err) {
      console.error('Error loading destinations:', err)
    } finally {
      setSearchingDestinations(false)
    }
  }

  const filteredOrigins = POPULAR_ORIGINS.filter(o =>
    o.toLowerCase().includes(originSearch.toLowerCase())
  )

  const filteredDestinations = destinations.filter(d =>
    d.toLowerCase().includes(destSearch.toLowerCase())
  )

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.origin && formData.destination
      case 2:
        return formData.startDate && formData.endDate
      case 3:
        return formData.travelers > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      setLoading(true)
      onComplete(formData)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const getTotalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Template Banner */}
      {initialTemplate && (
        <div className="mb-6 p-4 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={initialTemplate.image}
                alt={initialTemplate.destination}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-200" />
                <span className="text-sm font-medium text-teal-100">Using template</span>
              </div>
              <h3 className="font-bold truncate">{initialTemplate.title}</h3>
              <p className="text-sm text-teal-100">
                {initialTemplate.duration} days • from ₱{initialTemplate.estimatedBudget.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                s < step
                  ? 'bg-teal-500 text-white'
                  : s === step
                  ? 'bg-teal-500 text-white ring-4 ring-teal-100 dark:ring-teal-900'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 mx-2 rounded ${
                  s < step ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 md:p-8">
        {/* Step 1: Origin & Destination */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plane className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Where are you going?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Tell us your starting point and destination
              </p>
            </div>

            {/* Origin */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From (Origin)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.origin || originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value)
                    setFormData({ ...formData, origin: '' })
                    setShowOriginDropdown(true)
                  }}
                  onFocus={() => setShowOriginDropdown(true)}
                  placeholder="e.g., Manila"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {showOriginDropdown && filteredOrigins.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-auto">
                  {filteredOrigins.map((origin) => (
                    <button
                      key={origin}
                      onClick={() => {
                        setFormData({ ...formData, origin })
                        setOriginSearch('')
                        setShowOriginDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center gap-3"
                    >
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {origin}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
              </div>
            </div>

            {/* Destination */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To (Destination)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                <input
                  type="text"
                  value={formData.destination || destSearch}
                  onChange={(e) => {
                    setDestSearch(e.target.value)
                    setFormData({ ...formData, destination: '' })
                    setShowDestDropdown(true)
                  }}
                  onFocus={() => setShowDestDropdown(true)}
                  placeholder="e.g., Palawan, El Nido, Boracay"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              {showDestDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-auto">
                  {searchingDestinations ? (
                    <div className="px-4 py-3 text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading destinations...
                    </div>
                  ) : filteredDestinations.length > 0 ? (
                    filteredDestinations.map((dest) => (
                      <button
                        key={dest}
                        onClick={() => {
                          setFormData({ ...formData, destination: dest })
                          setDestSearch('')
                          setShowDestDropdown(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center gap-3"
                      >
                        <MapPin className="w-4 h-4 text-teal-500" />
                        {dest}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">
                      {destSearch ? 'No destinations found' : 'Type to search destinations'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Selection */}
            {!formData.destination && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Popular destinations:</p>
                <div className="flex flex-wrap gap-2">
                  {['Palawan', 'Boracay', 'Cebu', 'Siargao', 'Bohol'].map((dest) => (
                    <button
                      key={dest}
                      onClick={() => setFormData({ ...formData, destination: dest })}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                When are you traveling?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {formData.origin} to {formData.destination}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            {getTotalDays() > 0 && (
              <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-4 text-center">
                <p className="text-teal-700 dark:text-teal-300 font-medium">
                  {getTotalDays()} {getTotalDays() === 1 ? 'day' : 'days'} trip
                </p>
              </div>
            )}

            {/* Quick Duration Selection */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick select duration:</p>
              <div className="flex flex-wrap gap-2">
                {[3, 5, 7, 10, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      const start = new Date()
                      start.setDate(start.getDate() + 7) // Start a week from now
                      const end = new Date(start)
                      end.setDate(end.getDate() + days - 1)
                      setFormData({
                        ...formData,
                        startDate: start.toISOString().split('T')[0],
                        endDate: end.toISOString().split('T')[0],
                      })
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Trip Type & Travelers */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trip Details
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {getTotalDays()} days in {formData.destination}
              </p>
            </div>

            {/* Travelers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Travelers
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 dark:text-white w-12 text-center">
                  {formData.travelers}
                </span>
                <button
                  onClick={() => setFormData({ ...formData, travelers: Math.min(20, formData.travelers + 1) })}
                  className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What type of trip?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TRIP_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, tripType: type.id as any })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.tripType === type.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <h3 className={`font-semibold mt-2 ${
                      formData.tripType === type.id
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Route</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formData.origin} → {formData.destination}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {getTotalDays()} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Travelers</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formData.travelers} {formData.travelers === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {TRIP_TYPES.find(t => t.id === formData.tripType)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 px-6 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1 py-3 px-6 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Itinerary...
              </>
            ) : step === 3 ? (
              <>
                Generate Itinerary
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
