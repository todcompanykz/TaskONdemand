'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { adminApi, Task, User, AnalyticsData, supportApi, SupportRequest } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { useI18n } from '@/contexts/I18nContext'

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
  const { t } = useI18n()
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'analytics' | 'users' | 'tasks' | 'support'>('stats')
  const [sortField, setSortField] = useState<'email' | 'cancelCount' | 'refuseCount' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterRestricted, setFilterRestricted] = useState(false)
  const [filterSuspicious, setFilterSuspicious] = useState(false)

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:loadData:entry',message:'loadData called',data:{userId:user?.id,isAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const [usersData, tasksData, statsData, analyticsData, supportData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getTasks(),
        adminApi.getStats(),
        adminApi.getAnalytics(),
        supportApi.getAllRequests(),
      ])
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:loadData:after-api',message:'API calls completed',data:{supportDataLength:supportData?.length||0,supportData:supportData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setUsers(usersData)
      setTasks(tasksData)
      setStats(statsData)
      setAnalytics(analyticsData)
      setSupportRequests(supportData)
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:loadData:error',message:'loadData error',data:{error:err?.message,response:err?.response?.data,status:err?.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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

  const handleReplyToSupport = async () => {
    if (!selectedRequest || !replyMessage.trim() || replyMessage.trim().length < 10) {
      setError('Сообщение должно содержать минимум 10 символов')
      return
    }

    try {
      setReplying(true)
      await adminApi.replyToSupportRequest(selectedRequest.id, replyMessage.trim())
      setReplyMessage('')
      setSelectedRequest(null)
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при отправке ответа')
    } finally {
      setReplying(false)
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
            <button
              onClick={() => setActiveTab('support')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Поддержка
              {supportRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                  {supportRequests.length}
                </span>
              )}
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
            {/* Filters */}
            <div className="mb-4 flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setFilterRestricted(false)
                  setFilterSuspicious(false)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !filterRestricted && !filterSuspicious
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {t('admin.filters.all')}
              </button>
              <button
                onClick={() => setFilterRestricted(!filterRestricted)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterRestricted
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                🔒 {t('admin.filters.restricted')}
              </button>
              <button
                onClick={() => setFilterSuspicious(!filterSuspicious)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterSuspicious
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                ⚠️ {t('admin.filters.suspicious')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        if (sortField === 'email') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortField('email')
                          setSortDirection('asc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortField === 'email' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Телефон</th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        if (sortField === 'cancelCount') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortField('cancelCount')
                          setSortDirection('asc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Отмены
                        {sortField === 'cancelCount' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => {
                        if (sortField === 'refuseCount') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortField('refuseCount')
                          setSortDirection('asc')
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Отказы
                        {sortField === 'refuseCount' && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Флаги</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {(() => {
                    let filteredUsers = [...users]

                    // Apply filters
                    if (filterRestricted) {
                      filteredUsers = filteredUsers.filter((u) => u.isRestricted)
                    }
                    if (filterSuspicious) {
                      filteredUsers = filteredUsers.filter(
                        (u) => u.suspiciousFlags && u.suspiciousFlags.length > 0
                      )
                    }

                    // Apply sorting
                    if (sortField) {
                      filteredUsers.sort((a, b) => {
                        let aVal: any = a[sortField as keyof User]
                        let bVal: any = b[sortField as keyof User]
                        if (sortField === 'email') {
                          aVal = aVal || ''
                          bVal = bVal || ''
                        } else {
                          aVal = aVal || 0
                          bVal = bVal || 0
                        }
                        if (sortDirection === 'asc') {
                          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
                        } else {
                          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
                        }
                      })
                    }

                    return filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={`${
                          user.isRestricted
                            ? 'bg-red-50 dark:bg-red-900/20'
                            : user.suspiciousFlags && user.suspiciousFlags.length > 0
                            ? 'bg-yellow-50 dark:bg-yellow-900/20'
                            : ''
                        } hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors`}
                        onClick={() => (window.location.href = `/users/${user.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                          <div className="flex items-center gap-2">
                            {user.isRestricted && <span className="text-red-600 dark:text-red-400">🔒</span>}
                            {user.suspiciousFlags && user.suspiciousFlags.length > 0 && !user.isRestricted && (
                              <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                            )}
                            {user.email}
                          </div>
                        </td>
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
                                className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded flex items-center gap-1"
                              >
                                {flag === 'high_cancel_rate' && <span>⚠️</span>}
                                {flag === 'high_refuse_rate' && <span>❌</span>}
                                {flag === 'restricted' && <span>🔒</span>}
                                {flag === 'low_claim_ratio' && <span>📉</span>}
                                {flag === 'high_cancel_rate' && 'Высокий % отмен'}
                                {flag === 'high_refuse_rate' && 'Высокий % отказов'}
                                {flag === 'restricted' && 'Ограничен'}
                                {flag === 'low_claim_ratio' && 'Низкий % взятий'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => (window.location.href = `/users/${user.id}`)}
                              className="btn-outline text-sm"
                            >
                              {t('admin.actions.viewProfile')}
                            </button>
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
                          </div>
                        </td>
                      </tr>
                    ))
                  })()}
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
                      <Link
                        href={`/tasks/${task.id}`}
                        className="btn-outline text-sm"
                      >
                        {t('admin.actions.viewTask')}
                      </Link>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="btn-danger text-sm"
                      >
                        {t('admin.deleteTask')}
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

        {activeTab === 'support' && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Сообщения поддержки ({supportRequests.length})
              </h2>
              {supportRequests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">Нет сообщений поддержки</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Пользователь
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Тема
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Создано
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Статус
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                      {supportRequests.map((request) => (
                        <tr
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                {request.user?.email || 'Неизвестный пользователь'}
                              </p>
                              {(request.user?.firstName || request.user?.lastName) && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {[request.user?.firstName, request.user?.lastName].filter(Boolean).join(' ')}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {request.topic === 'task_issue' && 'Проблема с задачей'}
                              {request.topic === 'account_access' && 'Аккаунт / Доступ'}
                              {request.topic === 'restriction_block' && 'Ограничение / Блокировка'}
                              {request.topic === 'other' && 'Другое'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.createdAt).toLocaleString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                request.status === 'answered'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              }`}
                            >
                              {request.status === 'answered' ? 'Отвечено' : 'Открыто'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedRequest && (
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Обращение от {selectedRequest.user?.email || 'Неизвестного пользователя'}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedRequest(null)
                      setReplyMessage('')
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Тема: {selectedRequest.topic === 'task_issue' && 'Проблема с задачей'}
                    {selectedRequest.topic === 'account_access' && 'Аккаунт / Доступ'}
                    {selectedRequest.topic === 'restriction_block' && 'Ограничение / Блокировка'}
                    {selectedRequest.topic === 'other' && 'Другое'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Создано: {new Date(selectedRequest.createdAt).toLocaleString('ru-RU')}
                  </p>
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedRequest.message}
                    </p>
                  </div>
                </div>

                {selectedRequest.status === 'answered' && selectedRequest.responseMessage ? (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ответ поддержки:
                    </p>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedRequest.responseMessage}
                      </p>
                      {selectedRequest.answeredAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Отвечено: {new Date(selectedRequest.answeredAt).toLocaleString('ru-RU')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="reply-message" className="label">
                      Ответ от имени поддержки
                    </label>
                    <textarea
                      id="reply-message"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Введите ответ пользователю..."
                      rows={5}
                      className="input resize-none mb-4"
                      disabled={replying}
                    />
                    {replyMessage.trim().length > 0 && replyMessage.trim().length < 10 && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                        Сообщение должно содержать минимум 10 символов
                      </p>
                    )}
                    <button
                      onClick={handleReplyToSupport}
                      disabled={replying || replyMessage.trim().length < 10}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replying ? 'Отправка...' : 'Ответить от имени поддержки'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
