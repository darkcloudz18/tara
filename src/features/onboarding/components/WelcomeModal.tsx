'use client'

import { useState, useEffect } from 'react'
import { Compass, Map, PlusCircle, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'

interface WelcomeModalProps {
  onComplete?: () => void
}

const STEPS = [
  {
    icon: <Compass className="w-16 h-16 text-teal-500" />,
    title: 'Welcome to Tara!',
    description: 'Your all-in-one travel platform for exploring the Philippines. Discover amazing places, plan your trips, and travel with confidence.',
    highlight: 'Tara means "let\'s go" in Filipino',
  },
  {
    icon: <Map className="w-16 h-16 text-teal-500" />,
    title: 'Discover Places',
    description: 'Browse through beaches, restaurants, attractions, and activities. Swipe right to save places you love, or skip ones that don\'t interest you.',
    highlight: 'Use filters to find exactly what you\'re looking for',
  },
  {
    icon: <PlusCircle className="w-16 h-16 text-teal-500" />,
    title: 'Build Your Trip',
    description: 'Create personalized trips by adding your favorite places. Organize by day, track your budget, and share with friends.',
    highlight: 'Get started by discovering and adding places',
  },
]

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const { shouldShowOnboarding, completeOnboarding } = useOnboarding()
  const [currentStep, setCurrentStep] = useState(0)
  const [isErrorRoute, setIsErrorRoute] = useState(false)

  useEffect(() => {
    const check = () => setIsErrorRoute(document.body.dataset.errorRoute === '1')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-error-route'] })
    return () => observer.disconnect()
  }, [])

  if (!shouldShowOnboarding || isErrorRoute) return null

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    completeOnboarding()
    onComplete?.()
  }

  const handleSkip = () => {
    completeOnboarding()
    onComplete?.()
  }

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Dots */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-6 bg-teal-500'
                  : idx < currentStep
                  ? 'bg-teal-300'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="pt-16 pb-6 px-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              {step.icon}
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {step.description}
            </p>
            <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
              {step.highlight}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
