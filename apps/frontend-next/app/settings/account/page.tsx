'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { usersApi, UpdateProfileData } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function AccountSettingsPage() {
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
  }, [user])

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'apps/frontend-next/app/settings/account/page.tsx:handleSubmit',
          message: 'update_profile_start',
          data: { hasEmail: !!formData.email, hasFirstName: !!formData.firstName },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      const updated = await usersApi.updateProfile(formData)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'apps/frontend-next/app/settings/account/page.tsx:handleSubmit:success',
          message: 'update_profile_success',
          data: { updatedEmail: updated.email },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      // Update auth context
      updateUser(updated)
      setSuccess(t('settings.account.updateSuccess') || 'Профиль успешно обновлён')
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H2',
          location: 'apps/frontend-next/app/settings/account/page.tsx:handleSubmit:error',
          message: 'update_profile_error',
          data: { errorMessage: err.response?.data?.message || err.message, status: err.response?.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      setError(err.response?.data?.message || 'Ошибка обновления профиля')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Navbar />
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {t('settings.account.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('settings.account.description')}
          </p>
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

        <div className="card">
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
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-outline"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
