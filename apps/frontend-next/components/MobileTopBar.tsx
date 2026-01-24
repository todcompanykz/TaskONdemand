'use client'

import { useI18n } from '@/contexts/I18nContext'
import NotificationBell from './NotificationBell'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileTopBar() {
  const { t } = useI18n()
  const { user } = useAuth()

  if (!user) return null

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="text-lg font-bold text-primary dark:text-primary-light">
          {t('common.taskOnDemand')}
        </h1>
        <NotificationBell />
      </div>
    </header>
  )
}
