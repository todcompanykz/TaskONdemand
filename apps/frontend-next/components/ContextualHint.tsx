'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useI18n } from '@/contexts/I18nContext'

interface ContextualHintProps {
  hintKey: string
  message: string
  onDismiss?: () => void
}

export default function ContextualHint({ hintKey, message, onDismiss }: ContextualHintProps) {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const dismissedKey = `hint_dismissed_${hintKey}`
    const dismissed = localStorage.getItem(dismissedKey)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [hintKey])

  const handleDismiss = () => {
    const dismissedKey = `hint_dismissed_${hintKey}`
    localStorage.setItem(dismissedKey, 'true')
    setIsVisible(false)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 mb-4 flex items-start gap-3">
      <InformationCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-blue-800 dark:text-blue-300">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
        aria-label={t('hints.dismiss')}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  )
}
