'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Task } from '@/lib/api'
import { tasksApi } from '@/lib/api'
import { StopwatchIcon, LocationPinIcon, StarIcon } from '@/components/TaskCardIcons'
import TaskCountdown from '@/components/TaskCountdown'
import { useI18n } from '@/contexts/I18nContext'
import { useAuth } from '@/contexts/AuthContext'

interface TaskCardProps {
  task: Task
  onTaskClaimed?: () => void
  isFavorite?: boolean
  onToggleFavorite?: (taskId: string) => void
}

const urgencyColors = {
  low: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300',
  medium: 'bg-warning/20 dark:bg-warning/30 text-warning dark:text-yellow-400',
  high: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
}

const urgencyLabels = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
}

export default function TaskCard({
  task,
  onTaskClaimed,
  isFavorite = false,
  onToggleFavorite,
}: TaskCardProps) {
  const router = useRouter()
  const { t } = useI18n()
  const { user } = useAuth()
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')

  const handleClaimTask = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push('/login')
      return
    }

    try {
      setIsClaiming(true)
      setClaimError('')
      await tasksApi.claim(task.id)
      if (onTaskClaimed) {
        onTaskClaimed()
      }
    } catch (err: any) {
      setClaimError(err.response?.data?.message || 'Ошибка при взятии задачи')
    } finally {
      setIsClaiming(false)
    }
  }

  const handleViewTask = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/tasks/${task.id}`)
  }

  const firstPhoto = task.photoUrls?.[0]

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-800 transition-all duration-200 overflow-hidden">
      <div className="p-3 md:p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-3">
          <div className="h-24 w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800">
            {firstPhoto ? (
              <img src={firstPhoto} alt={task.shortDescription} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-gray-500 dark:text-gray-400 px-2 text-center">
                Без фото
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h2 className="line-clamp-2 text-base md:text-lg font-semibold text-gray-900 dark:text-gray-50">
                {task.shortDescription}
              </h2>
              <div className="shrink-0 flex items-start gap-2">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggleFavorite(task.id)
                    }}
                    className="rounded-full border border-gray-200 dark:border-slate-700 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800"
                    aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    <svg className={`h-4 w-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path d="M9.999 17.264C-.69 11.5 3.1 3 7.799 3c2.151 0 3.14 1.01 3.2 1.073C11.06 4.01 12.048 3 14.2 3 18.9 3 22.689 11.5 9.999 17.264z" />
                    </svg>
                  </button>
                )}
                <span className="text-lg md:text-xl font-bold text-primary dark:text-blue-400">
                  {task.reward.toLocaleString()} ₸
                </span>
              </div>
            </div>

            <p className="mb-2 line-clamp-2 text-xs md:text-sm text-gray-600 dark:text-gray-300">
              {task.fullDescription}
            </p>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${urgencyColors[task.urgency]}`}>
                <StopwatchIcon className="w-3 h-3" />
                {urgencyLabels[task.urgency]}
              </span>
              {task.createdBy?.ratingAvg && task.createdBy.ratingAvg > 0 && (
                <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
                  <StarIcon className="w-3 h-3" filled />
                  {Number(task.createdBy.ratingAvg).toFixed(1)}
                </span>
              )}
            </div>

            <div className="mb-3 flex items-center gap-3 text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <LocationPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{task.city}</span>
              </div>
              {task.expiresAt && task.status === 'created' && (
                <div className="flex items-center gap-1">
                  <StopwatchIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <TaskCountdown expiresAt={task.expiresAt} status={task.status} />
                </div>
              )}
            </div>

            {claimError && (
              <div className="mb-2 text-xs text-red-600 dark:text-red-400">
                {claimError}
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/tasks/${task.id}`}
                onClick={handleViewTask}
                className="flex-1 btn-outline text-center py-2 text-xs md:text-sm font-semibold"
              >
                Смотреть
              </Link>
              <button
                onClick={handleClaimTask}
                disabled={isClaiming || task.status !== 'created'}
                className="flex-1 btn-primary py-2 text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClaiming ? 'Загрузка...' : 'Взять'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
