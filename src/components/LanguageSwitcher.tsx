'use client'

import { useI18n, Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fil', label: 'Filipino', flag: '🇵🇭' },
]

interface LanguageSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'toggle'
}

export default function LanguageSwitcher({
  className = '',
  variant = 'toggle',
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()

  if (variant === 'toggle') {
    return (
      <button
        onClick={() => setLocale(locale === 'en' ? 'fil' : 'en')}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
          hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
        title={`Switch to ${locale === 'en' ? 'Filipino' : 'English'}`}
      >
        <span className="text-base">{locale === 'en' ? '🇵🇭' : '🇺🇸'}</span>
        <span>{locale === 'en' ? 'FIL' : 'EN'}</span>
      </button>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
        hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Globe className="w-4 h-4" />
        <span>{LANGUAGES.find((l) => l.code === locale)?.flag}</span>
      </button>

      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 hidden group-hover:block min-w-[140px] z-50">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2
              ${locale === lang.code
                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
