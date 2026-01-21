'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { adminApi, Task, User, AnalyticsData } from '@/lib/api'
import Navbar from '@/components/Navbar'

enum TaskStatus {
  CREATED = 'created',
  CLAIMED = 'claimed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'analytics' | 'users' | 'tasks'>('stats')

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
      const [usersData, tasksData, statsData, analyticsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getTasks(),
        adminApi.getStats(),
        adminApi.getAnalytics(),
      ])
      setUsers(usersData)
      setTasks(tasksData)
      setStats(statsData)
      setAnalytics(analyticsData)
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

  const handleRestrictUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите ограничить этого пользователя? Он не сможет брать задачи.')) return
    try {
      await adminApi.restrictUser(userId)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка ограничения пользователя')
    }
  }

  const handleUnrestrictUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите снять ограничение с этого пользователя?')) return
    try {
      await adminApi.unrestrictUser(userId)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка снятия ограничения')
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-8">Панель администратора</h1>

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
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Аналитика
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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Пользователей</p>
              <p className="text-3xl font-bold text-primary">{stats.users}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Всего задач</p>
              <p className="text-3xl font-bold text-primary">{stats.tasks}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Создано</p>
              <p className="text-3xl font-bold text-warning">{stats.created}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Выполнено</p>
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Коэффициент взятия</p>
                <p className="text-3xl font-bold text-primary">
                  {analytics.overallMetrics.claimRatio.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">% взятых от созданных</p>
              </div>
              <div className="card text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Среднее время до взятия</p>
                <p className="text-3xl font-bold text-primary">
                  {analytics.overallMetrics.averageTimeToClaim.toFixed(0)} мин
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Среднее время в минутах</p>
              </div>
              <div className="card text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Коэффициент отмен</p>
                <p className="text-3xl font-bold text-warning">
                  {analytics.overallMetrics.cancellationRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">% отмененных от созданных</p>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">Метрики по дням (последние 30 дней)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создано</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Взято</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {analytics.dailyMetrics.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Нет данных за последние 30 дней
                        </td>
                      </tr>
                    ) : (
                      analytics.dailyMetrics.map((day) => (
                        <tr key={day.date}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {new Date(day.date).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50 text-right">
                            {day.created}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50 text-right">
                            {day.claimed}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Телефон</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Отмены</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Отказы</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Флаги</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr 
                      key={user.id}
                      className={user.suspiciousFlags && user.suspiciousFlags.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{user.cancelCount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">{user.refuseCount || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isRestricted ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                            Ограничен
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                            Активен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.suspiciousFlags?.map((flag) => (
                            <span
                              key={flag}
                              className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded"
                            >
                              {flag === 'high_cancel_rate' && 'Высокий % отмен'}
                              {flag === 'high_refuse_rate' && 'Высокий % отказов'}
                              {flag === 'restricted' && 'Ограничен'}
                              {flag === 'low_claim_ratio' && 'Низкий % взятий'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.isRestricted ? (
                          <button
                            onClick={() => handleUnrestrictUser(user.id)}
                            className="btn-outline text-sm"
                          >
                            Снять ограничение
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestrictUser(user.id)}
                            className="btn-danger text-sm"
                          >
                            Ограничить
                          </button>
                        )}
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
            {tasks.map((task) => {
              const taskAny = task as any;
              return (
                <div key={task.id} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{task.shortDescription}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {task.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
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
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{task.fullDescription}</p>
                  {task.city && task.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      📍 {task.city}, {task.address}
                    </p>
                  )}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Жизненный цикл задачи:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p>Создана: {new Date(task.createdAt).toLocaleString('ru-RU')}</p>
                      {taskAny.claimedAt && (
                        <p>Взята: {new Date(taskAny.claimedAt).toLocaleString('ru-RU')}</p>
                      )}
                      {taskAny.completedAt && (
                        <p>Завершена: {new Date(taskAny.completedAt).toLocaleString('ru-RU')}</p>
                      )}
                      {taskAny.cancelledAt && (
                        <p>Отменена: {new Date(taskAny.cancelledAt).toLocaleString('ru-RU')}</p>
                      )}
                      {task.expiresAt && task.status === TaskStatus.CREATED && (
                        <p>Истекает: {new Date(task.expiresAt).toLocaleString('ru-RU')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary">{task.reward.toLocaleString()} ₸</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}
