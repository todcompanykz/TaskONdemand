'use client'

export default function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="p-4 md:p-6">
        {/* Header: Price + Title */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-lg mb-2 w-3/4"></div>
          </div>
          <div className="flex-shrink-0">
            <div className="h-12 w-20 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-6 w-16 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Description */}
        <div className="mb-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="flex-1 h-10 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}
