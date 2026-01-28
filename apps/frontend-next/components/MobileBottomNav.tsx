'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { 
  HomeIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  UserIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  PlusIcon as PlusIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  UserIcon as UserIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from '@heroicons/react/24/solid'

export default function MobileBottomNav() {
  const { user, isAdmin } = useAuth()
  const { t } = useI18n()
  const pathname = usePathname()

  // #region agent log
  if (typeof window !== 'undefined') {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MobileBottomNav.tsx:25',message:'MobileBottomNav render',data:{hasUser:!!user,pathname:pathname,userId:user?.id,isAdmin:isAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
  }
  // #endregion

  const navItems = [
    {
      href: '/feed',
      label: t('nav.feed'),
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      href: '/tasks/create',
      label: t('nav.createTask'),
      icon: PlusIcon,
      iconSolid: PlusIconSolid,
    },
    {
      href: '/tasks/history',
      label: t('nav.myTasks'),
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
    },
    ...(isAdmin ? [{
      href: '/admin',
      label: t('nav.admin'),
      icon: Cog6ToothIcon,
      iconSolid: Cog6ToothIconSolid,
    }] : []),
    {
      href: user?.id ? `/users/${user.id}` : '/login',
      label: t('nav.profile'),
      icon: UserIcon,
      iconSolid: UserIconSolid,
    },
  ]

  // #region agent log
  if (typeof window !== 'undefined') {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MobileBottomNav.tsx:50',message:'MobileBottomNav navItems',data:{navItemsCount:navItems.length,pathname:pathname,isActive:navItems.map(item => ({href:item.href,isActive:pathname === item.href}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
  }
  // #endregion

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 shadow-lg mobile-bottom-nav">
      <div className="h-16 flex items-center justify-around px-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}>
        {navItems.map((item) => {
          // For profile, also check if we're on the user's profile page
          const isActive = pathname === item.href || 
            pathname?.startsWith(item.href + '/') ||
            (item.href.includes('/users/') && user?.id && pathname === `/users/${user.id}`)
          const IconComponent = isActive ? item.iconSolid : item.icon

          // #region agent log
          if (typeof window !== 'undefined') {
            try {
              fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MobileBottomNav.tsx:65',message:'MobileBottomNav nav item',data:{href:item.href,isActive:isActive,pathname:pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            } catch(e) {}
          }
          // #endregion

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-2 transition-colors ${
                isActive
                  ? 'text-primary dark:text-primary-light'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
