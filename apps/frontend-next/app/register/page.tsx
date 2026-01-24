'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { t } = useI18n()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }

    setLoading(true)

    try {
      await register(email, firstName, lastName, password, confirmPassword, phoneNumber || undefined)
      router.push('/feed')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('auth.registerError')
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('common.taskOnDemand')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('auth.registerTitle')}</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="label">
                {t('auth.firstName')} *
              </label>
              <input
                id="firstName"
                type="text"
                required
                maxLength={100}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
                placeholder="Иван"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="label">
                {t('auth.lastName')} *
              </label>
              <input
                id="lastName"
                type="text"
                required
                maxLength={100}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
                placeholder="Иванов"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                {t('auth.email')} *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                {t('auth.password')} *
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder={t('auth.passwordMinLength')}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                {t('auth.confirmPassword')} *
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder={t('auth.confirmPassword')}
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                {t('auth.phoneOptional')}
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input"
                placeholder={t('task.placeholders.phone')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('auth.registerLoading') : t('auth.registerButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.haveAccount')}{' '}
              <Link href="/login" className="text-primary dark:text-primary-light hover:underline font-medium">
                {t('auth.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
