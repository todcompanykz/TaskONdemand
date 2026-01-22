'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
  action?: ToastAction
  persistent?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
    action?: ToastAction,
    persistent?: boolean
  ) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    duration: number = 5000,
    action?: ToastAction,
    persistent: boolean = false
  ) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type, duration, action, persistent }
    
    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration (unless persistent)
    if (duration > 0 && !persistent) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
