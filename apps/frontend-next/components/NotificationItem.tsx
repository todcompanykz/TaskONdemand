'use client'

import React from 'react'
import { NotificationItem as NotificationItemType } from '@/contexts/NotificationHistoryContext'
import { useI18n } from '@/contexts/I18nContext'

interface NotificationItemProps {
  notification: NotificationItemType
  onClick: () => void
}

const getNotificationIcon = (type: NotificationItemType['type']) => {
  if (type === 'support_reply') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    )
  }
  switch (type) {
    case 'user_restricted':
    case 'user_blocked':
    case 'claim_blocked':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'user_unrestricted':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'task_claimed':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )
    case 'task_cancelled':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'task_completed':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'task_expired':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'work_confirmed':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'payment_confirmed':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
          <path
            fillRule="evenodd"
            d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      )
    default:
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

const getNotificationColor = (type: NotificationItemType['type'], read: boolean) => {
  if (read) {
    return 'text-gray-400 dark:text-gray-500'
  }

  switch (type) {
    case 'user_restricted':
    case 'user_blocked':
    case 'claim_blocked':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'user_unrestricted':
    case 'task_completed':
    case 'work_confirmed':
    case 'payment_confirmed':
      return 'text-green-600 dark:text-green-400'
    case 'task_cancelled':
      return 'text-red-600 dark:text-red-400'
    case 'task_claimed':
      return 'text-blue-600 dark:text-blue-400'
    case 'task_expired':
      return 'text-gray-600 dark:text-gray-400'
    case 'support_reply':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const formatTimestamp = (timestamp: number, t: (key: string, params?: Record<string, string | number>) => string): string => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return t('notificationHistory.justNow')
  } else if (minutes < 60) {
    return t('notificationHistory.minutesAgo', { count: minutes })
  } else if (hours < 24) {
    return t('notificationHistory.hoursAgo', { count: hours })
  } else if (days === 1) {
    return t('notificationHistory.yesterday')
  } else {
    return t('notificationHistory.daysAgo', { count: days })
  }
}

// Translate message if it's a localization key, with fallback
const translateMessage = (
  message: string,
  type: NotificationItemType['type'],
  t: (key: string, params?: Record<string, string | number>) => string
): string => {
  // Fallback messages based on notification type (always use translation)
  const fallbackMessages: Partial<Record<NotificationItemType['type'], string>> = {
    task_claimed: t('notifications.taskClaimed.message'),
    task_completed: t('notifications.taskCompleted.message'),
    work_confirmed: t('notifications.workConfirmed.message'),
    payment_confirmed: t('notifications.paymentConfirmed.message'),
    task_cancelled: t('notifications.taskCancelled.message'),
    task_expired: t('notifications.taskExpired.message'),
    user_restricted: t('notifications.userRestricted.message'),
    user_unrestricted: t('notifications.userUnrestricted.message'),
    user_blocked: t('notifications.userBlocked.message'),
    claim_blocked: t('notifications.claimBlocked.message'),
    support_reply: t('notifications.supportReply.message'),
  }

  if (!message) {
    // If message is empty, use fallback
    return fallbackMessages[type] || t('common.notification')
  }

  // Check if message looks like a localization key
  // Pattern: "notifications.xxx.message" or contains "notifications." with dots
  const isLocalizationKey = 
    (message.includes('.') && message.startsWith('notifications.')) ||
    (message.includes('notifications.') && message.includes('.message'))

  if (isLocalizationKey) {
    try {
      const translated = t(message)
      // If translation returned the same key, translation not found - use fallback
      if (translated !== message) {
        return translated
      }
    } catch (e) {
      // Translation failed, use fallback
      console.warn('Failed to translate notification key:', message, e)
    }
    // If we get here, translation failed or returned the same key - use fallback
    return fallbackMessages[type] || t('common.notification')
  }

  // If message doesn't look like a key, check if it's already a translated text
  // If it contains common Russian/English/Kazakh characters, it's likely already translated
  const hasTranslatedChars = /[а-яёА-ЯЁҚқҒғҢңҮүӨөІіӘә]/.test(message) || 
                             /[a-zA-Z]/.test(message) && message.length > 10

  // If message looks like it's already translated, return as is
  if (hasTranslatedChars && !message.includes('notifications.')) {
    return message
  }

  // Otherwise, use fallback based on type (safest option)
  return fallbackMessages[type] || message || t('common.notification')
}

