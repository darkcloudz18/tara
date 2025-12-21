'use client'

interface TaraLogoProps {
  className?: string
  showText?: boolean
}

export default function TaraLogo({ className = 'w-8 h-8', showText = false }: TaraLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Palm tree trunk */}
        <path
          d="M16 28V14"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Left frond */}
        <path
          d="M16 14C12 14 8 10 6 6C10 8 14 10 16 14"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Right frond */}
        <path
          d="M16 14C20 14 24 10 26 6C22 8 18 10 16 14"
          fill="currentColor"
          opacity="0.9"
        />
        {/* Center frond */}
        <path
          d="M16 14C16 10 16 6 16 4C16 6 16 10 16 14"
          fill="currentColor"
        />
        {/* Left lower frond */}
        <path
          d="M16 16C12 16 7 14 4 12C8 14 12 15 16 16"
          fill="currentColor"
          opacity="0.7"
        />
        {/* Right lower frond */}
        <path
          d="M16 16C20 16 25 14 28 12C24 14 20 15 16 16"
          fill="currentColor"
          opacity="0.7"
        />
        {/* Ground/island base */}
        <ellipse
          cx="16"
          cy="28"
          rx="4"
          ry="1.5"
          fill="currentColor"
          opacity="0.3"
        />
      </svg>
      {showText && (
        <span className="text-xl font-bold">Tara</span>
      )}
    </div>
  )
}
