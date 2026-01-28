'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AccountSettingsRedirect() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.replace('/settings')
    } else {
      router.replace('/login')
    }
  }, [user, router])

  return null
}
