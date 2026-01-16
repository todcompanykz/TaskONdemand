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

export default function FeedPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Задачи поблизости (1 км)</h1>
          <button
            onClick={loadTasks}
            className="btn-outline text-sm"
            disabled={loading}
          >
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка задач...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">Нет доступных задач в радиусе 1 км</p>
            <Link href="/tasks/create" className="btn-primary mt-6 inline-block">
              Создать задачу
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
                  <h2 className="text-xl font-semibold text-gray-900">{task.shortDescription}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgencyColors[task.urgency]}`}>
                    {urgencyLabels[task.urgency]}
                  </span>
                </div>
                <p className="text-gray-600 mb-2 line-clamp-2">{task.fullDescription}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    📍 {task.city}, {task.address}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">
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
      </div>
    </div>
  )
}
