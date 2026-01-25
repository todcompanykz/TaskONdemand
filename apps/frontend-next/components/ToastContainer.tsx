'use client'

import React from 'react'
import { useToast } from '@/contexts/ToastContext'
import Toast from './Toast'

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="toast-container fixed flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <Toast toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
