'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { usersApi, UpdateProfileData } from '@/lib/api'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeToggle from '@/components/ThemeToggle'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadUserData()
  }, [user, router])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userData = await usersApi.getMe()
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const updated = await usersApi.updateProfile(formData)
      updateUser(updated)
      setSuccess(t('settings.account.updateSuccess') || 'Профиль успешно обновлён')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка обновления профиля')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {t('settings.title')}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Account Settings Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
            {t('settings.account.title')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="label">
                  {t('auth.firstName')}
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="label">
                  {t('auth.lastName')}
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="label">
                {t('auth.phoneOptional')}
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="input"
                placeholder="+77001234567"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (t('common.saving') || 'Сохранение...') : (t('common.save') || 'Сохранить')}
              </button>
            </div>
          </form>
        </div>

        {/* General Settings Section */}
        <div className="card space-y-0">
          {/* Language Section */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.language')}
              </span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Appearance Section */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.appearance')}
              </span>
            </div>
            <div className="relative" style={{ width: '80px', height: '40px' }}>
              <ThemeToggle />
            </div>
          </div>

          {/* Support Chat Section */}
          <Link
            href="/messages"
            className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-5 h-5 text-primary dark:text-primary-light" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Безопасность общения
              </span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>

          <Link
            href="/support"
            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary dark:text-primary-light" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.supportChat')}
              </span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  )
}
