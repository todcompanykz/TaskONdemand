'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
import Navbar from '@/components/Navbar'
import OnboardingModal from '@/components/OnboardingModal'
import { useI18n } from '@/contexts/I18nContext'
import { StopwatchIcon, LocationPinIcon, StarIcon } from '@/components/TaskCardIcons'
import TaskCountdown from '@/components/TaskCountdown'
import ContextualHint from '@/components/ContextualHint'

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
  const [selectedCity, setSelectedCity] = useState<string>('Астана')
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
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

    // Load selected city from localStorage or default to 'Астана'
    const savedCity = localStorage.getItem('selected_city')
    if (savedCity) {
      setSelectedCity(savedCity)
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) {
      loadTasks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, user])

  const loadTasks = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      const data = await tasksApi.getFeed(selectedCity)
      setTasks(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки задач')
    } finally {
      setLoading(false)
    }
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    localStorage.setItem('selected_city', city)
  }

  if (authLoading || !user) {
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {t('feed.title', { city: selectedCity })}
            </h1>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="Астана">Астана</option>
            </select>
          </div>
          <button
            onClick={loadTasks}
            className="btn-outline text-sm"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('feed.refresh')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!loading && tasks.length === 0 && user && (
          <ContextualHint
            hintKey="zero_tasks"
            message={t('hints.zeroTasks')}
          />
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
                className="card hover:shadow-md transition-shadow block relative"
              >
                {/* Reward at top-right with highlight */}
                <div className="absolute top-4 right-4 bg-primary/10 dark:bg-primary/20 rounded-lg px-3 py-2">
                  <span className="text-3xl font-bold text-primary dark:text-blue-400">
                    {task.reward.toLocaleString()} ₸
                  </span>
                </div>

                {/* Urgency badge at top-left with icon */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${urgencyColors[task.urgency]}`}>
                    <StopwatchIcon className="w-4 h-4" />
                    {urgencyLabels[task.urgency]}
                  </span>
                  {task.createdBy?.ratingAvg && task.createdBy.ratingAvg > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                      <StarIcon className="w-3 h-3" filled />
                      {Number(task.createdBy.ratingAvg).toFixed(1)}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 pr-32">{task.shortDescription}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.fullDescription}</p>
                
                {/* Location with icon */}
                <div className="mb-4 flex items-center gap-2">
                  <LocationPinIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {task.city}, {task.address}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4">
                  {task.expiresAt && task.status === 'created' && (
                    <TaskCountdown expiresAt={task.expiresAt} status={task.status} />
                  )}
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
