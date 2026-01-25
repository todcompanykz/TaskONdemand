'use client'

export const dynamic = 'force-dynamic'

import { useI18n } from '@/contexts/I18nContext'
import Link from 'next/link'

export default function OfflinePage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
          {t('offline.title') || 'Нет подключения к интернету'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('offline.description') || 'Проверьте подключение к интернету и попробуйте снова.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          {t('offline.retry') || 'Попробовать снова'}
        </button>
      </div>
    </div>
  )
}
