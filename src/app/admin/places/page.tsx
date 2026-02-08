'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from 'lucide-react'
import { adminService } from '@/features/admin/services/adminService'
import { useToast } from '@/contexts/ToastContext'

interface Place {
  id: string
  name: string
  description: string
  category: string
  location: string
  image_url: string
  is_featured: boolean
  created_at: string
}

export default function AdminPlacesPage() {
  const { success, error } = useToast()
  const [places, setPlaces] = useState<Place[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [actionMenu, setActionMenu] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<Place | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    image_url: '',
  })

  const limit = 20

  const categories = [
    'Beach',
    'Mountain',
    'Island',
    'City',
    'Historical',
    'Nature',
    'Adventure',
    'Cultural',
    'Food',
    'Wellness',
  ]

  useEffect(() => {
    loadPlaces()
  }, [page])

  const loadPlaces = async () => {
    setLoading(true)
    const result = await adminService.getPlaces(page, limit)
    setPlaces(result.places)
    setTotal(result.total)
    setLoading(false)
  }

  const handleSave = async () => {
    const place = editModal?.id ? { ...formData, id: editModal.id } : formData

    const ok = await adminService.savePlace(place)
    if (ok) {
      success(editModal?.id ? 'Place updated' : 'Place created')
      loadPlaces()
    } else {
      error('Failed to save place')
    }
    setEditModal(null)
    setFormData({ name: '', description: '', category: '', location: '', image_url: '' })
  }

  const handleDelete = async () => {
    if (!deleteModal) return

    const ok = await adminService.deletePlace(deleteModal.id)
    if (ok) {
      success('Place deleted')
      loadPlaces()
    } else {
      error('Failed to delete place')
    }
    setDeleteModal(null)
  }

  const handleToggleFeatured = async (placeId: string, featured: boolean) => {
    const ok = await adminService.toggleFeatured(placeId, featured)
    if (ok) {
      success(featured ? 'Place featured' : 'Place unfeatured')
      loadPlaces()
    } else {
      error('Failed to update place')
    }
    setActionMenu(null)
  }

  const openEditModal = (place?: Place) => {
    if (place) {
      setEditModal(place)
      setFormData({
        name: place.name,
        description: place.description || '',
        category: place.category || '',
        location: place.location || '',
        image_url: place.image_url || '',
      })
    } else {
      setEditModal({ id: '' } as Place)
      setFormData({ name: '', description: '', category: '', location: '', image_url: '' })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Places</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage destination places</p>
        </div>
        <button
          onClick={() => openEditModal()}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Add Place
        </button>
      </div>

      {/* Places grid */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Place
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {places.map((place) => (
                    <tr key={place.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {place.image_url ? (
                            <img
                              src={place.image_url}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {place.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                              {place.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                          {place.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {place.location || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {place.is_featured ? (
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === place.id ? null : place.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {actionMenu === place.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                              <button
                                onClick={() => {
                                  openEditModal(place)
                                  setActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Place
                              </button>
                              <button
                                onClick={() => handleToggleFeatured(place.id, !place.is_featured)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                {place.is_featured ? (
                                  <>
                                    <StarOff className="w-4 h-4" />
                                    Remove Featured
                                  </>
                                ) : (
                                  <>
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    Mark Featured
                                  </>
                                )}
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => {
                                  setDeleteModal({ id: place.id, name: place.name })
                                  setActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete Place
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editModal.id ? 'Edit Place' : 'Add Place'}
              </h3>
              <button
                onClick={() => setEditModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Place name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Place description"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="City, Province"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Image URL
                </label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="flex-1 px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {editModal.id ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Place
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{deleteModal.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
              >
                Delete Place
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
