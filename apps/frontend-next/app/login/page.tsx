'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[LOGIN] Form submitted', { email, hasPassword: !!password })
    
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'D',
          location: 'login/page.tsx:handleSubmit:entry',
          message: 'login_form_submitted',
          data: { email, hasPassword: !!password },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
    } catch(e) {}
    // #endregion

    setError('')
    setLoading(true)

    try {
      console.log('[LOGIN] Calling login function')
      await login(email, password)
      console.log('[LOGIN] Login successful, waiting before redirect')
      
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
            location: 'login/page.tsx:handleSubmit:before_redirect',
            message: 'login_success_before_redirect',
            data: {},
            timestamp: Date.now(),
          }),
        }).catch(() => {})
      } catch(e) {}
      // #endregion

      // Use window.location for full page reload to ensure state is loaded from localStorage
      console.log('[LOGIN] Redirecting to /feed with full reload')
      window.location.href = '/feed'
    } catch (err: any) {
      console.error('[LOGIN] Login error', err)
      console.error('[LOGIN] Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
      })
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
            location: 'login/page.tsx:handleSubmit:error',
            message: 'login_form_error',
            data: { 
              errorMessage: err?.message,
              errorResponse: err?.response?.data,
              statusCode: err?.response?.status,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
      } catch(e) {}
      // #endregion

      const errorMessage = err.response?.data?.message || err.message || t('auth.loginError')
      console.log('[LOGIN] Setting error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('common.taskOnDemand')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('auth.loginTitle')}</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">
                {t('auth.email')}
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
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? t('auth.loginLoading') : t('auth.loginButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {t('auth.registerLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
