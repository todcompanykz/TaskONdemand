'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navbar from './Navbar'
import MobileTopBar from './MobileTopBar'
import MobileBottomNav from './MobileBottomNav'

export default function NavigationWrapper() {
  const { user } = useAuth()

  // Don't render navigation if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <Navbar />

      {/* Mobile Navigation - Hidden on desktop */}
      <MobileTopBar />
      <MobileBottomNav />
    </>
  )
}
