'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { adminApi, Task, User } from '@/lib/api'
import Navbar from '@/components/Navbar'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'tasks'>('stats')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (!authLoading && user && !isAdmin) {
      router.push('/feed')
      return
    }
    if (isAdmin) {
      loadData()
    }
  }, [authLoading, user, isAdmin])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersData, tasksData, statsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getTasks(),
        adminApi.getStats(),
      ])
      setUsers(usersData)
      setTasks(tasksData)
      setStats(statsData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return
    try {
      await adminApi.deleteTask(taskId)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка удаления')
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Панель администратора</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Статистика
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Пользователи ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Задачи ({tasks.length})
            </button>
          </nav>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Пользователей</p>
              <p className="text-3xl font-bold text-primary">{stats.users}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Всего задач</p>
              <p className="text-3xl font-bold text-primary">{stats.tasks}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Создано</p>
              <p className="text-3xl font-bold text-warning">{stats.created}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Выполнено</p>
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('ru-RU') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{task.shortDescription}</h3>
                    <p className="text-sm text-gray-500 mt-1">ID: {task.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {task.status}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn-danger text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{task.fullDescription}</p>
                {task.city && task.address && (
                  <p className="text-sm text-gray-500 mb-2">
                    📍 {task.city}, {task.address}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">{task.reward.toLocaleString()} ₸</span>
                  <span className="text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
