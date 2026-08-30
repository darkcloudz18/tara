interface BucketPinProps {
  className?: string
  // Filled = saved. Unfilled = save affordance. Same shape either way,
  // so the toggle is legible without moving the icon around.
  filled?: boolean
  strokeWidth?: number
}

// Tara-exclusive bucket-list mark: a map-pin teardrop with a mini palm
// frond inside. Echoes the palm-tree TaraLogo so "saved place" reads as
// something Tara-specific rather than a generic bookmark.
export default function BucketPin({
  className = 'w-6 h-6',
  filled = false,
  strokeWidth = 1.75,
}: BucketPinProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pin teardrop — outline when unsaved, solid fill when saved */}
      <path
        d="M12 22s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={filled ? 'currentColor' : 'none'}
      />
      {/* Palm frond cluster — sits in the pin body, mirrors TaraLogo */}
      <g fill={filled ? 'white' : 'currentColor'}>
        {/* trunk */}
        <path d="M12 13.2v-2.8" stroke={filled ? 'white' : 'currentColor'} strokeWidth="1.4" strokeLinecap="round" />
        {/* left frond */}
        <path d="M12 10.4c-1.6 0-3-1.2-3.8-2.6 1.4.6 2.6 1.2 3.8 2.6z" />
        {/* right frond */}
        <path d="M12 10.4c1.6 0 3-1.2 3.8-2.6-1.4.6-2.6 1.2-3.8 2.6z" />
        {/* center tip */}
        <path d="M12 10.4V7.6c0 .9 0 1.9 0 2.8z" />
      </g>
    </svg>
  )
}
