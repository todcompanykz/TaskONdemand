'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { I18nProvider } from '@/contexts/I18nContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { NotificationHistoryProvider } from '@/contexts/NotificationHistoryContext'
import ToastContainer from '@/components/ToastContainer'
import NotificationChecker from '@/components/NotificationChecker'
import NavigationWrapper from '@/components/NavigationWrapper'
import FCMProvider from '@/components/FCMProvider'
import InstallPrompt from '@/components/InstallPrompt'
import HideAddressBar from '@/components/HideAddressBar'

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
                  {children}
                </main>
                <NotificationChecker />
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
