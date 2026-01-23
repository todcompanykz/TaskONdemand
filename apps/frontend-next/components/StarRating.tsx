'use client'

import { useId } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  className?: string
  sizePx?: number
  name?: string
}

export default function StarRating({ value, onChange, className, sizePx = 30, name }: Props) {
  const uid = useId().replace(/:/g, '')
  const groupName = name || `rating-${uid}`

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'H1',
      location: 'apps/frontend-next/components/StarRating.tsx:render',
      message: 'StarRating render',
      data: { value, groupName, uid },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  return (
    <div className={`rating ${className || ''}`.trim()} role="radiogroup" aria-label="rating">
      {[5, 4, 3, 2, 1].map((n) => {
        const id = `${uid}-star${n}`
        const isChecked = value === n
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'H2',
            location: 'apps/frontend-next/components/StarRating.tsx:map',
            message: 'star mapping',
            data: { starValue: n, currentValue: value, isChecked, id },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        return (
          <span key={n}>
            <input
              type="radio"
              id={id}
              name={groupName}
              value={n}
              checked={isChecked}
              onChange={() => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sessionId: 'debug-session',
                    runId: 'run1',
                    hypothesisId: 'H3',
                    location: 'apps/frontend-next/components/StarRating.tsx:onChange',
                    message: 'rating_changed',
                    data: { newValue: n, oldValue: value },
                    timestamp: Date.now(),
                  }),
                }).catch(() => {})
                // #endregion
                onChange(n)
              }}
            />
            <label htmlFor={id} aria-label={`${n}`}>
              <span className="sr-only">{n}</span>
            </label>
          </span>
        )
      })}

      <style jsx>{`
        .rating label:before {
          font-size: ${sizePx}px;
        }
      `}</style>
    </div>
  )
}

