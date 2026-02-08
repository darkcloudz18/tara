'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, MapPin, Calendar, Users, Wallet, Loader2 } from 'lucide-react'
import {
  parseNaturalLanguage,
  getQuickSuggestions,
  generateTrip,
  TripPreferences,
  GeneratedTrip,
  TravelStyle,
  GroupType,
} from '../services/aiTripService'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  suggestions?: string[]
  preferences?: Partial<TripPreferences>
}

interface AiTripChatProps {
  onTripGenerated: (trip: GeneratedTrip) => void
}

const DEFAULT_PREFERENCES: TripPreferences = {
  duration: 3,
  budget: 10000,
  travelStyle: ['relaxation'],
  groupType: 'couple',
  interests: [],
}

export default function AiTripChat({ onTripGenerated }: AiTripChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm your AI travel planner. Tell me about your dream trip to the Philippines! For example:\n\n\"5 days in Palawan, beach lover, budget ₱15,000\"\n\nor just describe what you're looking for!",
      suggestions: [
        '5 days Palawan island hopping',
        '3 days Boracay beach escape',
        '4 days Cebu adventure',
        '3 days Bohol family trip',
      ],
    },
  ])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [collectedPreferences, setCollectedPreferences] = useState<Partial<TripPreferences>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (type: 'user' | 'ai', content: string, extras?: Partial<Message>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      ...extras,
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    const userInput = input.trim()
    setInput('')

    // Add user message
    addMessage('user', userInput)

    // Parse preferences from input
    const parsed = parseNaturalLanguage(userInput)
    const updatedPreferences = { ...collectedPreferences, ...parsed }
    setCollectedPreferences(updatedPreferences)

    // Check what's missing
    const missing = getMissingInfo(updatedPreferences)

    if (missing.length > 0) {
      // Ask for missing info
      const question = generateQuestion(missing[0], updatedPreferences)
      setTimeout(() => {
        addMessage('ai', question, {
          suggestions: getSuggestionsForMissing(missing[0]),
          preferences: updatedPreferences,
        })
      }, 500)
    } else {
      // Generate trip
      setIsGenerating(true)
      addMessage('ai', 'Perfect! Let me create your personalized itinerary... ✨')

      try {
        const finalPreferences: TripPreferences = {
          ...DEFAULT_PREFERENCES,
          ...updatedPreferences,
        } as TripPreferences

        const trip = await generateTrip(finalPreferences)

        setTimeout(() => {
          addMessage(
            'ai',
            `I've created a ${trip.duration}-day trip to ${trip.destination} for you! 🎉\n\nEstimated budget: ₱${trip.estimatedBudget.toLocaleString()}\n\nHighlights: ${trip.highlights.slice(0, 3).join(', ')}\n\nClick below to view and customize your itinerary.`
          )
          onTripGenerated(trip)
          setIsGenerating(false)
        }, 1500)
      } catch (error) {
        addMessage('ai', 'Sorry, I had trouble generating your trip. Please try again with different preferences.')
        setIsGenerating(false)
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">AI Trip Planner</h3>
          <p className="text-xs text-white/80">Powered by Tara</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-teal-600 text-white rounded-br-md'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm'
              }`}
            >
              <p className="whitespace-pre-line text-sm">{message.content}</p>

              {/* Quick suggestions */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Preferences preview */}
              {message.preferences && Object.keys(message.preferences).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                  {message.preferences.destination && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded">
                      <MapPin className="w-3 h-3" />
                      {message.preferences.destination}
                    </span>
                  )}
                  {message.preferences.duration && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                      <Calendar className="w-3 h-3" />
                      {message.preferences.duration} days
                    </span>
                  )}
                  {message.preferences.budget && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                      <Wallet className="w-3 h-3" />
                      ₱{message.preferences.budget.toLocaleString()}
                    </span>
                  )}
                  {message.preferences.groupType && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                      <Users className="w-3 h-3" />
                      {message.preferences.groupType}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Creating your perfect itinerary...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your dream trip..."
            disabled={isGenerating}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getMissingInfo(prefs: Partial<TripPreferences>): string[] {
  const missing: string[] = []
  if (!prefs.destination) missing.push('destination')
  if (!prefs.duration) missing.push('duration')
  if (!prefs.budget) missing.push('budget')
  if (!prefs.groupType) missing.push('groupType')
  return missing
}

function generateQuestion(missing: string, prefs: Partial<TripPreferences>): string {
  switch (missing) {
    case 'destination':
      return "Where would you like to go? 🏝️\n\nI can help plan trips to popular Philippine destinations like Palawan, Boracay, Cebu, Siargao, and more!"
    case 'duration':
      return `Great choice${prefs.destination ? ` - ${prefs.destination} is amazing` : ''}! How many days are you planning to stay? ⏱️`
    case 'budget':
      return "What's your approximate budget for the trip? 💰\n\nThis helps me recommend the right accommodations and activities."
    case 'groupType':
      return "Who are you traveling with? 👥\n\nThis helps me tailor activities for your group."
    default:
      return "Tell me more about your trip preferences!"
  }
}

function getSuggestionsForMissing(missing: string): string[] {
  switch (missing) {
    case 'destination':
      return ['Palawan', 'Boracay', 'Cebu', 'Siargao']
    case 'duration':
      return ['3 days', '4 days', '5 days', '7 days']
    case 'budget':
      return ['₱5,000', '₱10,000', '₱15,000', '₱20,000+']
    case 'groupType':
      return ['Solo trip', 'Couple', 'Family', 'Friends']
    default:
      return []
  }
}
