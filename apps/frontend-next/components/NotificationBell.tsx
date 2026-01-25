'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import NotificationPanel from './NotificationPanel'
import MobileNotificationScreen from './MobileNotificationScreen'

export default function NotificationBell() {
  const { unreadCount } = useNotificationHistory()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const togglePanel = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <>
      <button
        ref={bellRef}
        onClick={togglePanel}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isMobile ? (
        <MobileNotificationScreen isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : (
        <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} bellRef={bellRef} />
      )}
    </>
  )
}
