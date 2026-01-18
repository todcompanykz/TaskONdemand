'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usersApi, UserProfile } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user: currentUser } = useAuth()
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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              {profile.phoneNumber && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  📱 {profile.phoneNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Рейтинг</h3>
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
                <p className="text-gray-500 dark:text-gray-400 text-sm">Нет оценок</p>
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

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Отзывы ({profile.reviews.length})
          </h2>

          {profile.reviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Пока нет отзывов</p>
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
