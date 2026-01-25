'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const { t } = useI18n()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if app was previously installed
    if (localStorage.getItem('pwa-installed') === 'true') {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Don't prevent default immediately - only when we're ready to show the prompt
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      // Show prompt after a short delay to avoid blocking browser's native prompt
      setTimeout(() => {
        setShowPrompt(true)
      }, 1000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if app was installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
        localStorage.setItem('pwa-installed', 'true')
      }
    } catch (error) {
      console.error('Error showing install prompt:', error)
    } finally {
      // Clear the deferred prompt
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or dismissed in this session
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed') === 'true') {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-primary dark:text-primary-light"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-1">
              {t('install.title') || 'Установить приложение'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {t('install.description') || 'Установите Task on Demand для быстрого доступа и работы офлайн'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="btn-primary text-sm py-2 px-4 flex-1"
              >
                {t('install.button') || 'Установить'}
              </button>
              <button
                onClick={handleDismiss}
                className="btn-outline text-sm py-2 px-4"
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
