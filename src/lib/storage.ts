import { supabase } from './supabase'

const BUCKET_NAME = 'trip-photos'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export const storageService = {
  /**
   * Upload a photo to trip storage
   */
  async uploadTripPhoto(
    file: File,
    itineraryId: string,
    activityId?: string
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const ext = file.name.split('.').pop()
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const path = activityId
        ? `${itineraryId}/${activityId}/${timestamp}-${random}.${ext}`
        : `${itineraryId}/${timestamp}-${random}.${ext}`

      // Upload file
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      return { success: true, url: urlData.publicUrl }
    } catch (err: any) {
      console.error('Upload error:', err)
      return { success: false, error: err.message }
    }
  },

  /**
   * Upload multiple photos
   */
  async uploadMultiplePhotos(
    files: File[],
    itineraryId: string,
    activityId?: string
  ): Promise<UploadResult[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadTripPhoto(file, itineraryId, activityId))
    )
    return results
  },

  /**
   * Delete a photo
   */
  async deletePhoto(path: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  },

  /**
   * List photos for a trip
   */
  async listTripPhotos(itineraryId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(itineraryId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error || !data) {
      console.error('List error:', error)
      return []
    }

    return data
      .filter((f) => !f.name.startsWith('.'))
      .map((f) => {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(`${itineraryId}/${f.name}`)
        return urlData.publicUrl
      })
  },

  /**
   * Compress image before upload (client-side)
   */
  async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Scale down if needed
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  },
}
