'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { ChatConversation, chatApi } from '@/lib/api'

function fullName(user?: { firstName?: string; lastName?: string; email?: string } | null) {
  if (!user) return 'Пользователь'
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  return name || user.email || 'Пользователь'
}

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selected, setSelected] = useState<ChatConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<any | null>(null)
  const [requestMessage, setRequestMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadConversations()
  }, [user, router])

  const pendingConversations = useMemo(
    () => conversations.filter((c) => c.status === 'pending'),
    [conversations],
  )

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await chatApi.getConversations()
      setConversations(data)
      if (data.length > 0 && !selected) {
        await selectConversation(data[0].id)
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка загрузки чатов', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (id: string) => {
    try {
      const conversation = await chatApi.getConversation(id, true)
      setSelected(conversation)
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка загрузки диалога', 'error')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      setSearchLoading(true)
      const result = await chatApi.searchUser(searchQuery.trim())
      setSearchResult(result)
      if (!result) {
        showToast('Пользователь не найден', 'error')
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка поиска', 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  const createRequest = async () => {
    if (!searchResult || !requestMessage.trim()) return
    try {
      const conversation = await chatApi.createRequest(searchResult.id, requestMessage.trim())
      setRequestMessage('')
      setSearchResult(null)
      setSearchQuery('')
      await loadConversations()
      setSelected(conversation)
      showToast('Запрос на переписку отправлен', 'success')
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Не удалось отправить запрос', 'error')
    }
  }

  const sendMessage = async () => {
    if (!selected || !message.trim() || sending) return
    try {
      setSending(true)
      const updated = await chatApi.sendMessage(selected.id, message.trim())
      setMessage('')
      setSelected(updated)
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка отправки', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleAction = async (action: 'accept' | 'decline' | 'block') => {
    if (!selected) return
    try {
      if (action === 'accept') {
        const updated = await chatApi.acceptRequest(selected.id)
        setSelected(updated)
      } else if (action === 'decline') {
        const updated = await chatApi.declineRequest(selected.id)
        setSelected(updated)
      } else {
        await chatApi.blockUser(selected.id)
        setSelected(null)
      }
      await loadConversations()
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Ошибка действия', 'error')
    }
  }

  if (loading) {
    return <div className="min-h-screen pb-20 md:pb-8 p-6">Загрузка...</div>
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="card">
          <h1 className="text-2xl font-bold mb-3">Защищенное общение</h1>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="input flex-1"
              placeholder="Email или телефон (+77001234567)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn-primary" onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? 'Поиск...' : 'Найти'}
            </button>
          </div>
          {searchResult && (
            <div className="mt-4 p-3 rounded-lg border border-gray-200 dark:border-slate-700">
              <p className="font-medium">{fullName(searchResult)}</p>
              <p className="text-sm text-gray-500">{searchResult.email}</p>
              <textarea
                className="input mt-3"
                rows={3}
                placeholder="Первое сообщение..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
              <button className="btn-primary mt-2" onClick={createRequest}>
                Создать запрос на переписку
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-290px)]">
          <div className="card overflow-y-auto">
            <h2 className="font-semibold mb-2">Диалоги</h2>
            {pendingConversations.length > 0 && (
              <p className="text-sm text-amber-600 mb-2">
                Запросы на переписку: {pendingConversations.length}
              </p>
            )}
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`w-full text-left p-3 rounded-lg border ${
                    selected?.id === conversation.id
                      ? 'border-primary'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <div className="text-sm font-medium">{fullName(conversation.otherUser)}</div>
                  <div className="text-xs text-gray-500">
                    {conversation.status === 'pending'
                      ? 'Запрос'
                      : conversation.status === 'active'
                        ? 'Активный'
                        : 'Отклонен'}
                  </div>
                  {!!conversation.lastMessagePreview && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {conversation.lastMessagePreview}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card lg:col-span-2 flex flex-col">
            {!selected ? (
              <div className="text-gray-500">Выберите диалог</div>
            ) : (
              <>
                <div className="pb-3 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold">{fullName(selected.otherUser)}</h3>
                  {selected.isIncomingRequest && selected.status === 'pending' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Режим превью: отправитель не увидит статус прочтения
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto py-3 space-y-2">
                  {selected.messages?.map((m) => (
                    <div key={m.id} className={m.senderId === user?.id ? 'text-right' : 'text-left'}>
                      <div className="inline-block max-w-[80%] px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800">
                        {m.message}
                      </div>
                    </div>
                  ))}
                </div>

                {selected.isIncomingRequest && selected.status === 'pending' ? (
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                    <button className="btn-primary" onClick={() => handleAction('accept')}>
                      Принять
                    </button>
                    <button className="btn-outline" onClick={() => handleAction('decline')}>
                      Отклонить
                    </button>
                    <button className="btn-danger" onClick={() => handleAction('block')}>
                      Заблокировать
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex gap-2">
                    <textarea
                      className="input flex-1"
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Введите сообщение..."
                    />
                    <button className="btn-primary" onClick={sendMessage} disabled={sending}>
                      Отправить
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
