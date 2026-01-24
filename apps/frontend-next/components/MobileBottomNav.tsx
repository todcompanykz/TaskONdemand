'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useI18n()

  if (!user) return null

  const navItems = [
    {
      name: t('nav.feed'),
      href: '/feed',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none'}`}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      isActive: pathname === '/feed',
    },
    {
      name: t('nav.createTask'),
      href: '/tasks/create',
      icon: (active: boolean) => (
        <svg
          className="w-7 h-7"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11H13V5C13 4.44772 12.5523 4 12 4Z" />
        </svg>
      ),
      isActive: pathname === '/tasks/create',
      emphasized: true,
    },
    {
      name: t('nav.myTasks'),
      href: '/tasks/history',
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none'}`}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      isActive: pathname === '/tasks/history',
    },
    {
      name: t('profile.profile'),
      href: `/users/${user.id}`,
      icon: (active: boolean) => (
        <svg
          className={`w-6 h-6 ${active ? 'fill-current' : 'fill-none'}`}
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      isActive: pathname === `/users/${user.id}`,
    },
  ]

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 shadow-lg"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.isActive
          const isEmphasized = item.emphasized

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[60px] min-h-[44px] transition-colors ${
                isEmphasized
                  ? isActive
                    ? 'text-primary dark:text-primary-light'
                    : 'text-primary dark:text-primary-light'
                  : isActive
                  ? 'text-primary dark:text-primary-light'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div
                className={`flex items-center justify-center ${
                  isEmphasized ? 'transform scale-110' : ''
                }`}
              >
                {item.icon(isActive)}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isEmphasized ? 'font-semibold' : ''
                }`}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
