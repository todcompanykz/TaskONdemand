'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { tasksApi, ParseTaskDraftDto } from '@/lib/api'

const STORAGE_KEY = 'ai_task_draft_payload_v1'

export default function AiAssistantWidget() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  const onCreateTaskPage = pathname === '/tasks/create'

  const draftPreview = useMemo(() => {
    if (!hint) return null
    return hint
  }, [hint])

  const saveDraft = (draft: ParseTaskDraftDto, freeText: string) => {
    if (typeof window === 'undefined') return
    const payload = {
      source: 'global-widget',
      freeText,
      draft,
      createdAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    window.dispatchEvent(new CustomEvent('ai-task-draft-ready'))
  }

  const handleGenerate = async () => {
    const normalized = prompt.trim()
    if (normalized.length < 5) {
      setError('Опишите задачу хотя бы в 5 символов')
      return
    }

    try {
      setLoading(true)
      setError('')
      setHint('')
      const draft = await tasksApi.parseDraft(normalized)
      saveDraft(draft, normalized)
      if (draft.canSubmit === false && draft.missingFields?.length) {
        setHint(`Нужно дополнить вручную: ${draft.missingFields.join(', ')}`)
      } else {
        setHint('Черновик готов. Можно применить к форме создания задачи.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось получить ответ ИИ')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (onCreateTaskPage) {
      window.dispatchEvent(new CustomEvent('ai-task-draft-ready'))
      setIsOpen(false)
      return
    }
    router.push('/tasks/create')
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-[10000] rounded-full bg-primary px-4 py-3 text-white shadow-lg hover:opacity-90"
        aria-label="Открыть AI ассистента"
      >
        AI
      </button>

      {isOpen && (
        <div className="fixed bottom-40 right-4 z-[10000] w-[min(92vw,430px)] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">AI ассистент</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50"
            >
              Закрыть
            </button>
          </div>

          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Опишите задачу в свободной форме..."
            className="input w-full p-2 text-sm"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary px-3 py-2 text-sm"
            >
              {loading ? 'Генерация...' : 'Сгенерировать'}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn-outline px-3 py-2 text-sm"
            >
              {onCreateTaskPage ? 'Применить в форму' : 'Перейти к созданию'}
            </button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          {draftPreview && <p className="mt-2 text-sm text-primary">{draftPreview}</p>}
        </div>
      )}
    </>
  )
}
