'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
import OnboardingModal from '@/components/OnboardingModal'
import { useI18n } from '@/contexts/I18nContext'
import ContextualHint from '@/components/ContextualHint'
import TaskCard from '@/components/TaskCard'
import TaskCardSkeleton from '@/components/TaskCardSkeleton'
import QuickFilter, { UrgencyFilter, PriceFilter, TimeFilter } from '@/components/QuickFilter'
import SortSelector, { SortOption } from '@/components/SortSelector'

export default function FeedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('Астана')
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  // Filter states
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [showFilters, setShowFilters] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [withPhotoOnly, setWithPhotoOnly] = useState(false)
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<string[]>([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  
  // Sort state
  const [sortOption, setSortOption] = useState<SortOption>('time_desc')

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

  useEffect(() => {
    const saved = localStorage.getItem('favorite_task_ids')
    if (saved) {
      try {
        setFavoriteTaskIds(JSON.parse(saved))
      } catch {
        setFavoriteTaskIds([])
      }
    }
  }, [])

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

  const handleTaskClaimed = () => {
    loadTasks()
  }

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks]

    // Apply urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(task => task.urgency === urgencyFilter)
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(task => {
        switch (priceFilter) {
          case 'under_1000':
            return task.reward < 1000
          case '1000_5000':
            return task.reward >= 1000 && task.reward <= 5000
          case 'over_5000':
            return task.reward > 5000
          default:
            return true
        }
      })
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date().getTime()
      filtered = filtered.filter(task => {
        if (!task.expiresAt) return false
        const expiresAt = new Date(task.expiresAt).getTime()
        const diffMinutes = (expiresAt - now) / (1000 * 60)
        
        if (timeFilter === 'urgent') {
          return diffMinutes < 60 // Less than 1 hour
        } else if (timeFilter === 'expiring_soon') {
          return diffMinutes < 1440 // Less than 24 hours
        }
        return true
      })
    }

    // Free text search (title/description/address)
    if (searchQuery.trim()) {
      const normalized = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((task) => {
        return (
          task.shortDescription.toLowerCase().includes(normalized) ||
          task.fullDescription.toLowerCase().includes(normalized) ||
          task.address.toLowerCase().includes(normalized)
        )
      })
    }

    if (withPhotoOnly) {
      filtered = filtered.filter((task) => (task.photoUrls?.length ?? 0) > 0)
    }

    if (favoritesOnly) {
      filtered = filtered.filter((task) => favoriteTaskIds.includes(task.id))
    }

    if (priceMin.trim()) {
      const min = Number(priceMin)
      if (!Number.isNaN(min)) {
        filtered = filtered.filter((task) => task.reward >= min)
      }
    }

    if (priceMax.trim()) {
      const max = Number(priceMax)
      if (!Number.isNaN(max)) {
        filtered = filtered.filter((task) => task.reward <= max)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price_desc':
          return b.reward - a.reward
        case 'price_asc':
          return a.reward - b.reward
        case 'time_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'time_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'urgency_desc':
          const urgencyOrder = { high: 3, medium: 2, low: 1 }
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
        default:
          return 0
      }
    })

    return filtered
  }, [
    tasks,
    urgencyFilter,
    priceFilter,
    timeFilter,
    sortOption,
    searchQuery,
    withPhotoOnly,
    favoritesOnly,
    favoriteTaskIds,
    priceMin,
    priceMax,
  ])

  const resetFilters = () => {
    setUrgencyFilter('all')
    setPriceFilter('all')
    setTimeFilter('all')
    setSortOption('time_desc')
    setSearchQuery('')
    setWithPhotoOnly(false)
    setFavoritesOnly(false)
    setPriceMin('')
    setPriceMax('')
  }

  const applyPricePreset = (min: number | null, max: number | null) => {
    setPriceMin(min === null ? '' : String(min))
    setPriceMax(max === null ? '' : String(max))
  }

  const toggleFavoriteTask = (taskId: string) => {
    setFavoriteTaskIds((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
      localStorage.setItem('favorite_task_ids', JSON.stringify(next))
      return next
    })
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
    <div className="min-h-screen transition-colors duration-200 pb-20 md:pb-8">
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* City Filter - Search Bar Style */}
        <div className="mb-6">
          <div className="card rounded-xl p-3 flex items-center gap-3">
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

        {/* Filters Toggle and Sort Controls */}
        {!loading && tasks.length > 0 && (
          <div className="mb-4 space-y-3">
            <div className="card rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.6-4.4a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, описанию, адресу"
                className="w-full bg-transparent text-sm outline-none text-gray-900 dark:text-gray-50 placeholder:text-gray-400"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 btn-outline text-sm"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span>Фильтры</span>
              </button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={withPhotoOnly}
                    onChange={(e) => setWithPhotoOnly(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Только с фото
                </label>
                <label className="flex items-center gap-2 text-xs md:text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Избранное
                </label>
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs md:text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  Сбросить
                </button>
                <SortSelector value={sortOption} onChange={setSortOption} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        {!loading && tasks.length > 0 && showFilters && (
          <div className="mb-4 card rounded-xl p-3">
            <QuickFilter
              urgencyFilter={urgencyFilter}
              priceFilter={priceFilter}
              timeFilter={timeFilter}
              onUrgencyChange={setUrgencyFilter}
              onPriceChange={setPriceFilter}
              onTimeChange={setTimeFilter}
            />

            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Мин. цена"
                className="input"
              />
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Макс. цена"
                className="input"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button onClick={() => applyPricePreset(null, 1000)} className="rounded-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700">
                До 1 000 ₸
              </button>
              <button onClick={() => applyPricePreset(1000, 5000)} className="rounded-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700">
                1 000-5 000 ₸
              </button>
              <button onClick={() => applyPricePreset(5000, null)} className="rounded-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700">
                От 5 000 ₸
              </button>
            </div>
          </div>
        )}

        {!loading && tasks.length === 0 && user && (
          <ContextualHint
            hintKey="zero_tasks"
            message={t('hints.zeroTasks')}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 text-center py-16 px-4">
            {/* Larger, more prominent icon */}
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            {/* Clear, prominent text */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-3">
              {tasks.length === 0 ? t('emptyStates.feed.title') : 'Задачи не найдены'}
            </h2>
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {tasks.length === 0 
                ? t('emptyStates.feed.description')
                : 'Попробуйте изменить фильтры или выбрать другой город'}
            </p>
            
            <Link href="/tasks/create" className="btn-primary inline-block px-8 py-3 text-base font-semibold">
              {t('emptyStates.feed.action')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onTaskClaimed={handleTaskClaimed}
                isFavorite={favoriteTaskIds.includes(task.id)}
                onToggleFavorite={toggleFavoriteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
