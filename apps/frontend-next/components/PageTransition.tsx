'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [displayChildren, setDisplayChildren] = useState(children)
  const [direction, setDirection] = useState<'in' | 'out'>('in')

  useEffect(() => {
    // Start fade out with slide
    setIsVisible(false)
    setDirection('out')
    
    // After fade out completes, update children and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setDirection('in')
      setIsVisible(true)
    }, 200) // Transition duration

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}
      style={{
        transitionProperty: 'opacity, transform',
      }}
    >
      {displayChildren}
    </div>
  )
}
