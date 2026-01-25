'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import { useI18n } from '@/contexts/I18nContext'
import { useRouter } from 'next/navigation'
import NotificationItem from './NotificationItem'

interface MobileNotificationScreenProps {
  isOpen: boolean
  onClose: () => void
}

// Group notifications by date (same logic as NotificationPanel)
const groupNotificationsByDate = (notifications: any[]) => {
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  
  const groups: {
    today: any[]
    yesterday: any[]
    thisWeek: any[]
    older: any[]
  } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  }
  
  notifications.forEach(notification => {
    const diff = now - notification.timestamp
    const days = Math.floor(diff / oneDayMs)
    
    if (days === 0) {
      groups.today.push(notification)
    } else if (days === 1) {
      groups.yesterday.push(notification)
    } else if (days < 7) {
      groups.thisWeek.push(notification)
    } else {
      groups.older.push(notification)
    }
  })
  
  return groups
}

export default function MobileNotificationScreen({ isOpen, onClose }: MobileNotificationScreenProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotificationHistory()
  const { t } = useI18n()
  const router = useRouter()
  const contentRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const backButtonRef = useRef<HTMLButtonElement>(null)

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setIsOpening(false)
    }, 450) // Match animation duration
  }

  // Handle opening animation
  useEffect(() => {
    if (isOpen) {
      setIsOpening(true)
      // Trigger animation after a small delay to ensure initial state is set
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpening(false)
        })
      })
    }
  }, [isOpen])

  // Auto-scroll to bottom (Telegram-style) when screen opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
      })
      // Focus back button for accessibility
      backButtonRef.current?.focus()
    }
  }, [isOpen])
  
  // Scroll to bottom when new notifications arrive
  useEffect(() => {
    if (isOpen && contentRef.current && notifications.length > 0) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
      })
    }
  }, [isOpen, notifications.length])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col"
      style={{
        transform: isClosing ? 'translateX(100%)' : isOpening ? 'translateX(100%)' : 'translateX(0)',
        transition: 'transform 450ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        willChange: 'transform',
        width: '100%',
        height: '100dvh', // Dynamic viewport height for mobile
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t('notificationHistory.title')}
    >
      {/* Fixed Header */}
      <header 
        className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Back Button */}
          <button
            ref={backButtonRef}
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
            aria-label={t('common.close')}
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 flex-1 text-center">
            {t('notificationHistory.title')}
          </h2>

          {/* Actions Menu (3-dot menu) */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors touch-target"
              aria-label="Actions"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-30">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { markAllAsRead(); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      {t('notificationHistory.markAllRead')}
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm(t('notificationHistory.clearAll') + '?')) {
                          clearHistory();
                          setShowMenu(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      {t('notificationHistory.clearAll')}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content - Scrollable */}
      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('notificationHistory.empty')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{t('notificationHistory.emptyDescription')}</p>
          </div>
        ) : (
          <>
            {(() => {
              const grouped = groupNotificationsByDate(notifications)
              // REVERSE ORDER: Show oldest first at top, newest at bottom (Telegram-style)
              return (
                <>
                  {/* Older messages at top */}
                  {grouped.older.length > 0 && (
                    <div>
                      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('notificationHistory.older')}
                      </div>
                      {grouped.older.reverse().map(notification => (
                        <NotificationItem key={notification.id} notification={notification} onClick={() => handleNotificationClick(notification)} />
                      ))}
                    </div>
                  )}
                  {grouped.thisWeek.length > 0 && (
                    <div>
                      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('notificationHistory.thisWeek')}
                      </div>
                      {grouped.thisWeek.reverse().map(notification => (
                        <NotificationItem key={notification.id} notification={notification} onClick={() => handleNotificationClick(notification)} />
                      ))}
                    </div>
                  )}
                  {grouped.yesterday.length > 0 && (
                    <div>
                      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('notificationHistory.yesterday')}
                      </div>
                      {grouped.yesterday.reverse().map(notification => (
                        <NotificationItem key={notification.id} notification={notification} onClick={() => handleNotificationClick(notification)} />
                      ))}
                    </div>
                  )}
                  {/* Today (newest) at bottom */}
                  {grouped.today.length > 0 && (
                    <div>
                      <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {t('notificationHistory.today')}
                      </div>
                      {grouped.today.reverse().map(notification => (
                        <NotificationItem key={notification.id} notification={notification} onClick={() => handleNotificationClick(notification)} />
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}
