'use client'

import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { ToastType } from '@/contexts/ToastContext'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss: () => void
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500 dark:text-green-400',
    title: 'text-green-800 dark:text-green-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500 dark:text-yellow-400',
    title: 'text-yellow-800 dark:text-yellow-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
  },
}

export default function Toast({ type, title, message, action, onDismiss }: ToastProps) {
  const Icon = icons[type]
  const style = styles[type]

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-md animate-slide-up`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${style.title}`}>{title}</p>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
