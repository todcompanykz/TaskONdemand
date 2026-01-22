'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotificationService } from '@/hooks/useNotificationService'

export default function NotificationChecker() {
  const { user, loading } = useAuth()
  const { checkAll } = useNotificationService()

  useEffect(() => {
    // Only check notifications when user is authenticated and not loading
    if (!loading && user) {
      // Initial check on mount
      checkAll()

      // Set up periodic checks (every 60 seconds)
      const interval = setInterval(() => {
        checkAll()
      }, 60000)

      // Check on window focus (user returns to tab)
      const handleFocus = () => {
        checkAll()
      }
      window.addEventListener('focus', handleFocus)

      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [user, loading, checkAll])

  return null // This component doesn't render anything
}
