'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'
import NotificationItem from './NotificationItem'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  bellRef?: React.RefObject<HTMLButtonElement>
}

export default function NotificationPanel({ isOpen, onClose, bellRef }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotificationHistory()
  const { t } = useI18n()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        bellRef?.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    // Add slight delay to prevent immediate close on open
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, bellRef])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[9998] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          fixed z-[9999] bg-white dark:bg-slate-900 shadow-xl border border-gray-200 dark:border-slate-700
          ${isMobile
            ? 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl animate-slide-up'
            : 'top-16 right-4 w-[420px] max-h-[600px] rounded-lg animate-slide-in-right'
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-label={t('notificationHistory.title')}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('notificationHistory.title')}
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {t('notificationHistory.markAllRead')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(80vh - 60px)' : '540px' }}>
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{t('notificationHistory.empty')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{t('notificationHistory.emptyDescription')}</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer (optional - clear all button) */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (confirm(t('notificationHistory.clearAll') + '?')) {
                  clearHistory()
                }
              }}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              {t('notificationHistory.clearAll')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
