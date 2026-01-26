'use client'

import { useState } from 'react'

export type SortOption = 
  | 'price_desc' 
  | 'price_asc' 
  | 'time_desc' 
  | 'time_asc' 
  | 'urgency_desc'

interface SortSelectorProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'time_desc', label: 'Время: новые сначала' },
  { value: 'time_asc', label: 'Время: старые сначала' },
  { value: 'urgency_desc', label: 'Срочность: высокая → низкая' },
]

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentLabel = sortOptions.find(opt => opt.value === value)?.label || 'Сортировка'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span>{currentLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  value === option.value
                    ? 'bg-primary/10 text-primary dark:text-primary-light font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
