'use client'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  // Animations disabled - return children directly
  return <>{children}</>
}
