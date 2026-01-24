'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* City Filter - Search Bar Style */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
            {/* Location Icon */}
            <svg 
              className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            
            {/* City Selector */}
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base font-medium text-gray-900 dark:text-gray-50 cursor-pointer"
            >
              <option value="Астана">Астана</option>
            </select>
            
            {/* Refresh Icon Button */}
            <button
              onClick={loadTasks}
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label={t('feed.refresh')}
            >
              <svg 
                className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
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
          <div className="card text-center py-12 md:py-16 px-4">
            {/* Smaller, lighter icon */}
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Compact text with better line-height */}
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 leading-relaxed">
              {t('emptyStates.feed.title')}
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-sm mx-auto">
              {t('emptyStates.feed.description')}
            </p>
            
            <Link href="/tasks/create" className="btn-primary inline-block w-full md:w-auto">
              {t('emptyStates.feed.action')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {tasks.map((task) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="card hover:shadow-md transition-shadow block relative p-4 md:p-6"
              >
                {/* Reward at top-right with highlight - Responsive */}
                <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-primary/10 dark:bg-primary/20 rounded-lg px-2 py-1 md:px-3 md:py-2">
                  <span className="text-xl md:text-3xl font-bold text-primary dark:text-blue-400">
                    {task.reward.toLocaleString()} ₸
                  </span>
                </div>

                {/* Urgency badge at top-left with icon */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold flex items-center gap-1.5 ${urgencyColors[task.urgency]}`}>
                    <StopwatchIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {urgencyLabels[task.urgency]}
                  </span>
                  {task.createdBy?.ratingAvg && task.createdBy.ratingAvg > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                      <StarIcon className="w-3 h-3" filled />
                      {Number(task.createdBy.ratingAvg).toFixed(1)}
                    </span>
                  )}
                </div>

                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2 pr-20 md:pr-32">{task.shortDescription}</h2>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.fullDescription}</p>
                
                {/* Location with icon */}
                <div className="mb-3 md:mb-4 flex items-center gap-2">
                  <LocationPinIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    {task.city}, {task.address}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-3 md:mt-4">
                  {task.expiresAt && task.status === 'created' && (
                    <TaskCountdown expiresAt={task.expiresAt} status={task.status} />
                  )}
                  <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
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
