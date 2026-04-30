'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { useI18n } from '@/contexts/I18nContext'

const AI_DRAFT_STORAGE_KEY = 'ai_task_draft_payload_v1'

export default function CreateTaskPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    shortDescription: '',
    fullDescription: '',
    reward: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
    city: 'Астана',
    address: '',
    executionTime: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiHint, setAiHint] = useState('')
  const [aiMissingFields, setAiMissingFields] = useState<string[]>([])
  const [aiCanSubmit, setAiCanSubmit] = useState<boolean | null>(null)
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const MAX_TOTAL_PHOTO_PAYLOAD_BYTES = 12 * 1024 * 1024

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    const applyDraftFromStorage = () => {
      if (typeof window === 'undefined') return
      const raw = localStorage.getItem(AI_DRAFT_STORAGE_KEY)
      if (!raw) return

      try {
        const parsed = JSON.parse(raw)
        const draft = parsed?.draft
        if (!draft) return

        const nextFormData = {
          ...formData,
          shortDescription: draft.shortDescription || formData.shortDescription,
          fullDescription: draft.fullDescription || formData.fullDescription,
          city: draft.city || formData.city,
          address: draft.address || formData.address,
          urgency: draft.urgency || formData.urgency,
          executionTime: extractTimeValue(draft.fullDescription || formData.fullDescription),
          reward:
            typeof draft.rewardSuggestion === 'number' && draft.rewardSuggestion >= 5
              ? String(draft.rewardSuggestion)
              : formData.reward,
        }
        setFormData(nextFormData)

        const localMissing = getMissingFieldsFromForm(nextFormData)
        const responseMissing = Array.isArray(draft.missingFields)
          ? draft.missingFields
          : localMissing
        const canSubmit =
          typeof draft.canSubmit === 'boolean'
            ? draft.canSubmit && localMissing.length === 0
            : responseMissing.length === 0

        setAiMissingFields(responseMissing)
        setAiCanSubmit(canSubmit)

        if (!canSubmit) {
          const missingLabels = mapMissingFieldsToLabels(responseMissing)
          setAiHint(`Пожалуйста, дополните вручную: ${missingLabels.join(', ')}.`)
        } else if (draft.rewriteQualityNote) {
          setAiHint(draft.rewriteQualityNote)
        } else {
          setAiHint('Поля заполнены, проверьте и нажмите "Создать задачу"')
        }
      } catch {
        // ignore malformed draft payload
      } finally {
        localStorage.removeItem(AI_DRAFT_STORAGE_KEY)
      }
    }

    applyDraftFromStorage()
    window.addEventListener('ai-task-draft-ready', applyDraftFromStorage as EventListener)
    return () => {
      window.removeEventListener('ai-task-draft-ready', applyDraftFromStorage as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  useEffect(() => {
    if (aiCanSubmit === null) return
    const localMissing = getMissingFieldsFromForm(formData)
    setAiMissingFields(localMissing)
    setAiCanSubmit(localMissing.length === 0)
  }, [formData, aiCanSubmit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    const reward = parseInt(formData.reward)
    if (isNaN(reward) || reward < 5) {
      setError('Вознаграждение должно быть не менее 5 ₸')
      return
    }
    if (reward % 5 !== 0) {
      setError('Вознаграждение должно быть кратно 5')
      return
    }

    if (!formData.city.trim() || !formData.address.trim()) {
      setError('Укажите город и адрес')
      return
    }

    try {
      setLoading(true)
      const requestPayload = {
        shortDescription: formData.shortDescription,
        fullDescription: buildFullDescriptionWithTime(
          formData.fullDescription,
          formData.executionTime,
        ),
        reward,
        city: formData.city.trim(),
        address: formData.address.trim(),
        urgency: formData.urgency,
        photoUrls: photoPreviews,
      };
      await tasksApi.create(requestPayload)
      showToast(t('toast.taskCreated'), 'success')
      router.push('/feed')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка создания задачи'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (photoPreviews.length >= 5) {
      setError('Можно прикрепить не больше 5 фото')
      return
    }

    const remainingSlots = 5 - photoPreviews.length
    const selectedFiles = Array.from(files).slice(0, remainingSlots)
    setUploadingPhoto(true)
    setError('')

    try {
      const converted = await Promise.all(
        selectedFiles.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              if (!file.type.startsWith('image/')) {
                reject(new Error('Можно загружать только изображения'))
                return
              }

              if (file.size > 3 * 1024 * 1024) {
                reject(new Error('Размер одного фото не должен превышать 3MB'))
                return
              }

              const reader = new FileReader()
              reader.onload = () => {
                const image = new Image()
                image.onload = () => {
                  const maxWidth = 1600
                  const maxHeight = 1600
                  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
                  const targetWidth = Math.round(image.width * scale)
                  const targetHeight = Math.round(image.height * scale)

                  const canvas = document.createElement('canvas')
                  canvas.width = targetWidth
                  canvas.height = targetHeight
                  const ctx = canvas.getContext('2d')
                  if (!ctx) {
                    reject(new Error('Не удалось обработать изображение'))
                    return
                  }

                  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)
                  const compressed = canvas.toDataURL('image/jpeg', 0.78)
                  resolve(compressed)
                }
                image.onerror = () => reject(new Error('Не удалось обработать изображение'))
                image.src = reader.result as string
              }
              reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
              reader.readAsDataURL(file)
            }),
        ),
      )
      setPhotoPreviews((prev) => {
        const next = [...prev, ...converted]
        const totalBytes = next.reduce((sum, photo) => sum + photo.length, 0)
        if (totalBytes > MAX_TOTAL_PHOTO_PAYLOAD_BYTES) {
          setError('Слишком большой общий размер фото. Уменьшите количество или размер изображений.')
          return prev
        }
        return next
      })
    } catch (uploadError: any) {
      setError(uploadError.message || 'Ошибка загрузки фото')
    } finally {
      setUploadingPhoto(false)
      event.target.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleAiFill = async () => {
    const prompt = aiPrompt.trim()
    if (prompt.length < 5) {
      setError('Опишите задачу хотя бы в 5 символов')
      return
    }

    try {
      setAiLoading(true)
      setError('')
      setAiHint('')
      setAiMissingFields([])

      const draft = await tasksApi.parseDraft(prompt)
      const nextFormData = {
        ...formData,
        shortDescription: draft.shortDescription || formData.shortDescription,
        fullDescription: draft.fullDescription || formData.fullDescription,
        city: draft.city || formData.city,
        address: draft.address || formData.address,
        urgency: draft.urgency || formData.urgency,
        executionTime: extractTimeValue(draft.fullDescription || formData.fullDescription),
        reward:
          typeof draft.rewardSuggestion === 'number' && draft.rewardSuggestion >= 5
            ? String(draft.rewardSuggestion)
            : formData.reward,
      }
      setFormData(nextFormData)

      const localMissing = getMissingFieldsFromForm(nextFormData)
      const responseMissing = Array.isArray(draft.missingFields)
        ? draft.missingFields
        : localMissing
      const canSubmit =
        typeof draft.canSubmit === 'boolean'
          ? draft.canSubmit && localMissing.length === 0
          : responseMissing.length === 0

      setAiMissingFields(responseMissing)
      setAiCanSubmit(canSubmit)

      if (!canSubmit) {
        const missingLabels = mapMissingFieldsToLabels(responseMissing)
        setAiHint(`Пожалуйста, дополните вручную: ${missingLabels.join(', ')}.`)
      } else if (draft.rewriteQualityNote) {
        setAiHint(draft.rewriteQualityNote)
      } else if (draft.needsUserClarification && draft.clarificationQuestion) {
        setAiHint(draft.clarificationQuestion)
      } else {
        setAiHint('Поля заполнены, проверьте и нажмите "Создать задачу"')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Ошибка AI-парсинга'
      setError(errorMessage)
      setAiCanSubmit(null)
      setAiMissingFields([])
      showToast(errorMessage, 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const getMissingFieldsFromForm = (value: typeof formData): string[] => {
    const missing: string[] = []
    if (!value.shortDescription.trim()) missing.push('shortDescription')
    if (!value.fullDescription.trim()) missing.push('fullDescription')
    const reward = Number(value.reward)
    if (!Number.isFinite(reward) || reward < 5) missing.push('reward')
    const normalizedAddress = value.address.trim().toLowerCase()
    if (!normalizedAddress || normalizedAddress === 'требуется уточнение') missing.push('address')
    const hasTime =
      Boolean(value.executionTime.trim()) ||
      /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/.test(value.fullDescription)
    if (!hasTime) missing.push('time')
    return missing
  }

  const extractTimeValue = (text: string): string => {
    const match = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/)
    if (!match) return ''
    return `${match[1]}:${match[2]}`
  }

  const buildFullDescriptionWithTime = (
    description: string,
    executionTime: string,
  ): string => {
    const base = description.trim()
    const time = executionTime.trim()
    if (!time) return base
    const hasTime = new RegExp(`\\b${time.replace(':', '[:.]')}\\b`, 'i').test(base)
    if (hasTime) return base
    return `${base} Удобное время: ${time}.`.trim()
  }

  const mapMissingFieldsToLabels = (fields: string[]): string[] => {
    const labels: Record<string, string> = {
      shortDescription: 'краткое описание',
      fullDescription: 'полное описание',
      reward: 'вознаграждение',
      address: 'адрес',
      time: 'время',
    }
    return fields.map((field) => labels[field] || field)
  }


  return (
    <div className="min-h-screen transition-colors duration-200 pb-20 md:pb-8">
      <div className="max-w-screen-md mx-auto px-4 md:px-6 py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-50 mb-6 md:mb-8">Создать задачу</h1>

        <div className="card p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 md:p-4 backdrop-blur-sm">
              <label htmlFor="aiPrompt" className="label">
                AI ассистент: опишите задачу свободным текстом
              </label>
              <textarea
                id="aiPrompt"
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="input"
                placeholder="Например: Нужно завтра после 18:00 починить кран на кухне, район Есиль..."
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleAiFill}
                  disabled={aiLoading}
                  className="btn-primary min-h-[40px] px-4"
                >
                  {aiLoading ? 'Обработка...' : 'Заполнить через ИИ'}
                </button>
              </div>
              {aiHint && (
                <p className="mt-2 text-sm text-primary">{aiHint}</p>
              )}
              {aiMissingFields.length > 0 && (
                <p className="mt-1 text-sm text-amber-400">
                  Незаполненные поля: {mapMissingFieldsToLabels(aiMissingFields).join(', ')}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="shortDescription" className="label">
                Краткое описание *
              </label>
              <input
                id="shortDescription"
                type="text"
                required
                maxLength={100}
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                className="input"
                placeholder="Например: Доставить посылку"
              />
            </div>

            <div>
              <label htmlFor="fullDescription" className="label">
                Полное описание *
              </label>
              <textarea
                id="fullDescription"
                required
                rows={5}
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                className="input"
                placeholder="Подробное описание задачи..."
              />
            </div>

            <div>
              <label htmlFor="photos" className="label">
                Фото к задаче (до 5)
              </label>
              <input
                id="photos"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="input min-h-[44px] file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                До 5 фото, каждое не больше 3MB
              </p>

              {uploadingPhoto && (
                <p className="text-sm text-primary mt-2">Загрузка фото...</p>
              )}

              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {photoPreviews.map((photo, index) => (
                    <div key={`${photo.slice(0, 16)}-${index}`} className="relative">
                      <img
                        src={photo}
                        alt={`Фото ${index + 1}`}
                        className="h-24 w-full rounded-lg border border-gray-200 dark:border-slate-700 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-xs text-white"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reward" className="label">
                Вознаграждение (₸) *
              </label>
              <input
                id="reward"
                type="number"
                required
                min={5}
                step={5}
                value={formData.reward}
                onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                className="input"
                placeholder="1000"
              />
              <p className="text-sm text-gray-500 mt-1">Минимум 5 ₸, кратно 5</p>
            </div>

            <div>
              <label htmlFor="urgency" className="label">
                Срочность *
              </label>
              <select
                id="urgency"
                required
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="input min-h-[44px]"
              >
                <option value="low">Низкая</option>
                <option value="medium">Средняя</option>
                <option value="high">Высокая</option>
              </select>
            </div>

            <div>
              <label htmlFor="city" className="label">
                Город *
              </label>
              <input
                id="city"
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
                placeholder="Астана"
              />
            </div>

            <div>
              <label htmlFor="address" className="label">
                Адрес *
              </label>
              <input
                id="address"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                placeholder="Улица, дом, квартира"
              />
            </div>

            <div>
              <label htmlFor="executionTime" className="label">
                Время выполнения (чч:мм)
              </label>
              <input
                id="executionTime"
                type="time"
                value={formData.executionTime}
                onChange={(e) => setFormData({ ...formData, executionTime: e.target.value })}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || aiCanSubmit === false}
              className="btn-primary w-full min-h-[44px]"
            >
              {loading ? 'Создание...' : 'Создать задачу'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
