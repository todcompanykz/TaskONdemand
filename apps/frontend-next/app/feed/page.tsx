'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
import Navbar from '@/components/Navbar'
import OnboardingModal from '@/components/OnboardingModal'
import { useI18n } from '@/contexts/I18nContext'

const urgencyColors = {
  low: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300',
  medium: 'bg-warning/20 dark:bg-warning/30 text-warning dark:text-yellow-400',
  high: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
}

const urgencyLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

export default function FeedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    console.log('[FEED] Auth check', { authLoading, user: !!user, userId: user?.id })
    if (!authLoading && !user) {
      console.log('[FEED] No user, redirecting to login')
      router.push('/login')
      return
    }

    // Check onboarding status
    if (!authLoading && user) {
      const onboardingCompleted = localStorage.getItem('onboarding_completed')
      if (!onboardingCompleted) {
        setShowOnboarding(true)
      }
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          setError('Не удалось получить ваше местоположение. Пожалуйста, разрешите доступ к геолокации.')
          // Default to Astana center
          setLocation({ lat: 51.1694, lng: 71.4304 })
        }
      )
    } else {
      // Default to Astana center
      setLocation({ lat: 51.1694, lng: 71.4304 })
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (location) {
      loadTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const loadTasks = async () => {
    if (!location) return

    try {
      setLoading(true)
      const data = await tasksApi.getFeed(location.lng, location.lat)
      setTasks(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки задач')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !location) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Астана</h1>
          <button
            onClick={loadTasks}
            className="btn-outline text-sm"
            disabled={loading}
          >
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка задач...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">
              {t('emptyStates.feed.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t('emptyStates.feed.description')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              {t('emptyStates.feed.hint')}
            </p>
            <Link href="/tasks/create" className="btn-primary inline-block">
              {t('emptyStates.feed.action')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="card hover:shadow-md transition-shadow block"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{task.shortDescription}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[task.urgency]}`}>
                    {urgencyLabels[task.urgency]}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{task.fullDescription}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    📍 {task.city}, {task.address}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary dark:text-blue-400">
                    {task.reward.toLocaleString()} ₸
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
