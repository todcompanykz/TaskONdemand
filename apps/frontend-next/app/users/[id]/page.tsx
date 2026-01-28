'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi, UserProfile } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser } = useAuth()
  const { t } = useI18n()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    loadProfile()
  }, [params.id])

  const loadProfile = async () => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users/[id]/page.tsx:25',message:'loadProfile entry',data:{userId:params.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    } catch(e) {}
    // #endregion

    try {
      setLoading(true)
      const data = await usersApi.getProfile(params.id as string)
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users/[id]/page.tsx:30',message:'loadProfile success',data:{profileFirstName:data.firstName,profileLastName:data.lastName,hasReviews:!!data.reviews,reviewsCount:data.reviews?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      setProfile(data)
    } catch (err: any) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'users/[id]/page.tsx:32',message:'loadProfile error',data:{errorMessage:err.response?.data?.message || 'Ошибка загрузки профиля',status:err.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      setError(err.response?.data?.message || 'Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
        <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="card text-center">
            <p className="text-gray-600 dark:text-gray-400">{error || 'Профиль не найден'}</p>
          </div>
        </div>
      </div>
    )
  }

  const isOwner = currentUser?.id === profile.id
  const hasRating = profile.ratingCount > 0

  // Convert ratingAvg to number (PostgreSQL DECIMAL can be string)
  const ratingAvgNum = typeof profile.ratingAvg === 'string' 
    ? parseFloat(profile.ratingAvg) 
    : Number(profile.ratingAvg) || 0

  // Determine headline based on rating
  const getHeadline = () => {
    if (ratingAvgNum >= 4.0 && profile.ratingCount >= 3) {
      return t('user.trustHeadlineReliable')
    } else if (hasRating) {
      return t('user.trustHeadlineActive')
    } else {
      return t('user.newUser')
    }
  }

  // Render star rating component
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return (
              <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )
          } else if (i === fullStars && hasHalfStar) {
            return (
              <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                <defs>
                  <linearGradient id="half-fill">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path fill="url(#half-fill)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )
          } else {
            return (
              <svg key={i} className="w-5 h-5 text-gray-300 dark:text-gray-600 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )
          }
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              {/* Trust headline */}
              {hasRating ? (
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                  {getHeadline()} · {ratingAvgNum.toFixed(1)} ⭐
                </p>
              ) : (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  {getHeadline()}
                </p>
              )}
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              {profile.phoneNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  📱 {profile.phoneNumber}
                </p>
              )}
              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.completedTasksCount >= 10 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
                    ✓ {t('user.badgeCompletedTasks').replace('{count}', String(profile.completedTasksCount))}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center gap-1">
                  ✓ {t('user.badgeMemberSince').replace('{year}', String(new Date(profile.createdAt).getFullYear()))}
                </span>
                {profile.recentCancellationsCount === 0 && profile.completedTasksCount > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 flex items-center gap-1">
                    ✓ {t('user.badgeNoRecentCancellations')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Рейтинг</h3>
                <div className="group relative">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {t('user.ratingTooltipDetailed')}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                </div>
              </div>
              {hasRating ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(ratingAvgNum)}
                  </div>
                  <span className={`text-lg font-semibold ${ratingAvgNum >= 4 ? 'text-green-600 dark:text-green-400' : ratingAvgNum >= 3 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {ratingAvgNum.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({profile.ratingCount})
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('user.noRatings')}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Выполнено задач</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                {profile.completedTasksCount}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">На платформе</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Section - Only for own profile */}
        {currentUser && currentUser.id === profile.id && (
          <div className="card mb-6 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
              {t('profile.settings')}
            </h3>
            
            <div className="space-y-4">
              {/* Language Setting */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.language')}
                  </span>
                </div>
                <LanguageSwitcher />
              </div>
              
              {/* Theme Setting */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.appearance')}
                  </span>
                </div>
                <div className="relative" style={{ width: '80px', height: '40px' }}>
                  <ThemeToggle />
                </div>
              </div>
              
              {/* Divider before links */}
              <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-2">
                <Link 
                  href="/support" 
                  className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t('settings.supportChat')}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link 
                  href="/settings" 
                  className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('settings.title')}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                <Link 
                  href="/settings/notifications" 
                  className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t('profile.notifications')}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Отзывы ({profile.reviews.length})
          </h2>

          {profile.reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
                {t('emptyStates.reviews.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('emptyStates.reviews.description')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile.reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 dark:border-slate-700 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-50">
                          {review.fromUser.firstName} {review.fromUser.lastName}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          • {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600 fill-current'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Задача: {review.task.shortDescription}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
