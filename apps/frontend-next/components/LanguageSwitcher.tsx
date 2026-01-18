'use client'

import { useI18n } from '@/contexts/I18nContext'

const languages = [
  { code: 'ru' as const, name: 'Русский' },
  { code: 'kk' as const, name: 'Қазақша' },
  { code: 'en' as const, name: 'English' },
]

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ru' | 'kk' | 'en')}
        className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light cursor-pointer appearance-none pr-8"
        aria-label="Language selector"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}
