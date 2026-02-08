'use client'

import { useState, useRef } from 'react'
import { Camera, X, Loader2, Plus, Image as ImageIcon } from 'lucide-react'
import { storageService } from '@/lib/storage'

interface PhotoUploadProps {
  itineraryId: string
  activityId?: string
  photos?: string[]
  onPhotosChange?: (photos: string[]) => void
  maxPhotos?: number
  className?: string
}

export default function PhotoUpload({
  itineraryId,
  activityId,
  photos = [],
  onPhotosChange,
  maxPhotos = 10,
  className = '',
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [localPhotos, setLocalPhotos] = useState<string[]>(photos)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max photos limit
    const remainingSlots = maxPhotos - localPhotos.length
    const filesToUpload = files.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      alert(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)

    try {
      // Compress and upload each file
      const uploadPromises = filesToUpload.map(async (file) => {
        const compressed = await storageService.compressImage(file)
        return storageService.uploadTripPhoto(compressed, itineraryId, activityId)
      })

      const results = await Promise.all(uploadPromises)
      const newUrls = results
        .filter((r) => r.success && r.url)
        .map((r) => r.url!)

      const updatedPhotos = [...localPhotos, ...newUrls]
      setLocalPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = localPhotos.filter((_, i) => i !== index)
    setLocalPhotos(updatedPhotos)
    onPhotosChange?.(updatedPhotos)
  }

  return (
    <div className={className}>
      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {localPhotos.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Upload button */}
        {localPhotos.length < maxPhotos && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Add Photo</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Photo count */}
      {localPhotos.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {localPhotos.length} of {maxPhotos} photos
        </p>
      )}
    </div>
  )
}

// Simple photo gallery viewer
export function PhotoGallery({ photos }: { photos: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400">
        <ImageIcon className="w-8 h-8 mr-2" />
        <span>No photos yet</span>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((url, index) => (
          <button
            key={url}
            onClick={() => setSelectedIndex(index)}
            className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          >
            <img
              src={url}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
        >
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={photos[selectedIndex]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navigation */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedIndex(i)
                  }}
                  className={`w-2 h-2 rounded-full ${
                    i === selectedIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
