'use client'

import { useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useI18n } from '@/contexts/I18nContext'
import { useNotificationHistory } from '@/contexts/NotificationHistoryContext'
import { usersApi, tasksApi, supportApi, NotificationSettings, Task, User, SupportRequest } from '@/lib/api'
import { useRouter } from 'next/navigation'

export type NotificationType =
  | 'user_restricted'
  | 'user_unrestricted'
  | 'user_blocked'
  | 'claim_blocked'
  | 'task_claimed'
  | 'task_cancelled'
  | 'task_completed'
  | 'task_expired'
  | 'support_reply'
  | 'work_confirmed'
  | 'payment_confirmed'

interface NotificationService {
  checkUserRestrictions: () => Promise<void>
  checkTaskEvents: () => Promise<void>
  checkAll: () => Promise<void>
  markNotificationShown: (type: NotificationType, id: string) => void
  shouldShowNotification: (type: NotificationType, settings: NotificationSettings | null) => boolean
}

const getNotificationKey = (type: NotificationType, id: string): string => {
  return `notification_${type}_${id}`
}

const getUserRestrictionStatusKey = (userId: string): string => {
  return `user_restriction_status_${userId}`
}

const getTaskStatusKey = (taskId: string): string => {
  return `task_status_${taskId}`
}

export function useNotificationService(): NotificationService {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const { t } = useI18n()
  const { addNotification } = useNotificationHistory()
  const router = useRouter()
  const settingsCacheRef = useRef<NotificationSettings | null>(null)
  const checkingRef = useRef(false)

  const shouldShowNotification = useCallback(
    (type: NotificationType, settings: NotificationSettings | null): boolean => {
      if (!settings) return true // Default to showing if settings not loaded

      switch (type) {
        case 'user_restricted':
        case 'user_unrestricted':
        case 'user_blocked':
        case 'claim_blocked':
          return settings.accountBlocked
        case 'task_claimed':
          return settings.executorAssigned
        case 'task_cancelled':
        case 'task_completed':
        case 'task_expired':
        case 'work_confirmed':
        case 'payment_confirmed':
          return settings.taskStatusChange
        case 'support_reply':
          return settings.supportReplies ?? true
        default:
          return true
      }
    },
    []
  )

  const markNotificationShown = useCallback((type: NotificationType, id: string) => {
    const key = getNotificationKey(type, id)
    localStorage.setItem(key, 'true')
  }, [])

  const isNotificationShown = useCallback((type: NotificationType, id: string): boolean => {
    const key = getNotificationKey(type, id)
    return localStorage.getItem(key) === 'true'
  }, [])

  const getNotificationSettings = useCallback(async (): Promise<NotificationSettings | null> => {
    if (settingsCacheRef.current) {
      return settingsCacheRef.current
    }

    try {
      const settings = await usersApi.getNotificationSettings()
      settingsCacheRef.current = settings
      return settings
    } catch (error) {
      console.error('Failed to fetch notification settings:', error)
      return null
    }
  }, [])

  const checkUserRestrictions = useCallback(async () => {
    if (!user?.id) return

    try {
      const currentUser = await usersApi.getMe()
      const settings = await getNotificationSettings()

      // Check restriction status change
      const storedStatusKey = getUserRestrictionStatusKey(user.id)
      const storedIsRestricted = localStorage.getItem(storedStatusKey) === 'true'
      const currentIsRestricted = currentUser.isRestricted || false

      // Update stored status
      localStorage.setItem(storedStatusKey, String(currentIsRestricted))

      // Check if status changed
      if (storedIsRestricted !== currentIsRestricted) {
        if (currentIsRestricted) {
          // User became restricted
          const notificationId = `restricted_${user.id}_${Date.now()}`
          if (
            !isNotificationShown('user_restricted', user.id) &&
            shouldShowNotification('user_restricted', settings)
          ) {
            addNotification({
              id: notificationId,
              type: 'user_restricted',
              title: t('notificationHistory.titles.userRestricted'),
              message: t('notifications.userRestricted.message'),
              timestamp: Date.now(),
            })
            showToast(
              t('notifications.userRestricted.message'),
              'warning',
              10000,
              undefined,
              true // Persistent
            )
            markNotificationShown('user_restricted', user.id)
          }
        } else if (storedIsRestricted) {
          // User was unrestricted
          if (
            !isNotificationShown('user_unrestricted', user.id) &&
            shouldShowNotification('user_unrestricted', settings)
          ) {
            addNotification({
              id: `unrestricted_${user.id}_${Date.now()}`,
              type: 'user_unrestricted',
              title: t('notificationHistory.titles.userUnrestricted'),
              message: t('notifications.userUnrestricted.message'),
              timestamp: Date.now(),
            })
            showToast(t('notifications.userUnrestricted.message'), 'success', 8000)
            markNotificationShown('user_unrestricted', user.id)
          }
        }
      }

      // Update user in context
      updateUser({ isRestricted: currentIsRestricted })
    } catch (error) {
      console.error('Failed to check user restrictions:', error)
    }
  }, [user?.id, showToast, t, shouldShowNotification, isNotificationShown, markNotificationShown, updateUser, getNotificationSettings])

  const checkTaskEvents = useCallback(async () => {
    if (!user?.id) return

    try {
      const history = await tasksApi.getHistory()
      const settings = await getNotificationSettings()

      const allTasks: Task[] = [...(history.created || []), ...(history.claimed || [])]

      for (const task of allTasks) {
        const storedStatusKey = getTaskStatusKey(task.id)
        const storedStatus = localStorage.getItem(storedStatusKey)
        const currentStatus = task.status

        // Only check tasks that are relevant to the user
        const isCreator = task.createdById === user.id
        const isClaimer = task.claimedById === user.id

        if (!isCreator && !isClaimer) continue

        // Update stored status
        localStorage.setItem(storedStatusKey, currentStatus)

        // Check for status changes
        if (storedStatus && storedStatus !== currentStatus) {
          // Task was claimed (only for creator)
          if (currentStatus === 'claimed' && storedStatus === 'created' && isCreator) {
            const notificationId = `task_claimed_${task.id}`
            if (
              !isNotificationShown('task_claimed', task.id) &&
              shouldShowNotification('task_claimed', settings)
            ) {
              const message = t('notifications.taskClaimed.message', {
                taskTitle: task.shortDescription || t('task.create'),
              })
              addNotification({
                id: notificationId,
                type: 'task_claimed',
                title: t('notificationHistory.titles.taskClaimed'),
                message,
                timestamp: Date.now(),
                taskId: task.id,
                actionUrl: `/tasks/${task.id}`,
              })
              showToast(message, 'success', 8000, {
                label: t('notifications.taskClaimed.action'),
                onClick: () => router.push(`/tasks/${task.id}`),
              })
              markNotificationShown('task_claimed', task.id)
            }
          }

          // Task was cancelled (for both creator and claimer)
          if (currentStatus === 'cancelled' && storedStatus !== 'cancelled') {
            const notificationId = `task_cancelled_${task.id}`
            if (
              !isNotificationShown('task_cancelled', task.id) &&
              shouldShowNotification('task_cancelled', settings)
            ) {
              const by = isCreator ? t('task.cancel') : t('task.refuse')
              const message = t('notifications.taskCancelled.message', {
                taskTitle: task.shortDescription || t('task.create'),
                by,
              })
              addNotification({
                id: notificationId,
                type: 'task_cancelled',
                title: t('notificationHistory.titles.taskCancelled'),
                message,
                timestamp: Date.now(),
                taskId: task.id,
                actionUrl: `/tasks/${task.id}`,
              })
              showToast(message, 'warning', 8000, {
                label: t('notifications.taskCancelled.action'),
                onClick: () => router.push(`/tasks/${task.id}`),
              })
              markNotificationShown('task_cancelled', task.id)
            }
          }

          // Task was completed (for both creator and claimer)
          if (currentStatus === 'completed' && storedStatus !== 'completed') {
            const notificationId = `task_completed_${task.id}`
            if (
              !isNotificationShown('task_completed', task.id) &&
              shouldShowNotification('task_completed', settings)
            ) {
              const message = t('notifications.taskCompleted.message', {
                taskTitle: task.shortDescription || t('task.create'),
              })
              addNotification({
                id: notificationId,
                type: 'task_completed',
                title: t('notificationHistory.titles.taskCompleted'),
                message,
                timestamp: Date.now(),
                taskId: task.id,
                actionUrl: `/tasks/${task.id}`,
              })
              showToast(message, 'success', 8000, {
                label: t('notifications.taskCompleted.action'),
                onClick: () => router.push(`/tasks/${task.id}`),
              })
              markNotificationShown('task_completed', task.id)
            }
          }

          // Task expired (only for creator)
          if (currentStatus === 'expired' && storedStatus !== 'expired' && isCreator) {
            const notificationId = `task_expired_${task.id}`
            if (
              !isNotificationShown('task_expired', task.id) &&
              shouldShowNotification('task_expired', settings)
            ) {
              const message = t('notifications.taskExpired.message', {
                taskTitle: task.shortDescription || t('task.create'),
              })
              addNotification({
                id: notificationId,
                type: 'task_expired',
                title: t('notificationHistory.titles.taskExpired'),
                message,
                timestamp: Date.now(),
                taskId: task.id,
                actionUrl: `/tasks/${task.id}`,
              })
              showToast(message, 'info', 8000, {
                label: t('notifications.taskExpired.action'),
                onClick: () => router.push(`/tasks/${task.id}`),
              })
              markNotificationShown('task_expired', task.id)
            }
          }
        } else if (!storedStatus) {
          // First time seeing this task, store its status
          localStorage.setItem(storedStatusKey, currentStatus)
        }
      }
    } catch (error) {
      console.error('Failed to check task events:', error)
    }
  }, [
    user?.id,
    showToast,
    t,
    router,
    shouldShowNotification,
    isNotificationShown,
    markNotificationShown,
    getNotificationSettings,
    addNotification,
  ])

  const checkSupportReplies = useCallback(async () => {
    if (!user?.id) return

    try {
      const settings = await getNotificationSettings()
      if (!shouldShowNotification('support_reply', settings)) {
        return
      }

      const requests = await supportApi.getMySupportRequests()
      const storedRequestsKey = `support_requests_${user.id}`
      const storedRequests = JSON.parse(
        localStorage.getItem(storedRequestsKey) || '{}',
      ) as Record<string, { answeredAt: string | null }>

      for (const request of requests) {
        if (request.status === 'answered' && request.answeredAt) {
          const stored = storedRequests[request.id]
          const storedAnsweredAt = stored?.answeredAt || null
          const currentAnsweredAt = request.answeredAt

          if (storedAnsweredAt !== currentAnsweredAt) {
            const notificationId = `support_reply_${request.id}`
            if (!isNotificationShown('support_reply', request.id)) {
              const message = t('notifications.supportReply.message', {
                message: request.responseMessage || '',
              })
              addNotification({
                id: notificationId,
                type: 'support_reply',
                title: t('notificationHistory.titles.supportReply'),
                message,
                timestamp: Date.now(),
              })
              showToast(message, 'info', 10000, {
                label: t('notifications.supportReply.action'),
                onClick: () => {
                  // Could navigate to support history if we add that page
                },
              })
              markNotificationShown('support_reply', request.id)
            }

            // Update stored answeredAt
            storedRequests[request.id] = { answeredAt: currentAnsweredAt }
          } else if (!stored) {
            // First time seeing this request, store it
            storedRequests[request.id] = { answeredAt: currentAnsweredAt }
          }
        } else {
          // Request is open, store it without answeredAt
          if (!storedRequests[request.id]) {
            storedRequests[request.id] = { answeredAt: null }
          }
        }
      }

      // Save updated stored requests
      localStorage.setItem(storedRequestsKey, JSON.stringify(storedRequests))
    } catch (error) {
      console.error('Failed to check support replies:', error)
    }
  }, [
    user?.id,
    showToast,
    t,
    shouldShowNotification,
    isNotificationShown,
    markNotificationShown,
    getNotificationSettings,
    addNotification,
  ])

  const checkAll = useCallback(async () => {
    if (checkingRef.current) return
    checkingRef.current = true

    try {
      await Promise.all([
        checkUserRestrictions(),
        checkTaskEvents(),
        checkSupportReplies(),
      ])
    } finally {
      checkingRef.current = false
    }
  }, [checkUserRestrictions, checkTaskEvents, checkSupportReplies])

  return {
    checkUserRestrictions,
    checkTaskEvents,
    checkAll,
    markNotificationShown,
    shouldShowNotification,
  }
}
