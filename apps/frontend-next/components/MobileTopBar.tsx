'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import NotificationBell from '@/components/NotificationBell'
import UserDropdownMenu from '@/components/UserDropdownMenu'

export default function MobileTopBar() {
  const { user, isAdmin } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()

  // #region agent log
  if (typeof window !== 'undefined') {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MobileTopBar.tsx:15',message:'MobileTopBar render',data:{hasUser:!!user,pathname:pathname,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
  }
  // #endregion

  return (
    <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200 mobile-top-bar">
      <div className="h-14 flex items-center justify-between px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* Logo/Title */}
        <Link href="/feed" className="text-lg font-bold text-primary dark:text-primary-light flex-shrink-0">
          {t('common.taskOnDemand')}
        </Link>

        {/* Right side actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {user && (
            <>
              <NotificationBell />
              <UserDropdownMenu />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
