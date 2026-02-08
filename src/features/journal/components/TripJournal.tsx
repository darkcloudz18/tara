'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Image,
  Save,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/contexts/ToastContext'

interface JournalEntry {
  id: string
  tripId?: string
  title: string
  content: string
  date: string
  location?: string
  mood?: 'amazing' | 'good' | 'okay' | 'challenging'
  photos?: string[]
  createdAt: string
  updatedAt: string
}

const MOOD_OPTIONS = [
  { value: 'amazing', emoji: '🤩', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'challenging', emoji: '😅', label: 'Challenging' },
]

interface TripJournalProps {
  tripId?: string
  tripTitle?: string
}

export default function TripJournal({ tripId, tripTitle }: TripJournalProps) {
  const { success } = useToast()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState('')
  const [mood, setMood] = useState<JournalEntry['mood']>('good')

  // Load entries
  useEffect(() => {
    const storageKey = tripId ? `journal-${tripId}` : 'journal-general'
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setEntries(JSON.parse(saved))
    }
  }, [tripId])

  // Save entries
  useEffect(() => {
    if (entries.length > 0) {
      const storageKey = tripId ? `journal-${tripId}` : 'journal-general'
      localStorage.setItem(storageKey, JSON.stringify(entries))
    }
  }, [entries, tripId])

  const openEditor = (entry?: JournalEntry) => {
    if (entry) {
      setEditingEntry(entry)
      setTitle(entry.title)
      setContent(entry.content)
      setDate(entry.date)
      setLocation(entry.location || '')
      setMood(entry.mood || 'good')
    } else {
      setEditingEntry(null)
      setTitle('')
      setContent('')
      setDate(new Date().toISOString().split('T')[0])
      setLocation('')
      setMood('good')
    }
    setShowEditor(true)
  }

  const closeEditor = () => {
    setShowEditor(false)
    setEditingEntry(null)
  }

  const saveEntry = () => {
    if (!title.trim() || !content.trim()) return

    const now = new Date().toISOString()

    if (editingEntry) {
      // Update existing entry
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id
            ? { ...e, title, content, date, location, mood, updatedAt: now }
            : e
        )
      )
      success('Journal entry updated')
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}`,
        tripId,
        title,
        content,
        date,
        location: location || undefined,
        mood,
        createdAt: now,
        updatedAt: now,
      }
      setEntries((prev) => [newEntry, ...prev])
      success('Journal entry saved')
    }

    closeEditor()
  }

  const deleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    success('Entry deleted')
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Travel Journal
            </h3>
            {tripTitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tripTitle}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Write
        </button>
      </div>

      {/* Entries list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No journal entries yet</p>
            <button
              onClick={() => openEditor()}
              className="mt-3 text-teal-600 dark:text-teal-400 text-sm hover:underline"
            >
              Write your first entry
            </button>
          </div>
        ) : (
          entries.map((entry) => {
            const moodOption = MOOD_OPTIONS.find((m) => m.value === entry.mood)

            return (
              <div
                key={entry.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                onClick={() => openEditor(entry)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {moodOption && <span>{moodOption.emoji}</span>}
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {entry.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {entry.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                      {entry.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEntry(entry.id)
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Editor header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
              </h3>
              <button
                onClick={closeEditor}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editor content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Date & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where are you?"
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  How was your day?
                </label>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setMood(option.value as JournalEntry['mood'])}
                      className={`flex-1 flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                        mood === option.value
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Your story
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write about your experiences, thoughts, and memories..."
                  rows={8}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            {/* Editor footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={closeEditor}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
