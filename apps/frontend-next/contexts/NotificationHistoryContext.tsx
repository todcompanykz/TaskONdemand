'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { NotificationType } from '@/hooks/useNotificationService'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  taskId?: string
  actionUrl?: string
}

interface NotificationHistoryContextType {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (item: Omit<NotificationItem, 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearHistory: () => void
  getNotifications: () => NotificationItem[]
}

const NotificationHistoryContext = createContext<NotificationHistoryContextType | undefined>(undefined)

const MAX_NOTIFICATIONS = 100
const STORAGE_KEY_PREFIX = 'notification_history_'

export function NotificationHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Load notifications from localStorage on mount and when user changes
  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}`
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as NotificationItem[]
        // Ensure all notifications have read property
        const normalized = parsed.map((n) => ({
          ...n,
          read: n.read ?? false,
        }))
        setNotifications(normalized)
      }
    } catch (error) {
      console.error('Failed to load notification history:', error)
      setNotifications([])
    }
  }, [user?.id])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!user?.id) return

    const storageKey = `${STORAGE_KEY_PREFIX}${user.id}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to save notification history:', error)
    }
  }, [notifications, user?.id])

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'read'>) => {
      if (!user?.id) return

      const newNotification: NotificationItem = {
        ...item,
        read: false,
      }

      setNotifications((prev) => {
        // Check if notification with same id already exists
        const exists = prev.find((n) => n.id === newNotification.id)
        if (exists) {
          // Update existing notification
          return prev.map((n) => (n.id === newNotification.id ? newNotification : n))
        }

        // Add new notification and limit to MAX_NOTIFICATIONS
        const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS)
        return updated
      })
    },
    [user?.id]
  )

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearHistory = useCallback(() => {
    setNotifications([])
  }, [])

  const getNotifications = useCallback(() => {
    // Return newest first
    return [...notifications].sort((a, b) => b.timestamp - a.timestamp)
  }, [notifications])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  return (
    <NotificationHistoryContext.Provider
      value={{
        notifications: getNotifications(),
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearHistory,
        getNotifications,
      }}
    >
      {children}
    </NotificationHistoryContext.Provider>
  )
}

export function useNotificationHistory() {
  const context = useContext(NotificationHistoryContext)
  
  // Always return safe default if context is undefined (SSR or provider not initialized)
  if (context === undefined) {
    return {
      notifications: [],
      unreadCount: 0,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearHistory: () => {},
      getNotifications: () => [],
    }
  }
  
  return context
}
