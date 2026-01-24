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

// Group notifications by date
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

export default function NotificationPanel({ isOpen, onClose, bellRef }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotificationHistory()
  const { t } = useI18n()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll to bottom (Telegram-style) when panel opens
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
      })
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
        ref={(el) => {
          if (panelRef) (panelRef as any).current = el;
        }}
        className={`
          fixed z-[9999] bg-white dark:bg-slate-900 shadow-xl border border-gray-200 dark:border-slate-700 flex flex-col
          ${isMobile
            ? 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl animate-slide-up'
            : 'top-16 right-4 w-[420px] max-h-[600px] rounded-lg animate-slide-in-right'
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-label={t('notificationHistory.title')}
      >
        {/* Fixed Header - Always on Top */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {t('notificationHistory.title')}
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Actions Menu (3-dot menu) */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Actions"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 z-20">
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
              )}
            </div>
            
            {/* Mobile: Close button */}
            {isMobile && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content - Telegram Style (New messages at bottom) */}
        <div 
          ref={contentRef}
          className="overflow-y-auto" 
          style={{ maxHeight: isMobile ? 'calc(80vh - 60px)' : '540px' }}
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
    </>
  )
}