// Get subtitle for notification type
const getNotificationSubtitle = (
  type: NotificationItemType['type'],
  t: (key: string, params?: Record<string, string | number>) => string
): string | null => {
  // Convert type to camelCase for key lookup
  const typeToKey: Record<NotificationItemType['type'], string> = {
    task_claimed: 'taskClaimed',
    task_completed: 'taskCompleted',
    work_confirmed: 'workConfirmed',
    payment_confirmed: 'paymentConfirmed',
    task_cancelled: 'taskCancelled',
    task_expired: 'taskExpired',
    user_restricted: 'userRestricted',
    user_unrestricted: 'userUnrestricted',
    user_blocked: 'userBlocked',
    claim_blocked: 'claimBlocked',
    support_reply: 'supportReply',
    support_message: 'supportReply',
  }

  const key = typeToKey[type]
  if (!key) return null

  try {
    const subtitle = t(`notifications.${key}.subtitle`)
    // If translation returned the same key, subtitle not found
    if (subtitle && subtitle !== `notifications.${key}.subtitle`) {
      return subtitle
    }
  } catch {
    // Fallback
  }

  return null
}

export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { t } = useI18n()
  const iconColor = getNotificationColor(notification.type, notification.read)
  const isUnread = !notification.read

  // Always get the correct translated message based on type
  // If stored message is a key, ignore it and use fallback
  const getTranslatedMessage = (): string => {
    const storedMessage = notification.message || ''
    
    // Check if stored message looks like a localization key
    const isKey = storedMessage.includes('.') && 
                  (storedMessage.startsWith('notifications.') || 
                   storedMessage.includes('notifications.') ||
                   storedMessage.match(/^notifications\.[a-zA-Z]+\.[a-zA-Z]+$/))
    
    // If it's definitely a key, always use fallback based on type
    if (isKey) {
      const fallbackMessages: Partial<Record<NotificationItemType['type'], string>> = {
        task_claimed: t('notifications.taskClaimed.message'),
        task_completed: t('notifications.taskCompleted.message'),
        work_confirmed: t('notifications.workConfirmed.message'),
        payment_confirmed: t('notifications.paymentConfirmed.message'),
        task_cancelled: t('notifications.taskCancelled.message'),
        task_expired: t('notifications.taskExpired.message'),
        user_restricted: t('notifications.userRestricted.message'),
        user_unrestricted: t('notifications.userUnrestricted.message'),
        user_blocked: t('notifications.userBlocked.message'),
        claim_blocked: t('notifications.claimBlocked.message'),
        support_reply: t('notifications.supportReply.message'),
      }
      const fallback = fallbackMessages[notification.type]
      // If fallback is a key (translation failed), return a safe message
      if (fallback && !fallback.includes('notifications.')) {
        return fallback
      }
      return t('common.notification')
    }
    
    // If stored message looks translated, use translateMessage to handle edge cases
    return translateMessage(storedMessage, notification.type, t)
  }

  const translatedMessage = getTranslatedMessage()
  
  // Get subtitle (microcopy)
  const subtitle = getNotificationSubtitle(notification.type, t)

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-2.5 border-b border-gray-100 dark:border-slate-800
        transition-colors duration-150
        ${isUnread ? 'bg-blue-50/50 dark:bg-blue-900/5' : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Compact Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>
          <div className="w-4 h-4">
            {getNotificationIcon(notification.type)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title + Time in one row */}
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <h4 className={`text-sm font-semibold leading-tight ${isUnread ? 'text-gray-900 dark:text-gray-50' : 'text-gray-700 dark:text-gray-300'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
              {formatTimestamp(notification.timestamp, t)}
            </span>
          </div>
          
          {/* Message - main text */}
          <p className={`text-sm leading-relaxed ${isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {translatedMessage}
          </p>
          
          {/* Subtitle (microcopy) - if available */}
          {subtitle && (
            <p className={`text-xs leading-relaxed mt-0.5 ${isUnread ? 'text-gray-500 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Unread indicator */}
        {isUnread && (
          <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
        )}
      </div>
    </button>
  )
}
