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

export default function TaskCard({ task, onTaskClaimed }: TaskCardProps) {
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-slate-800 transition-all duration-200 hover:scale-[1.01] overflow-hidden">
      <div className="p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
        {/* Header: Price + Title visually connected */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1 pr-2">
              {task.shortDescription}
            </h2>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-primary/10 dark:bg-primary/20 rounded-xl px-3 py-2">
              <span className="text-2xl md:text-3xl font-bold text-primary dark:text-blue-400">
                {task.reward.toLocaleString()} ₸
              </span>
            </div>
          </div>
        </div>

        {/* Badges: Urgency and Rating */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${urgencyColors[task.urgency]}`}>
            <StopwatchIcon className="w-3.5 h-3.5" />
            {urgencyLabels[task.urgency]}
          </span>
          {task.createdBy?.ratingAvg && task.createdBy.ratingAvg > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 flex items-center gap-1">
              <StarIcon className="w-3 h-3" filled />
              {Number(task.createdBy.ratingAvg).toFixed(1)}
            </span>
          )}
        </div>

        {/* Description: Limited to 2 lines */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {task.fullDescription}
        </p>

        {/* Metadata: City and Timer in one row */}
        <div className="flex items-center gap-4 mb-4 text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <LocationPinIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{task.city}</span>
          </div>
          {task.expiresAt && task.status === 'created' && (
            <div className="flex items-center gap-1.5">
              <StopwatchIcon className="w-4 h-4 flex-shrink-0" />
              <TaskCountdown expiresAt={task.expiresAt} status={task.status} />
            </div>
          )}
        </div>

        {/* Error message */}
        {claimError && (
          <div className="mb-3 text-xs text-red-600 dark:text-red-400">
            {claimError}
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <Link
            href={`/tasks/${task.id}`}
            onClick={handleViewTask}
            className="flex-1 btn-outline text-center py-2.5 text-sm font-semibold"
          >
            Смотреть
          </Link>
          <button
            onClick={handleClaimTask}
            disabled={isClaiming || task.status !== 'created'}
            className="flex-1 btn-primary py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClaiming ? 'Загрузка...' : 'Взять задачу'}
          </button>
        </div>
      </div>
    </div>
  )
}
