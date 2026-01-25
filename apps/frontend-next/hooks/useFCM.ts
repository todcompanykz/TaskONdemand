'use client'

import { useEffect, useState, useCallback } from 'react'
import { getFCMToken, onForegroundMessage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import { useToast } from '@/contexts/ToastContext'
import { useI18n } from '@/contexts/I18nContext'
import { usersApi } from '@/lib/api'

export function useFCM() {
  const { user } = useAuth()
  const notificationHistory = useNotificationHistory()
  const { showToast } = useToast()
  const { t } = useI18n()
  const [token, setToken] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  // Check if FCM is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
      setIsSupported(true)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  // Register FCM token
  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!user || !isSupported) return null

    try {
      // Request permission first
      const hasPermission = await requestPermission()
      if (!hasPermission) {
        console.warn('Notification permission not granted')
        return null
      }

      // Get FCM token
      const fcmToken = await getFCMToken()
      if (!fcmToken) {
        console.warn('Failed to get FCM token')
        return null
      }

      setToken(fcmToken)

      // Send token to backend
      try {
        await usersApi.updateFCMToken(fcmToken)
        setIsRegistered(true)
        console.log('FCM token registered successfully')
      } catch (error) {
        console.error('Error sending FCM token to backend:', error)
        // Token is still valid, just backend registration failed
      }

      return fcmToken
    } catch (error) {
      console.error('Error registering FCM token:', error)
      return null
    }
  }, [user, isSupported, requestPermission])

  // Unregister FCM token
  const unregisterToken = useCallback(async () => {
    if (!user) return

    try {
      await usersApi.updateFCMToken(null)
      setToken(null)
      setIsRegistered(false)
    } catch (error) {
      console.error('Error unregistering FCM token:', error)
    }
  }, [user])

  // Setup foreground message handler
  useEffect(() => {
    if (!user || !isSupported || typeof window === 'undefined') return

    let unsubscribeFn: (() => void) | null = null

    onForegroundMessage((payload) => {
      console.log('Foreground FCM message received:', payload)

      // Helper function to translate message if it's a localization key
      const translateMessage = (text: string | undefined): string => {
        if (!text) return ''
        // Check if it looks like a localization key (contains dots)
        if (text.includes('.') && text.startsWith('notifications.')) {
          try {
            return t(text as any)
          } catch {
            return text
          }
        }
        return text
      }

      // Get translated title and message
      const rawTitle = payload.notification?.title || payload.data?.title
      const rawMessage = payload.notification?.body || payload.data?.message
      const title = translateMessage(rawTitle) || t('common.notification')
      const message = translateMessage(rawMessage) || ''

      // Add to notification history
      if (payload.data && notificationHistory?.addNotification) {
        notificationHistory.addNotification({
          id: payload.data.id || `fcm-${Date.now()}`,
          type: payload.data.type as any,
          title,
          message,
          timestamp: Date.now(),
          taskId: payload.data.taskId,
          actionUrl: payload.data.actionUrl,
        })
      }

      // Show toast notification
      if (payload.notification || payload.data) {
        // Determine toast type from notification type
        let toastType: 'success' | 'error' | 'info' | 'warning' = 'info'
        if (payload.data?.type) {
          const type = payload.data.type
          if (type.includes('completed') || type.includes('confirmed') || type.includes('unrestricted')) {
            toastType = 'success'
          } else if (type.includes('cancelled') || type.includes('expired') || type.includes('restricted') || type.includes('blocked')) {
            toastType = 'error'
          } else if (type.includes('warning')) {
            toastType = 'warning'
          }
        }

        showToast(
          message || title,
          toastType,
          8000
        )
      }
    }).then((unsubscribe) => {
      unsubscribeFn = unsubscribe
    })

    return () => {
      if (unsubscribeFn) unsubscribeFn()
    }
  }, [user, isSupported, notificationHistory, showToast, t])

  // Auto-register on mount if user is logged in
  useEffect(() => {
    if (user && isSupported && !token && !isRegistered) {
      registerToken()
    }
  }, [user, isSupported, token, isRegistered, registerToken])

  return {
    token,
    isSupported,
    isRegistered,
    requestPermission,
    registerToken,
    unregisterToken,
  }
}
