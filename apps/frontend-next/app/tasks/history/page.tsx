'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

export default function HistoryPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<{ created: Task[]; claimed: Task[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Мои задачи</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Созданные мной</h2>
            {history?.created.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600">Вы еще не создали ни одной задачи</p>
                <Link href="/tasks/create" className="btn-primary mt-4 inline-block">
                  Создать задачу
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

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Взятые мной</h2>
            {history?.claimed.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-600">Вы еще не взяли ни одной задачи</p>
                <Link href="/feed" className="btn-primary mt-4 inline-block">
                  Посмотреть ленту
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
        </div>
      </div>
    </div>
  )
}
