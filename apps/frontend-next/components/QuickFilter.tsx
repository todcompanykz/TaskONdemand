'use client'

export type UrgencyFilter = 'all' | 'low' | 'medium' | 'high'
export type PriceFilter = 'all' | 'under_1000' | '1000_5000' | 'over_5000'
export type TimeFilter = 'all' | 'urgent' | 'expiring_soon'

interface QuickFilterProps {
  urgencyFilter: UrgencyFilter
  priceFilter: PriceFilter
  timeFilter: TimeFilter
  onUrgencyChange: (filter: UrgencyFilter) => void
  onPriceChange: (filter: PriceFilter) => void
  onTimeChange: (filter: TimeFilter) => void
}

export default function QuickFilter({
  urgencyFilter,
  priceFilter,
  timeFilter,
  onUrgencyChange,
  onPriceChange,
  onTimeChange,
}: QuickFilterProps) {
  return (
    <div className="mb-4 space-y-3">
      {/* Urgency Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Срочность:
        </span>
        <div className="flex gap-2">
          {(['all', 'low', 'medium', 'high'] as UrgencyFilter[]).map((value) => (
            <button
              key={value}
              onClick={() => onUrgencyChange(value)}
              className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                urgencyFilter === value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {value === 'all' ? 'Все' : value === 'low' ? 'Низкая' : value === 'medium' ? 'Средняя' : 'Высокая'}
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Цена:
        </span>
        <div className="flex gap-2">
          {([
            { value: 'all', label: 'Все' },
            { value: 'under_1000', label: 'До 1000₸' },
            { value: '1000_5000', label: '1000-5000₸' },
            { value: 'over_5000', label: '5000₸+' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onPriceChange(value as PriceFilter)}
              className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                priceFilter === value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Время:
        </span>
        <div className="flex gap-2">
          {([
            { value: 'all', label: 'Все' },
            { value: 'urgent', label: 'Срочные' },
            { value: 'expiring_soon', label: 'Скоро истекают' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onTimeChange(value as TimeFilter)}
              className={`rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                timeFilter === value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
