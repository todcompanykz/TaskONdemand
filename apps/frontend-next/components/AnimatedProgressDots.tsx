'use client'

import React from 'react'

interface AnimatedProgressDotsProps {
  isActive: boolean
  color?: 'primary' | 'gray'
  size?: 'sm' | 'md'
  orientation?: 'horizontal' | 'vertical'
}

export default function AnimatedProgressDots({
  isActive,
  color = 'primary',
  size = 'md',
  orientation = 'horizontal',
}: AnimatedProgressDotsProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'
  
  const colorClasses = color === 'primary'
    ? 'bg-primary dark:bg-primary-light'
    : 'bg-gray-400 dark:bg-gray-500'

  const containerClass = orientation === 'horizontal'
    ? `flex items-center ${gap}`
    : `flex flex-col items-center ${gap}`

  return (
    <div
      className={containerClass}
      aria-label={isActive ? 'Task in progress' : undefined}
      role={isActive ? 'status' : undefined}
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${dotSize} 
            rounded-full 
            ${colorClasses}
            ${isActive ? 'animate-pulse-dot' : 'opacity-40'}
          `}
          style={{
            animationDelay: isActive ? `${index * 0.2}s` : '0s',
            animationPlayState: isActive ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  )
}
