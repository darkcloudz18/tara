'use client'

interface BucketIconProps {
  className?: string
  filled?: boolean
}

export default function BucketIcon({ className = 'w-6 h-6', filled = false }: BucketIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Bucket shape */}
      <path d="M4 8h16l-2 12H6L4 8z" />
      {/* Bucket rim */}
      <path d="M4 8c0-1 1-2 2-2h12c1 0 2 1 2 2" />
      {/* Handle */}
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      {/* Water/content lines when filled */}
      {filled && (
        <>
          <path d="M7 12h10" strokeWidth="1.5" />
          <path d="M8 15h8" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}
