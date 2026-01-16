'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, Task } from '@/lib/api'
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

  if (loading) {
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

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center">
            <p className="text-gray-600">Задача не найдена</p>
          </div>
        </div>
      </div>
    )
  }

  const isCreator = task.createdById === user?.id
  const isClaimer = task.claimedById === user?.id
  const canSeePhone = task.status === 'claimed' && (isCreator || isClaimer)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{task.shortDescription}</h1>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{task.fullDescription}</p>
          </div>

          {task.city && task.address && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Местоположение</h2>
              <p className="text-gray-700">
                📍 {task.city}, {task.address}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Вознаграждение</p>
              <p className="text-3xl font-bold text-primary">{task.reward.toLocaleString()} ₸</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Создана</p>
              <p className="text-gray-700">{new Date(task.createdAt).toLocaleString('ru-RU')}</p>
              {task.expiresAt && task.status === 'created' && (
                <p className="text-xs text-gray-400 mt-1">
                  Истекает: {new Date(task.expiresAt).toLocaleString('ru-RU')}
                </p>
              )}
            </div>
          </div>

          {canSeePhone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Контакты</h3>
              {isCreator && task.claimedBy && (
                <div>
                  <p className="text-sm text-gray-600">Исполнитель:</p>
                  <p className="text-lg font-medium text-gray-900">
                    {task.claimedBy.phoneNumber || task.claimedBy.email}
                  </p>
                </div>
              )}
              {isClaimer && task.createdBy && (
                <div>
                  <p className="text-sm text-gray-600">Заказчик:</p>
                  <p className="text-lg font-medium text-gray-900">
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
                  <h3 className="font-semibold text-gray-900 mb-3">Подтверждение выполнения</h3>
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
        </div>
      </div>
    </div>
  )
}
