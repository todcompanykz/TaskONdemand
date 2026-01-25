'use client'

import { useEffect } from 'react'
import { useFCM } from '@/hooks/useFCM'
import { useAuth } from '@/contexts/AuthContext'

export default function FCMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { registerToken, unregisterToken, isSupported } = useFCM()

  // Register FCM token when user logs in (only on client side)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user && isSupported) {
      // Small delay to ensure auth context is fully initialized
      const timer = setTimeout(() => {
        registerToken()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [user, isSupported, registerToken])

  // Unregister FCM token when user logs out (only on client side)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user && isSupported) {
      unregisterToken()
    }
  }, [user, isSupported, unregisterToken])

  return <>{children}</>
}
