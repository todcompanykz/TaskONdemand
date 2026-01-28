'use client'

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/I18nContext'
import { useToast } from '@/contexts/ToastContext'
import { supportApi, CreateSupportRequestData } from '@/lib/api'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [topic, setTopic] = useState<CreateSupportRequestData['topic'] | ''>('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ topic?: string; message?: string }>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTopic('')
      setMessage('')
      setErrors({})
      setSubmitting(false)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, submitting, onClose])

  const validate = (): boolean => {
    const newErrors: { topic?: string; message?: string } = {}

    if (!topic) {
      newErrors.topic = t('support.topicPlaceholder')
    }

    if (!message.trim()) {
      newErrors.message = t('support.messageRequired')
    } else if (message.trim().length < 10) {
      newErrors.message = t('support.messageMinLength')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)

    try {
      await supportApi.createConversation(
        topic as CreateSupportRequestData['topic'],
        message.trim(),
      )

      showToast(t('support.success'), 'success')
      onClose()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('support.error')
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[10001] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
            {t('support.title')}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            aria-label="Close"
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

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('support.description')}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Topic Select */}
          <div className="mb-4">
            <label htmlFor="support-topic" className="label">
              {t('support.topic')}
            </label>
            <select
              id="support-topic"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value as CreateSupportRequestData['topic'])
                if (errors.topic) {
                  setErrors({ ...errors, topic: undefined })
                }
              }}
              className={`input ${errors.topic ? 'border-red-500 dark:border-red-500' : ''}`}
              disabled={submitting}
            >
              <option value="">{t('support.topicPlaceholder')}</option>
              <option value="task_issue">{t('support.topics.taskIssue')}</option>
              <option value="account_access">{t('support.topics.accountAccess')}</option>
              <option value="restriction_block">{t('support.topics.restrictionBlock')}</option>
              <option value="other">{t('support.topics.other')}</option>
            </select>
            {errors.topic && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.topic}</p>
            )}
          </div>

          {/* Message Textarea */}
          <div className="mb-6">
            <label htmlFor="support-message" className="label">
              {t('support.message')}
            </label>
            <textarea
              id="support-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (errors.message) {
                  setErrors({ ...errors, message: undefined })
                }
              }}
              placeholder={t('support.messagePlaceholder')}
              rows={5}
              className={`input resize-none ${errors.message ? 'border-red-500 dark:border-red-500' : ''}`}
              disabled={submitting}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-outline flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !topic || !message.trim()}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('support.submitting') : t('support.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
