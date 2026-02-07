'use client'

import { useState } from 'react'
import { Users, Crown, Edit3, Eye, MoreHorizontal, Trash2, UserMinus, ChevronDown } from 'lucide-react'
import { Collaborator, CollaboratorRole } from '../types'
import { collaborationService } from '../services/collaborationService'
import { useToast } from '@/contexts/ToastContext'

interface CollaboratorListProps {
  collaborators: Collaborator[]
  ownerId: string
  currentUserId: string
  onUpdate: () => void
}

const ROLE_ICONS: Record<CollaboratorRole, React.ReactNode> = {
  owner: <Crown className="w-4 h-4 text-amber-500" />,
  editor: <Edit3 className="w-4 h-4 text-teal-500" />,
  viewer: <Eye className="w-4 h-4 text-gray-500" />,
}

const ROLE_LABELS: Record<CollaboratorRole, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
}

export default function CollaboratorList({
  collaborators,
  ownerId,
  currentUserId,
  onUpdate,
}: CollaboratorListProps) {
  const { success, error: showError } = useToast()
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const isOwner = currentUserId === ownerId
  const acceptedCollaborators = collaborators.filter((c) => c.status === 'accepted')
  const pendingCollaborators = collaborators.filter((c) => c.status === 'pending')

  const handleRemove = async (collaborator: Collaborator) => {
    setLoading(collaborator.id)
    const result = await collaborationService.removeCollaborator(collaborator.id)
    setLoading(null)
    setMenuOpen(null)

    if (result) {
      success('Collaborator removed')
      onUpdate()
    } else {
      showError('Failed to remove collaborator')
    }
  }

  const handleUpdateRole = async (collaborator: Collaborator, newRole: CollaboratorRole) => {
    setLoading(collaborator.id)
    const result = await collaborationService.updateRole(collaborator.id, newRole)
    setLoading(null)
    setMenuOpen(null)

    if (result) {
      success('Role updated')
      onUpdate()
    } else {
      showError('Failed to update role')
    }
  }

  if (collaborators.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Accepted Collaborators */}
      {acceptedCollaborators.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Collaborators ({acceptedCollaborators.length})
          </h4>
          <div className="space-y-2">
            {acceptedCollaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {collab.user?.photo_url ? (
                      <img
                        src={collab.user.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (collab.user?.first_name?.[0] || collab.user?.username?.[0] || 'U').toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {collab.user?.first_name || collab.user?.username || 'User'}
                      {collab.user_id === currentUserId && (
                        <span className="text-gray-500 dark:text-gray-400 font-normal"> (you)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      {ROLE_ICONS[collab.role]}
                      {ROLE_LABELS[collab.role]}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && collab.user_id !== currentUserId && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === collab.id ? null : collab.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      disabled={loading === collab.id}
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {menuOpen === collab.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                        {/* Change Role */}
                        <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Change Role</p>
                          {(['editor', 'viewer'] as CollaboratorRole[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => handleUpdateRole(collab, r)}
                              className={`w-full text-left px-2 py-1 text-sm rounded ${
                                collab.role === r
                                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {ROLE_LABELS[r]}
                            </button>
                          ))}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemove(collab)}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingCollaborators.length > 0 && isOwner && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Pending Invitations ({pendingCollaborators.length})
          </h4>
          <div className="space-y-2">
            {pendingCollaborators.map((collab) => (
              <div
                key={collab.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                    ?
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {collab.user?.email || 'Invited User'}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">Pending</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(collab)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Cancel invitation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
