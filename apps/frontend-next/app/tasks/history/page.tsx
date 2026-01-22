'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { useI18n } from '@/contexts/I18nContext'

const urgencyColors = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-orange-100 text-orange-700',
}

const urgencyLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

const statusLabels = {
  created: 'Создана',
  claimed: 'Взята',
  completed: 'Выполнена',
  cancelled: 'Отменена',
  expired: 'Истекла',
}

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [history, setHistory] = useState<{ created: Task[]; claimed: Task[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'created' | 'performing'>('created')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    loadHistory()
  }, [authLoading, user])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getHistory()
      setHistory(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки истории')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-8">Мои задачи</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'created'
                  ? 'border-primary text-primary dark:text-primary-light'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('taskHistory.tabCreated')}
            </button>
            <button
              onClick={() => setActiveTab('performing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'performing'
                  ? 'border-primary text-primary dark:text-primary-light'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('taskHistory.tabPerforming')}
            </button>
          </nav>
        </div>

        {activeTab === 'created' && (
          <section>
            {history?.created.length === 0 ? (
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  {t('emptyStates.historyCreated.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('emptyStates.historyCreated.description')}
                </p>
                <Link href="/tasks/create" className="btn-primary inline-block">
                  {t('emptyStates.historyCreated.action')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {history?.created.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="card hover:shadow-md transition-shadow block"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{task.shortDescription}</h3>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[task.urgency]}`}>
                          {urgencyLabels[task.urgency]}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {statusLabels[task.status]}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{task.fullDescription.substring(0, 100)}...</p>
                    {task.city && task.address && (
                      <p className="text-sm text-gray-500 mb-3">
                        📍 {task.city}, {task.address}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">
                        {task.reward.toLocaleString()} ₸
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'performing' && (
          <section>
            {history?.claimed.length === 0 ? (
              <div className="card text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  {t('emptyStates.historyClaimed.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('emptyStates.historyClaimed.description')}
                </p>
                <Link href="/feed" className="btn-primary inline-block">
                  {t('emptyStates.historyClaimed.action')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {history?.claimed.map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="card hover:shadow-md transition-shadow block"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{task.shortDescription}</h3>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[task.urgency]}`}>
                          {urgencyLabels[task.urgency]}
                        </span>
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                          {statusLabels[task.status]}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{task.fullDescription.substring(0, 100)}...</p>
                    {task.city && task.address && (
                      <p className="text-sm text-gray-500 mb-3">
                        📍 {task.city}, {task.address}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-primary">
                        {task.reward.toLocaleString()} ₸
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
