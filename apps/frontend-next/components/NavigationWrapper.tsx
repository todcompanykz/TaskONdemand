'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import MobileTopBar from './MobileTopBar'
import MobileBottomNav from './MobileBottomNav'

export default function NavigationWrapper() {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // #region agent log
  if (typeof window !== 'undefined') {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationWrapper.tsx:12',message:'NavigationWrapper render',data:{hasUser:!!user,loading:loading,pathname:pathname,userId:user?.id,userEmail:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
  }
  // #endregion

  // Don't render navigation on login/register pages, even if user is authenticated
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  // Don't render navigation if loading, user is not authenticated, or on auth pages
  if (loading || !user || isAuthPage) {
    // #region agent log
    if (typeof window !== 'undefined') {
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationWrapper.tsx:22',message:'NavigationWrapper returning null',data:{hasUser:!!user,loading:loading,isAuthPage:isAuthPage,pathname:pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      } catch(e) {}
    }
    // #endregion
    return null
  }

  // #region agent log
  if (typeof window !== 'undefined') {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationWrapper.tsx:28',message:'NavigationWrapper rendering nav components',data:{hasUser:!!user,loading:loading,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
  }
  // #endregion

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
