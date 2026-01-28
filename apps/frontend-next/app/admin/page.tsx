'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { adminApi, Task, User, AnalyticsData, supportApi, SupportRequest, SupportConversation, SupportMessage } from '@/lib/api'

const topicLabels: Record<string, string> = {
  task_issue: 'Проблема с задачей',
  account_access: 'Аккаунт / Доступ',
  restriction_block: 'Ограничение / Блокировка',
  other: 'Другое',
}
import { useI18n } from '@/contexts/I18nContext'

enum TaskStatus {
  CREATED = 'created',
  CLAIMED = 'claimed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

interface AdminToken {
  id: string
  token: string
  shortCode: string
  permissions: string[]
  expiresAt: string | null
  isActivated: boolean
  isRevoked: boolean
  createdAt: string
  activatedAt: string | null
  createdBy: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  assignedToUser: {
    id: string
    email: string
    firstName: string
    lastName: string
  } | null
}

interface AdminInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  permissions: string[]
  tokenSource?: {
    tokenId: string
    createdBy: string
    createdAt: string
  }
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAdmin, isSuperAdmin } = useAuth()
  const { t } = useI18n()
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [replying, setReplying] = useState(false)
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null)
  const [conversationMessage, setConversationMessage] = useState('')
  const [sendingConversationMessage, setSendingConversationMessage] = useState(false)
  const [conversationFilters, setConversationFilters] = useState<{ status?: string; priority?: string }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'analytics' | 'users' | 'tasks' | 'support' | 'superadmin'>('stats')
  const [adminTokens, setAdminTokens] = useState<AdminToken[]>([])
  const [admins, setAdmins] = useState<AdminInfo[]>([])
  const [newTokenPermissions, setNewTokenPermissions] = useState<string[]>([])
  const [newTokenExpiresAt, setNewTokenExpiresAt] = useState<string>('')
  const [newTokenAssignedUserId, setNewTokenAssignedUserId] = useState<string>('')
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [creatingToken, setCreatingToken] = useState(false)
  const [sortField, setSortField] = useState<'email' | 'cancelCount' | 'refuseCount' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterRestricted, setFilterRestricted] = useState(false)
  const [filterSuspicious, setFilterSuspicious] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  const loadData = async () => {
    try {
      setLoading(true)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:loadData:entry',message:'loadData called',data:{userId:user?.id,isAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const [usersData, tasksData, statsData, analyticsData] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getTasks(),
        adminApi.getStats(),
        adminApi.getAnalytics(),
      ])
      
      // Load conversations separately if on support tab
      let conversationsData: SupportConversation[] = []
      if (activeTab === 'support') {
        conversationsData = await adminApi.getSupportConversations(conversationFilters)
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/page.tsx:loadData:after-api',message:'API calls completed',data:{conversationsLength:conversationsData?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      setUsers(usersData)
      setTasks(tasksData)
      setStats(statsData)
      setAnalytics(analyticsData)
      if (activeTab === 'support') {
        setSupportConversations(conversationsData)
      }
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

  const loadSuperAdminData = async () => {
    if (!isSuperAdmin) return
    try {
      const [tokensData, adminsData] = await Promise.all([
        adminApi.getAdminTokens(),
        adminApi.getAdmins(),
      ])
      setAdminTokens(tokensData)
      setAdmins(adminsData)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных супер-админа')
    }
  }

  const handleCreateToken = async () => {
    if (newTokenPermissions.length === 0) {
      setError('Выберите хотя бы одно разрешение')
      return
    }
    try {
      setCreatingToken(true)
      await adminApi.createAdminToken(
        newTokenPermissions,
        newTokenExpiresAt || undefined,
        newTokenAssignedUserId || undefined
      )
      setNewTokenPermissions([])
      setNewTokenExpiresAt('')
      setNewTokenAssignedUserId('')
      setUserSearchQuery('')
      await loadSuperAdminData()
      await loadData() // Reload users to see updated roles
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания токена')
    } finally {
      setCreatingToken(false)
    }
  }

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Вы уверены, что хотите отозвать этот токен?')) return
    try {
      await adminApi.revokeAdminToken(tokenId)
      await loadSuperAdminData()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отзыва токена')
    }
  }

  const loadConversations = async () => {
    try {
      const data = await adminApi.getSupportConversations(conversationFilters)
      setSupportConversations(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки чатов')
    }
  }

  const selectConversation = async (id: string) => {
    try {
      const conv = await adminApi.getSupportConversation(id)
      setSelectedConversation(conv)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки чата')
    }
  }

  const handleSendConversationMessage = async () => {
    if (!selectedConversation || !conversationMessage.trim() || sendingConversationMessage) return

    try {
      setSendingConversationMessage(true)
      await adminApi.sendSupportMessage(selectedConversation.id, conversationMessage.trim())
      setConversationMessage('')
      await selectConversation(selectedConversation.id)
      await loadConversations()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка отправки сообщения')
    } finally {
      setSendingConversationMessage(false)
    }
  }

  const handleCloseConversation = async (id: string) => {
    if (!confirm('Вы уверены, что хотите закрыть этот чат?')) return
    try {
      await adminApi.closeSupportConversation(id)
      await loadConversations()
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка закрытия чата')
    }
  }

  useEffect(() => {
    if (activeTab === 'support' && isAdmin) {
      loadConversations()
    }
  }, [activeTab, conversationFilters, isAdmin])

  const allPermissions = [
    'tasks.read',
    'tasks.update',
    'tasks.delete',
    'users.read',
    'users.block',
    'users.unblock',
    'payments.read',
    'support.read',
    'support.reply',
    'analytics.read',
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
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
              {supportConversations.filter((c) => c.status === 'open').length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                  {supportConversations.filter((c) => c.status === 'open').length}
                </span>
              )}
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setActiveTab('superadmin')
                  loadSuperAdminData()
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'superadmin'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ⭐ Супер админ
              </button>
            )}
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
                        } hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors`}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/users/${user.id}`)}
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
            {/* Filters */}
            <div className="card">
              <div className="flex gap-4 items-center">
                <div>
                  <label className="label mb-2">Статус</label>
                  <select
                    value={conversationFilters.status || ''}
                    onChange={(e) =>
                      setConversationFilters({
                        ...conversationFilters,
                        status: e.target.value || undefined,
                      })
                    }
                    className="input"
                  >
                    <option value="">Все</option>
                    <option value="open">Открытые</option>
                    <option value="closed">Закрытые</option>
                  </select>
                </div>
                <div>
                  <label className="label mb-2">Приоритет</label>
                  <select
                    value={conversationFilters.priority || ''}
                    onChange={(e) =>
                      setConversationFilters({
                        ...conversationFilters,
                        priority: e.target.value || undefined,
                      })
                    }
                    className="input"
                  >
                    <option value="">Все</option>
                    <option value="low">Низкий</option>
                    <option value="normal">Обычный</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversations List */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden flex flex-col max-h-[600px]">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-50">
                    Чаты ({supportConversations.length})
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {supportConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Нет чатов
                    </div>
                  ) : (
                    supportConversations.map((conv) => {
                      const unreadCount =
                        conv.messages?.filter(
                          (m) => m.senderRole === 'USER' && !m.isRead,
                        ).length || 0
                      const lastMessage = conv.messages?.[conv.messages.length - 1]

                      return (
                        <button
                          key={conv.id}
                          onClick={() => selectConversation(conv.id)}
                          className={`w-full text-left p-4 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                            selectedConversation?.id === conv.id
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                                {conv.user?.email || 'Неизвестный пользователь'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {topicLabels[conv.topic] || conv.topic}
                              </p>
                            </div>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full ml-2">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {lastMessage.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                            <div className="flex gap-1">
                              {conv.status === 'closed' && (
                                <span className="text-xs text-red-600 dark:text-red-400">Закрыто</span>
                              )}
                              {conv.priority === 'high' && (
                                <span className="text-xs text-orange-600 dark:text-orange-400">!</span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg shadow flex flex-col max-h-[600px]">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                            {selectedConversation.user?.email || 'Неизвестный пользователь'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {topicLabels[selectedConversation.topic] || selectedConversation.topic} •{' '}
                            {selectedConversation.status === 'closed' ? 'Закрыто' : 'Открыто'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {selectedConversation.status === 'open' && (
                            <button
                              onClick={() => handleCloseConversation(selectedConversation.id)}
                              className="btn-outline text-sm"
                            >
                              Закрыть
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedConversation.messages
                        ?.sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                        )
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.senderRole === 'ADMIN'
                                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-50'
                                  : 'bg-primary text-white'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.senderRole === 'ADMIN'
                                    ? 'text-gray-500 dark:text-gray-400'
                                    : 'text-primary-100'
                                }`}
                              >
                                {new Date(msg.createdAt).toLocaleString('ru-RU')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>

                    {selectedConversation.status === 'open' && (
                      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex gap-2">
                          <textarea
                            value={conversationMessage}
                            onChange={(e) => setConversationMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendConversationMessage()
                              }
                            }}
                            placeholder="Введите сообщение..."
                            rows={2}
                            className="flex-1 input resize-none"
                            disabled={sendingConversationMessage}
                          />
                          <button
                            onClick={handleSendConversationMessage}
                            disabled={sendingConversationMessage || !conversationMessage.trim()}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingConversationMessage ? '...' : 'Отправить'}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Выберите чат для просмотра
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'superadmin' && isSuperAdmin && (
          <div className="space-y-6">
            {/* Create Token Section */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Создать админ-токен
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label mb-2">Разрешения</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allPermissions.map((perm) => (
                      <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTokenPermissions.includes(perm)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTokenPermissions([...newTokenPermissions, perm])
                            } else {
                              setNewTokenPermissions(newTokenPermissions.filter((p) => p !== perm))
                            }
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <label className="label mb-2">Назначить пользователю (опционально)</label>
                  <div className="relative" ref={userDropdownRef}>
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value)
                        setShowUserDropdown(true)
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder="Поиск по email или имени..."
                      className="input w-full"
                    />
                    {newTokenAssignedUserId && (
                      <button
                        onClick={() => {
                          setNewTokenAssignedUserId('')
                          setUserSearchQuery('')
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {users
                          .filter((u) => {
                            const query = userSearchQuery.toLowerCase()
                            return (
                              u.email.toLowerCase().includes(query) ||
                              u.firstName?.toLowerCase().includes(query) ||
                              u.lastName?.toLowerCase().includes(query) ||
                              `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                            )
                          })
                          .slice(0, 10)
                          .map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setNewTokenAssignedUserId(u.id)
                                setUserSearchQuery(`${u.email}${u.firstName || u.lastName ? ` (${u.firstName || ''} ${u.lastName || ''})`.trim() : ''}`)
                                setShowUserDropdown(false)
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 ${
                                newTokenAssignedUserId === u.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="text-sm text-gray-900 dark:text-gray-50">{u.email}</div>
                              {(u.firstName || u.lastName) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {u.firstName} {u.lastName}
                                </div>
                              )}
                            </button>
                          ))}
                        {users.filter((u) => {
                          const query = userSearchQuery.toLowerCase()
                          return (
                            u.email.toLowerCase().includes(query) ||
                            u.firstName?.toLowerCase().includes(query) ||
                            u.lastName?.toLowerCase().includes(query) ||
                            `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
                          )
                        }).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            Пользователи не найдены
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {newTokenAssignedUserId && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ Токен будет автоматически активирован для выбранного пользователя
                    </p>
                  )}
                </div>
                <div>
                  <label className="label mb-2">Срок действия (опционально)</label>
                  <input
                    type="datetime-local"
                    value={newTokenExpiresAt}
                    onChange={(e) => setNewTokenExpiresAt(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  onClick={handleCreateToken}
                  disabled={creatingToken || newTokenPermissions.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingToken
                    ? 'Создание...'
                    : newTokenAssignedUserId
                    ? 'Создать и активировать токен'
                    : 'Создать токен'}
                </button>
              </div>
            </div>

            {/* Tokens List */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Админ-токены
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Короткий код
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Разрешения
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Назначен
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {adminTokens.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Нет токенов
                        </td>
                      </tr>
                    ) : (
                      adminTokens.map((token) => (
                        <tr key={token.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-50">
                            {token.shortCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-50">
                            <div className="flex flex-wrap gap-1">
                              {token.permissions.map((perm) => (
                                <span
                                  key={perm}
                                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded"
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {token.isRevoked ? (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                                Отозван
                              </span>
                            ) : token.isActivated ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                Активирован
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                                Ожидает активации
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {token.assignedToUser ? token.assignedToUser.email : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {!token.isRevoked && (
                              <button
                                onClick={() => handleRevokeToken(token.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              >
                                Отозвать
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admins List */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-4">
                Администраторы
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Роль
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Разрешения
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Источник токена
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Нет администраторов
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-50">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                admin.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {admin.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-50">
                            <div className="flex flex-wrap gap-1">
                              {admin.permissions.length > 0 ? (
                                admin.permissions.map((perm) => (
                                  <span
                                    key={perm}
                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded"
                                  >
                                    {perm}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">Все разрешения</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {admin.tokenSource ? (
                              <div>
                                <div>Создан: {admin.tokenSource.createdBy}</div>
                                <div className="text-xs">
                                  {new Date(admin.tokenSource.createdAt).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            ) : (
                              'Прямое назначение'
                            )}
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
      </div>
    </div>
  )
}
