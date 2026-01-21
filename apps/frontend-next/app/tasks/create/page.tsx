'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { useToast } from '@/contexts/ToastContext'
import { useI18n } from '@/contexts/I18nContext'

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
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks/create/page.tsx:CreateTaskPage:useEffect',message:'CreateTaskPage component mounted',data:{formData,hasCity:'city' in formData,hasAddress:'address' in formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
  }, [])

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
      // #region agent log
      const requestPayload = {
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        reward,
        city: formData.city.trim(),
        address: formData.address.trim(),
        urgency: formData.urgency,
      };
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks/create/page.tsx:handleSubmit:before-api',message:'About to send create task request',data:{payload:requestPayload,hasLongitude:'longitude' in requestPayload,hasLatitude:'latitude' in requestPayload,hasCity:'city' in requestPayload,hasAddress:'address' in requestPayload},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
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


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-8">Создать задачу</h1>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="input"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Создание...' : 'Создать задачу'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
