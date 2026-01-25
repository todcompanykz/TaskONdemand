'use client'

import React from 'react'
import { Task } from '@/lib/api'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useI18n } from '@/contexts/I18nContext'
import AnimatedProgressDots from './AnimatedProgressDots'

interface TaskStatusTimelineProps {
  task: Task
  userRole?: 'creator' | 'executor' | null
}

type TimelineStep = {
  id: string
  labelKey: string
  helperTextKey: string
  status: 'completed' | 'current' | 'future'
}

export default function TaskStatusTimeline({ task, userRole }: TaskStatusTimelineProps) {
  const { t } = useI18n()

  const getSteps = (): TimelineStep[] => {
    // Determine helper text keys based on user role
    const createdHelperKey = userRole === 'creator' 
      ? 'timeline.createdHelperCreator' 
      : userRole === 'executor'
      ? 'timeline.createdHelperExecutor'
      : 'timeline.createdHelper'
    
    const claimedHelperKey = userRole === 'creator'
      ? 'timeline.claimedHelperCreator'
      : userRole === 'executor'
      ? 'timeline.claimedHelperExecutor'
      : 'timeline.claimedHelper'
    
    const inProgressHelperKey = userRole === 'creator'
      ? 'timeline.inProgressHelperCreator'
      : userRole === 'executor'
      ? 'timeline.inProgressHelperExecutor'
      : 'timeline.inProgressHelper'
    
    const completedHelperKey = userRole === 'creator'
      ? 'timeline.completedHelperCreator'
      : userRole === 'executor'
      ? 'timeline.completedHelperExecutor'
      : 'timeline.completedHelper'

    const steps: TimelineStep[] = [
      {
        id: 'created',
        labelKey: 'timeline.created',
        helperTextKey: createdHelperKey,
        status: 'future',
      },
      {
        id: 'claimed',
        labelKey: 'timeline.claimed',
        helperTextKey: claimedHelperKey,
        status: 'future',
      },
      {
        id: 'in-progress',
        labelKey: 'timeline.inProgress',
        helperTextKey: inProgressHelperKey,
        status: 'future',
      },
      {
        id: 'completed',
        labelKey: 'timeline.completed',
        helperTextKey: completedHelperKey,
        status: 'future',
      },
    ]

    // Determine current step based on task status
    if (task.status === 'created') {
      steps[0].status = 'current'
    } else if (task.status === 'claimed') {
      steps[0].status = 'completed'
      // Show "In progress" if work hasn't been confirmed yet
      if (!task.customerConfirmed) {
        steps[1].status = 'completed'
        steps[2].status = 'current'
      } else {
        steps[1].status = 'current'
      }
    } else if (task.status === 'completed') {
      steps[0].status = 'completed'
      steps[1].status = 'completed'
      steps[2].status = 'completed'
      steps[3].status = 'current'
    } else {
      // For cancelled or expired, show created as completed
      steps[0].status = 'completed'
    }

    return steps
  }

  const steps = getSteps()

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                    step.status === 'completed'
                      ? 'bg-primary border-primary text-white'
                      : step.status === 'current'
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.status === 'completed' || step.status === 'current' ? (
                    <CheckIcon className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={`text-sm font-medium ${
                      step.status === 'current'
                        ? 'text-primary dark:text-primary-light'
                        : step.status === 'completed'
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {t(step.labelKey)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t(step.helperTextKey)}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 flex items-center justify-center mx-2">
                  {step.status === 'completed' ? (
                    // Completed step: show static blue line
                    <div className="w-full h-0.5 bg-primary" />
                  ) : step.status === 'current' && steps[index + 1]?.status === 'future' ? (
                    // Current step with future next: show animated dots
                    <AnimatedProgressDots 
                      isActive={true} 
                      color="primary" 
                      size="md"
                      orientation="horizontal"
                    />
                  ) : (
                    // Future steps: show static gray line
                    <div className="w-full h-0.5 bg-gray-300 dark:bg-slate-600" />
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: Vertical layout */}
        <div className="md:hidden space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    step.status === 'completed'
                      ? 'bg-primary border-primary text-white'
                      : step.status === 'current'
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.status === 'completed' || step.status === 'current' ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="flex flex-col items-center flex-1 mt-2" style={{ minHeight: '2rem' }}>
                    {step.status === 'completed' ? (
                      // Completed step: show static blue line
                      <div className="w-0.5 h-full bg-primary" />
                    ) : step.status === 'current' && steps[index + 1]?.status === 'future' ? (
                      // Current step with future next: show animated dots (vertical)
                      <div className="flex flex-col items-center justify-center h-full py-1">
                        <AnimatedProgressDots 
                          isActive={true} 
                          color="primary" 
                          size="sm"
                          orientation="vertical"
                        />
                      </div>
                    ) : (
                      // Future steps: show static gray line
                      <div className="w-0.5 h-full bg-gray-300 dark:bg-slate-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className={`text-sm font-medium ${
                    step.status === 'current'
                      ? 'text-primary dark:text-primary-light'
                      : step.status === 'completed'
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {t(step.labelKey)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t(step.helperTextKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
