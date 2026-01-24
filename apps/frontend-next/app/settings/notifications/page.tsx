'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { usersApi, NotificationSettings, UpdateNotificationSettingsData } from '@/lib/api'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getNotificationSettings()
      setSettings(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки настроек')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return

    // System notifications cannot be fully disabled (but can be set to false for some)
    const systemKeys: (keyof NotificationSettings)[] = [
      'loginFromNewDevice',
      'passwordChange',
      'securityErrors',
      'accountBlocked',
    ]

    if (systemKeys.includes(key) && value === false) {
      // Allow disabling, but show warning
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings as NotificationSettings)
      await saveSettings({ [key]: value } as UpdateNotificationSettingsData)
      return
    }

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings as NotificationSettings)
    await saveSettings({ [key]: value } as UpdateNotificationSettingsData)
  }

  const saveSettings = async (updateData: UpdateNotificationSettingsData) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'apps/frontend-next/app/settings/notifications/page.tsx:saveSettings',
          message: 'update_notifications_start',
          data: updateData,
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      const updated = await usersApi.updateNotificationSettings(updateData)
      setSettings(updated)
      setSuccess(t('settings.notifications.updateSuccess') || 'Настройки успешно обновлены')
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H1',
          location: 'apps/frontend-next/app/settings/notifications/page.tsx:saveSettings:success',
          message: 'update_notifications_success',
          data: { updatedKeys: Object.keys(updateData) },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H2',
          location: 'apps/frontend-next/app/settings/notifications/page.tsx:saveSettings:error',
          message: 'update_notifications_error',
          data: { errorMessage: err.response?.data?.message || err.message, status: err.response?.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      setError(err.response?.data?.message || 'Ошибка обновления настроек')
      // Revert on error
      loadSettings()
    } finally {
      setSaving(false)
    }
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

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
        <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="card text-center">
            <p className="text-gray-600 dark:text-gray-400">{t('common.error')}</p>
          </div>
        </div>
      </div>
    )
  }

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            {t('settings.notifications.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('settings.notifications.description')}
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

        <div className="space-y-6">
          {/* System Notifications */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              {t('settings.notifications.system.title')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('settings.notifications.system.description')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.system.loginFromNewDevice')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.system.loginFromNewDeviceDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.loginFromNewDevice}
                  onChange={(checked) => handleToggle('loginFromNewDevice', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.system.passwordChange')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.system.passwordChangeDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.passwordChange}
                  onChange={(checked) => handleToggle('passwordChange', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.system.securityErrors')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.system.securityErrorsDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.securityErrors}
                  onChange={(checked) => handleToggle('securityErrors', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.system.accountBlocked')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.system.accountBlockedDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.accountBlocked}
                  onChange={(checked) => handleToggle('accountBlocked', checked)}
                />
              </div>
            </div>
          </div>

          {/* Account and Profile */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              {t('settings.notifications.account.title')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.account.profileChanges')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.account.profileChangesDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.profileChanges}
                  onChange={(checked) => handleToggle('profileChanges', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.account.actionConfirmation')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.account.actionConfirmationDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.actionConfirmation}
                  onChange={(checked) => handleToggle('actionConfirmation', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.account.sessionExpiration')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.account.sessionExpirationDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.sessionExpiration}
                  onChange={(checked) => handleToggle('sessionExpiration', checked)}
                />
              </div>
            </div>
          </div>

          {/* Work/Service Notifications */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
              {t('settings.notifications.work.title')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.newMessages')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.newMessagesDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.newMessages}
                  onChange={(checked) => handleToggle('newMessages', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.newTasks')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.newTasksDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.newTasks}
                  onChange={(checked) => handleToggle('newTasks', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.taskStatusChange')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.taskStatusChangeDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.taskStatusChange}
                  onChange={(checked) => handleToggle('taskStatusChange', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.taskComments')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.taskCommentsDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.taskComments}
                  onChange={(checked) => handleToggle('taskComments', checked)}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.executorAssigned')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.executorAssignedDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.executorAssigned}
                  onChange={(checked) => handleToggle('executorAssigned', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {t('settings.notifications.work.supportReplies')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('settings.notifications.work.supportRepliesDesc')}
                  </p>
                </div>
                <ToggleSwitch
                  checked={settings.supportReplies}
                  onChange={(checked) => handleToggle('supportReplies', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-outline"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
