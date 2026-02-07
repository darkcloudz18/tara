'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, Calendar, Sparkles } from 'lucide-react'
import { getFeaturedTemplates, TripTemplate } from '@/features/planner/data/tripTemplates'

interface HeroSectionProps {
  user: any
}

export default function HeroSection({ user }: HeroSectionProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const templates = getFeaturedTemplates()

  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="relative px-4 py-10 md:py-16">
        {/* Main Hero Content */}
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>100% Free Trip Planner</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Plan Your Next
            <br />
            <span className="text-teal-200">Philippine Adventure</span>
          </h1>

          <p className="text-lg text-teal-100 mb-8 max-w-xl mx-auto">
            Create beautiful day-by-day itineraries with budget tracking.
            No signup required to start planning.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={user ? '/planner/new' : '/planner/new'}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-teal-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Planning
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#templates"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
            >
              Browse Templates
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-6 text-teal-100 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-300 to-blue-300 border-2 border-teal-600 flex items-center justify-center text-xs font-bold text-teal-700"
                  >
                    {['J', 'M', 'A', 'K'][i - 1]}
                  </div>
                ))}
              </div>
              <span>500+ trips planned</span>
            </div>
          </div>
        </div>

        {/* Featured Templates */}
        <div id="templates" className="max-w-4xl mx-auto">
          <h2 className="text-center text-white/80 text-sm font-medium uppercase tracking-wider mb-4">
            Popular Trip Templates
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isHovered={hoveredTemplate === template.id}
                onHover={() => setHoveredTemplate(template.id)}
                onLeave={() => setHoveredTemplate(null)}
              />
            ))}
          </div>

          <div className="text-center mt-4">
            <Link
              href="/planner/new"
              className="text-white/80 hover:text-white text-sm font-medium inline-flex items-center gap-1 transition-colors"
            >
              View all templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function TemplateCard({
  template,
  isHovered,
  onHover,
  onLeave,
}: {
  template: TripTemplate
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <Link
      href={`/planner/new?template=${template.slug}`}
      className="group relative aspect-[4/5] rounded-xl overflow-hidden"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${template.image})` }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        <div className="flex items-center gap-1.5 text-white/80 text-xs mb-1">
          <Calendar className="w-3 h-3" />
          <span>{template.duration} days</span>
        </div>
        <h3 className="text-white font-bold text-sm leading-tight mb-1">
          {template.destination}
        </h3>
        <p className="text-white/70 text-xs line-clamp-2 hidden md:block">
          {template.highlights.slice(0, 2).join(' • ')}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-teal-300 text-xs font-semibold">
            from ₱{(template.estimatedBudget / 1000).toFixed(0)}k
          </span>
          <span className="text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Use template
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
