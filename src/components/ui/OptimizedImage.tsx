'use client'

import { useState } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  sizes?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
}

// Simple blur placeholder SVG
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e5e7eb" offset="20%" />
      <stop stop-color="#f3f4f6" offset="50%" />
      <stop stop-color="#e5e7eb" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e5e7eb" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str)

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  sizes,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Handle external URLs that might not be in next.config.js
  const isExternalUrl = src?.startsWith('http') && !src?.includes('supabase')

  if (!src || error) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      />
    )
  }

  // For external images not in our allowed domains, use img tag
  if (isExternalUrl) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'animate-pulse bg-gray-200 dark:bg-gray-700' : ''}`}
        style={
          fill
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit }
            : { width, height, objectFit }
        }
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : (width || 400)}
      height={fill ? undefined : (height || 300)}
      fill={fill}
      className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      style={{ objectFit }}
      sizes={sizes || (fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined)}
      priority={priority}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(width || 400, height || 300))}`}
      onLoad={() => setIsLoading(false)}
      onError={() => setError(true)}
    />
  )
}
