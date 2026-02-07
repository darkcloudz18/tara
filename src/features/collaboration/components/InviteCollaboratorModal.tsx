'use client'

import { useState } from 'react'
import { X, Mail, UserPlus, Loader2, Check } from 'lucide-react'
import { collaborationService } from '../services/collaborationService'
import { CollaboratorRole } from '../types'
import { useToast } from '@/contexts/ToastContext'

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  itineraryId: string
  onInvited?: () => void
}

const ROLES: { value: CollaboratorRole; label: string; description: string }[] = [
  { value: 'editor', label: 'Editor', description: 'Can add, edit, and remove places' },
  { value: 'viewer', label: 'Viewer', description: 'Can only view the trip' },
]

export default function InviteCollaboratorModal({
  isOpen,
  onClose,
  itineraryId,
  onInvited,
}: InviteCollaboratorModalProps) {
  const { success, error: showError } = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<CollaboratorRole>('editor')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    const result = await collaborationService.inviteByEmail({
      itinerary_id: itineraryId,
      email: email.trim(),
      role,
    })
    setLoading(false)

    if (result.success) {
      setSent(true)
      success('Invitation sent!')
      setTimeout(() => {
        setEmail('')
        setSent(false)
        onInvited?.()
        onClose()
      }, 1500)
    } else {
      showError('Failed to invite', result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Invite Collaborator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Plan this trip together
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                    role === r.value
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    role === r.value
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {role === r.value && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{r.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || sent || !email.trim()}
            className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              sent
                ? 'bg-green-500 text-white'
                : loading
                ? 'bg-teal-400 text-white cursor-wait'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
          >
            {sent ? (
              <>
                <Check className="w-5 h-5" />
                Invitation Sent!
              </>
            ) : loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Send Invitation
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            They&apos;ll receive a notification to accept your invitation
          </p>
        </div>
      </div>
    </div>
  )
}
