'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, reviewsApi, Task } from '@/lib/api'
import Navbar from '@/components/Navbar'

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

export default function TaskDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadTask()
  }, [params.id])

  const loadTask = async () => {
    try {
      setLoading(true)
      const data = await tasksApi.getOne(params.id as string)
      setTask(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки задачи')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!task) return
    try {
      setActionLoading(true)
      await tasksApi.claim(task.id)
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при взятии задачи')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!task) return
    if (!confirm('Вы уверены, что хотите отменить задачу?')) return
    try {
      setActionLoading(true)
      await tasksApi.cancel(task.id)
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отмене')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefuse = async () => {
    if (!task) return
    if (!confirm('Вы уверены, что хотите отказаться от задачи?')) return
    try {
      setActionLoading(true)
      await tasksApi.refuse(task.id)
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отказе')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmWork = async () => {
    if (!task) return
    try {
      setActionLoading(true)
      await tasksApi.confirmWork(task.id)
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка подтверждения')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!task) return
    try {
      setActionLoading(true)
      await tasksApi.confirmPayment(task.id)
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка подтверждения')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!task || reviewRating === 0) {
      setError('Пожалуйста, выберите оценку')
      return
    }
    try {
      setReviewSubmitting(true)
      setError('')
      await reviewsApi.createReview(task.id, reviewRating, reviewComment || undefined)
      setReviewSubmitted(true)
      setReviewRating(0)
      setReviewComment('')
      await loadTask()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки отзыва')
    } finally {
      setReviewSubmitting(false)
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center">
            <p className="text-gray-600 dark:text-gray-400">Задача не найдена</p>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = task.createdById === user?.id
  const isClaimer = task.claimedById === user?.id
  const canSeePhone = task.status === 'claimed' && (isCreator || isClaimer)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">{task.shortDescription}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[task.urgency]}`}>
                {urgencyLabels[task.urgency]}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {statusLabels[task.status]}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Описание</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.fullDescription}</p>
          </div>

          {task.city && task.address && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Местоположение</h2>
              <p className="text-gray-700 dark:text-gray-300">
                📍 {task.city}, {task.address}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Вознаграждение</p>
              <p className="text-3xl font-bold text-primary">{task.reward.toLocaleString()} ₸</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Создана</p>
              <p className="text-gray-700 dark:text-gray-300">{new Date(task.createdAt).toLocaleString('ru-RU')}</p>
              {task.expiresAt && task.status === 'created' && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Истекает: {new Date(task.expiresAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>

          {canSeePhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Контакты</h3>
              {isCreator && task.claimedBy && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Исполнитель:</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    {task.claimedBy.phoneNumber || task.claimedBy.email}
                  </p>
                </div>
              )}
              {isClaimer && task.createdBy && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Заказчик:</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    {task.createdBy.phoneNumber || task.createdBy.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {task.status === 'created' && !isCreator && (
            <button
              onClick={handleClaim}
              disabled={actionLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Обработка...' : 'Взять задачу'}
            </button>
          )}

          {task.status === 'expired' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 font-medium">⚠️ Задача истекла</p>
              <p className="text-sm text-orange-700 mt-1">
                Эта задача была создана более 24 часов назад и автоматически истекла.
              </p>
            </div>
          )}

          {task.status === 'claimed' && (
            <div className="space-y-3">
              {isCreator && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="btn-danger w-full"
                >
                  {actionLoading ? 'Обработка...' : 'Отменить задачу'}
                </button>
              )}
              {isClaimer && (
                <button
                  onClick={handleRefuse}
                  disabled={actionLoading}
                  className="btn-danger w-full"
                >
                  {actionLoading ? 'Обработка...' : 'Отказаться от задачи'}
                </button>
              )}

              {task.status === 'claimed' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-3">Подтверждение выполнения</h3>
                  {isCreator && (
                    <div className="mb-3">
                      <button
                        onClick={handleConfirmWork}
                        disabled={actionLoading || task.customerConfirmed}
                        className={`w-full ${task.customerConfirmed ? 'bg-success text-white' : 'btn-outline'}`}
                      >
                        {task.customerConfirmed ? '✓ Работа подтверждена' : 'Подтвердить выполнение работы'}
                      </button>
                    </div>
                  )}
                  {isClaimer && (
                    <div>
                      <button
                        onClick={handleConfirmPayment}
                        disabled={actionLoading || task.executorConfirmed}
                        className={`w-full ${task.executorConfirmed ? 'bg-success text-white' : 'btn-outline'}`}
                      >
                        {task.executorConfirmed ? '✓ Оплата подтверждена' : 'Подтвердить получение оплаты'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {task.status === 'completed' && (isCreator || isClaimer) && !reviewSubmitted && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Оставить отзыв
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Оцените {isCreator ? 'исполнителя' : 'заказчика'}:{' '}
                {isCreator && task.claimedBy && (
                  <Link href={`/users/${task.claimedBy.id}`} className="text-primary hover:underline">
                    {task.claimedBy.firstName} {task.claimedBy.lastName}
                  </Link>
                )}
                {isClaimer && task.createdBy && (
                  <Link href={`/users/${task.createdBy.id}`} className="text-primary hover:underline">
                    {task.createdBy.firstName} {task.createdBy.lastName}
                  </Link>
                )}
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Оценка *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className={`p-2 rounded-lg transition-colors ${
                        reviewRating >= rating
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Комментарий (необязательно, до 300 символов)
                </label>
                <textarea
                  id="reviewComment"
                  rows={4}
                  maxLength={300}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Оставьте комментарий..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {reviewComment.length}/300
                </p>
              </div>

              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting || reviewRating === 0}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewSubmitting ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </div>
          )}

          {task.status === 'completed' && reviewSubmitted && (
            <div className="border-t pt-6 mt-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4">
                <p className="text-green-800 dark:text-green-300 font-medium">✓ Отзыв отправлен</p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Спасибо за ваш отзыв!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
