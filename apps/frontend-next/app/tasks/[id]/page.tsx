'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, reviewsApi, Task } from '@/lib/api'
import StarRating from '@/components/StarRating'
import { useToast } from '@/contexts/ToastContext'
import { useI18n } from '@/contexts/I18nContext'
import TaskStatusTimeline from '@/components/TaskStatusTimeline'
import TaskCountdown from '@/components/TaskCountdown'
import { useNotificationService } from '@/hooks/useNotificationService'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import { usersApi } from '@/lib/api'

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
  const { showToast } = useToast()
  const { t } = useI18n()
  const { checkTaskEvents, checkUserRestrictions, shouldShowNotification } = useNotificationService()
  const { addNotification } = useNotificationHistory()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

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
      showToast(t('toast.taskClaimed'), 'success')
      await loadTask()
      // Check for notifications after successful claim
      checkTaskEvents()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка при взятии задачи'
      setError(errorMessage)
      if (errorMessage.includes('blocked') || errorMessage.includes('block') || errorMessage.includes('restricted')) {
        setIsBlocked(true)
        showToast(t('notifications.claimBlocked.message'), 'error', 10000, undefined, true)
        // Check user restrictions when claim is blocked
        checkUserRestrictions()
      } else {
        showToast(errorMessage, 'error')
      }
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
      showToast(t('toast.taskCancelled'), 'success')
      await loadTask()
      // Check for notifications after cancel
      checkTaskEvents()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка при отмене'
      setError(errorMessage)
      if (errorMessage.includes('limit') || errorMessage.includes('block')) {
        showToast(errorMessage, 'warning')
      } else {
        showToast(errorMessage, 'error')
      }
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
      showToast(t('toast.taskRefused'), 'success')
      await loadTask()
      // Check for notifications after refuse
      checkTaskEvents()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка при отказе'
      setError(errorMessage)
      if (errorMessage.includes('limit') || errorMessage.includes('block')) {
        showToast(errorMessage, 'warning')
      } else {
        showToast(errorMessage, 'error')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmWork = async () => {
    if (!task) return
    try {
      setActionLoading(true)
      await tasksApi.confirmWork(task.id)
      showToast(t('toast.workConfirmed'), 'success')
      await loadTask()
      
      // Create immediate notification for executor
      if (task.claimedById) {
        try {
          const settings = await usersApi.getNotificationSettings()
          if (shouldShowNotification('work_confirmed', settings)) {
            const message = t('notifications.workConfirmed.message', {
              taskTitle: task.shortDescription || t('task.create'),
            })
            addNotification({
              id: `work_confirmed_${task.id}_${Date.now()}`,
              type: 'work_confirmed',
              title: t('notificationHistory.titles.workConfirmed'),
              message,
              timestamp: Date.now(),
              taskId: task.id,
              actionUrl: `/tasks/${task.id}`,
            })
          }
        } catch (err) {
          console.error('Failed to create work confirmed notification:', err)
        }
      }
      
      // Check for notifications after work confirmation
      checkTaskEvents()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка подтверждения'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!task) return
    try {
      setActionLoading(true)
      await tasksApi.confirmPayment(task.id)
      showToast(t('toast.paymentConfirmed'), 'success')
      await loadTask()
      
      // Create immediate notification for creator
      if (task.createdById) {
        try {
          const settings = await usersApi.getNotificationSettings()
          if (shouldShowNotification('payment_confirmed', settings)) {
            const message = t('notifications.paymentConfirmed.message', {
              taskTitle: task.shortDescription || t('task.create'),
            })
            addNotification({
              id: `payment_confirmed_${task.id}_${Date.now()}`,
              type: 'payment_confirmed',
              title: t('notificationHistory.titles.paymentConfirmed'),
              message,
              timestamp: Date.now(),
              taskId: task.id,
              actionUrl: `/tasks/${task.id}`,
            })
          }
        } catch (err) {
          console.error('Failed to create payment confirmed notification:', err)
        }
      }
      
      // Check for notifications after payment confirmation
      checkTaskEvents()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка подтверждения'
      setError(errorMessage)
      showToast(errorMessage, 'error')
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
        <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="card text-center p-4 md:p-6">
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
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

          <TaskStatusTimeline 
            task={task} 
            userRole={isCreator ? 'creator' : isClaimer ? 'executor' : null}
          />

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Описание</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{task.fullDescription}</p>
          </div>

          {task.photoUrls && task.photoUrls.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">Фотографии</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {task.photoUrls.map((photoUrl, index) => (
                  <a
                    key={`${photoUrl.slice(0, 12)}-${index}`}
                    href={photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <img
                      src={photoUrl}
                      alt={`Фото задачи ${index + 1}`}
                      className="h-32 md:h-40 w-full rounded-lg border border-gray-200 dark:border-slate-700 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

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
            </div>
          </div>

          {task.expiresAt && task.status === 'created' && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg">
              <TaskCountdown expiresAt={task.expiresAt} status={task.status} />
            </div>
          )}

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
            <div>
              {isBlocked && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-lg mb-4">
                  <p className="text-sm font-medium">{t('microcopy.blockedBanner')}</p>
                </div>
              )}
              <button
                onClick={handleClaim}
                disabled={actionLoading || isBlocked}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Обработка...' : 'Взять задачу'}
              </button>
            </div>
          )}

          {task.status === 'expired' && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-4">
              <p className="text-orange-800 dark:text-orange-300 font-medium">⚠️ {t('task.expiredMessage')}</p>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                {t('task.expiredDescription')}
              </p>
            </div>
          )}

          {task.status === 'claimed' && (
            <div className="space-y-3">
              {isCreator && (
                <div>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="btn-danger w-full"
                  >
                    {actionLoading ? 'Обработка...' : 'Отменить задачу'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {t('microcopy.cancelWarning')}
                  </p>
                </div>
              )}
              {isClaimer && (
                <div>
                  <button
                    onClick={handleRefuse}
                    disabled={actionLoading}
                    className="btn-danger w-full"
                  >
                    {actionLoading ? 'Обработка...' : 'Отказаться от задачи'}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {t('microcopy.refuseWarning')}
                  </p>
                </div>
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
                <StarRating 
                  value={reviewRating} 
                  onChange={(newValue) => {
                    setReviewRating(newValue)
                  }} 
                />
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
