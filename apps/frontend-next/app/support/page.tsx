'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/contexts/I18nContext'
import { useToast } from '@/contexts/ToastContext'
import { supportApi, SupportConversation, SupportMessage } from '@/lib/api'

const topicLabels: Record<string, string> = {
  task_issue: 'Проблема с задачей',
  account_access: 'Аккаунт / Доступ',
  restriction_block: 'Ограничение / Блокировка',
  other: 'Другое',
}

export default function SupportPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { t } = useI18n()
  const { showToast } = useToast()
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [newTopic, setNewTopic] = useState<string>('')
  const [newMessage, setNewMessage] = useState('')
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      loadConversations()
    }
  }, [authLoading, user])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const data = await supportApi.getConversations()
      setConversations(data)
      // If URL has conversation param, select it
      const urlParams = new URLSearchParams(window.location.search)
      const conversationId = urlParams.get('conversation')
      if (conversationId) {
        const conv = data.find((c) => c.id === conversationId)
        if (conv) {
          await selectConversation(conv.id)
        }
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка загрузки чатов', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (id: string) => {
    try {
      const conv = await supportApi.getConversation(id)
      setSelectedConversation(conv)
      // Update URL
      window.history.pushState({}, '', `/support?conversation=${id}`)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка загрузки чата', 'error')
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !message.trim() || sending) return

    if (selectedConversation.status === 'closed') {
      showToast('Нельзя отправлять сообщения в закрытый чат', 'error')
      return
    }

    try {
      setSending(true)
      const newMessage = await supportApi.sendMessage(selectedConversation.id, message.trim())
      setMessage('')
      // Reload conversation to get updated messages
      await selectConversation(selectedConversation.id)
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка отправки сообщения', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleCreateConversation = async () => {
    if (!newTopic || !newMessage.trim() || newMessage.trim().length < 10) {
      showToast('Выберите тему и введите сообщение (минимум 10 символов)', 'error')
      return
    }

    try {
      setCreating(true)
      const conv = await supportApi.createConversation(newTopic, newMessage.trim())
      setShowNewConversationModal(false)
      setNewTopic('')
      setNewMessage('')
      await loadConversations()
      await selectConversation(conv.id)
      showToast('Обращение создано', 'success')
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка создания обращения', 'error')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Поддержка</h1>
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="btn-primary"
          >
            + Новое обращение
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-lg shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">Мои обращения</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Нет обращений
                </div>
              ) : (
                conversations.map((conv) => {
                  const unreadCount = conv.messages?.filter(
                    (m) => m.senderRole === 'ADMIN' && !m.isRead
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
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                          {topicLabels[conv.topic] || conv.topic}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {lastMessage.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(conv.lastMessageAt || conv.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                      {conv.status === 'closed' && (
                        <span className="text-xs text-red-600 dark:text-red-400">Закрыто</span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-lg shadow flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 dark:text-gray-50">
                        {topicLabels[selectedConversation.topic] || selectedConversation.topic}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedConversation.status === 'closed' ? 'Закрыто' : 'Открыто'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderRole === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.senderRole === 'USER'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-50'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.senderRole === 'USER'
                              ? 'text-primary-100'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {selectedConversation.status === 'open' && (
                  <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Введите сообщение..."
                        rows={2}
                        className="flex-1 input resize-none"
                        disabled={sending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !message.trim()}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? '...' : 'Отправить'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Выберите обращение или создайте новое
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => !creating && setShowNewConversationModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              Новое обращение
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-2">Тема</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="input"
                  disabled={creating}
                >
                  <option value="">Выберите тему</option>
                  <option value="task_issue">{topicLabels.task_issue}</option>
                  <option value="account_access">{topicLabels.account_access}</option>
                  <option value="restriction_block">{topicLabels.restriction_block}</option>
                  <option value="other">{topicLabels.other}</option>
                </select>
              </div>
              <div>
                <label className="label mb-2">Сообщение</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Опишите вашу проблему..."
                  rows={5}
                  className="input resize-none"
                  disabled={creating}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Минимум 10 символов
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewConversationModal(false)}
                  disabled={creating}
                  className="btn-outline flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateConversation}
                  disabled={creating || !newTopic || newMessage.trim().length < 10}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
