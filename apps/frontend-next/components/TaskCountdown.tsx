'use client'

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface TaskCountdownProps {
  expiresAt: string
  status: string
}

export default function TaskCountdown({ expiresAt, status }: TaskCountdownProps) {
  const { t } = useI18n()
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number
    minutes: number
    totalMinutes: number
  } | null>(null)

  useEffect(() => {
    if (status !== 'created' || !expiresAt) {
      setTimeRemaining(null)
      return
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeRemaining(null)
        return
      }

      const totalMinutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      setTimeRemaining({ hours, minutes, totalMinutes })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [expiresAt, status])

  if (!timeRemaining) {
    return null
  }

  // Determine color based on time remaining
  let colorClass = 'text-green-600 dark:text-green-400'
  if (timeRemaining.totalMinutes < 120) {
    // Less than 2 hours
    colorClass = 'text-red-600 dark:text-red-400'
  } else if (timeRemaining.totalMinutes < 360) {
    // Less than 6 hours
    colorClass = 'text-orange-600 dark:text-orange-400'
  } else if (timeRemaining.totalMinutes < 720) {
    // Less than 12 hours
    colorClass = 'text-yellow-600 dark:text-yellow-400'
  }

  const formatTime = () => {
    if (timeRemaining.hours > 0) {
      return t('task.expiresIn')
        .replace('{hours}', String(timeRemaining.hours))
        .replace('{minutes}', String(timeRemaining.minutes))
    } else {
      return t('task.expiresSoon').replace('{minutes}', String(timeRemaining.minutes))
    }
  }

  return (
    <p className={`text-sm font-medium ${colorClass}`}>
      {formatTime()}
    </p>
  )
}
