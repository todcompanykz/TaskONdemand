'use client'

import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nProvider } from '@/contexts/I18nContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { NotificationHistoryProvider } from '@/contexts/NotificationHistoryContext'
import ToastContainer from '@/components/ToastContainer'
import NotificationChecker from '@/components/NotificationChecker'
import NavigationWrapper from '@/components/NavigationWrapper'
import FCMProvider from '@/components/FCMProvider'
import HideAddressBar from '@/components/HideAddressBar'
import PageTransition from '@/components/PageTransition'

const InstallPrompt = dynamic(() => import('@/components/InstallPrompt'), {
  ssr: false,
})
const AiAssistantWidget = dynamic(() => import('@/components/AiAssistantWidget'), {
  ssr: false,
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationHistoryProvider>
              <FCMProvider>
                <HideAddressBar />
                <NavigationWrapper />
                <main className="mobile-content">
                  <PageTransition>
                    {children}
                  </PageTransition>
                </main>
                <NotificationChecker />
                <AiAssistantWidget />
                <ToastContainer />
                <InstallPrompt />
              </FCMProvider>
            </NotificationHistoryProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
