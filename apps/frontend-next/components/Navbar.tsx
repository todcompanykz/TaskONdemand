'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'


export default function Navbar() {
  const router = useRouter()
  const { user, logout, isAdmin } = useAuth()
  const { t } = useI18n()

  // #region agent log
  useEffect(() => {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Navbar.tsx:13',message:'Navbar render',data:{hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    } catch(e) {}
  }, [user]);

  useEffect(() => {
    try {
      const wrapper = document.querySelector('[data-theme-toggle-wrapper="true"]')
      const toggle = document.querySelector('[data-theme-toggle="true"]')
      const wrapperStyles = wrapper ? window.getComputedStyle(wrapper) : null
      const toggleStyles = toggle ? window.getComputedStyle(toggle) : null
      const wrapperRect = wrapper?.getBoundingClientRect()
      const toggleRect = toggle?.getBoundingClientRect()
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Navbar.tsx:20',message:'Navbar ThemeToggle wrapper check',data:{hasWrapper:!!wrapper,hasToggle:!!toggle,wrapperWidth:wrapperStyles?.width,wrapperHeight:wrapperStyles?.height,wrapperDisplay:wrapperStyles?.display,wrapperRect:wrapperRect?{x:wrapperRect.x,y:wrapperRect.y,width:wrapperRect.width,height:wrapperRect.height}:null,toggleWidth:toggleStyles?.width,toggleHeight:toggleStyles?.height,toggleDisplay:toggleStyles?.display,toggleRect:toggleRect?{x:toggleRect.x,y:toggleRect.y,width:toggleRect.width,height:toggleRect.height}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    } catch(e) {}
  }, []);
  // #endregion

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/feed" className="text-xl font-bold text-primary dark:text-primary-light">
              {t('common.taskOnDemand')}
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/feed" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.feed')}
              </Link>
              <Link href="/tasks/create" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.createTask')}
              </Link>
              <Link href="/tasks/history" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
                {t('nav.myTasks')}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {t('nav.admin')}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <Link 
                href={`/users/${user.id}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light hidden sm:block font-medium"
              >
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
              </Link>
            )}
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Theme Toggle Switch */}
            <div 
              className="relative flex items-center" 
              style={{ width: '80px', height: '40px', minWidth: '80px', minHeight: '40px' }}
              data-theme-toggle-wrapper="true"
            >
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-700 dark:text-gray-300 hover:text-danger dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
