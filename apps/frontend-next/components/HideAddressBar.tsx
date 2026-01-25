'use client'

import { useEffect } from 'react'

export default function HideAddressBar() {
  useEffect(() => {
    // Only run on mobile browsers (not in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return // Already in standalone mode, no need to hide address bar
    }

    let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop
    let ticking = false
    let scrollTimeout: NodeJS.Timeout | null = null

    // Initial scroll to hide address bar on load
    const initialScroll = () => {
      if (window.scrollY === 0) {
        window.scrollTo(0, 1)
        setTimeout(() => {
          window.scrollTo(0, 0)
        }, 0)
      }
    }

    // Run after a short delay to ensure page is loaded
    setTimeout(initialScroll, 100)

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop

          // If user scrolls up near the top, prevent address bar from showing
          if (currentScrollTop < lastScrollTop && currentScrollTop < 50) {
            // Keep a small scroll offset to prevent address bar
            if (currentScrollTop === 0) {
              window.scrollTo(0, 1)
            }
          }

          lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop
          ticking = false
        })
        ticking = true
      }

      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // After scrolling stops, ensure we're not at the very top
      scrollTimeout = setTimeout(() => {
        if (window.scrollY === 0) {
          window.scrollTo(0, 1)
          setTimeout(() => {
            window.scrollTo(0, 0)
          }, 0)
        }
      }, 150)
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Prevent overscroll bounce at the top
      if (window.scrollY === 0 && e.touches[0].clientY > 0) {
        // Allow normal scrolling but prevent bounce
        document.body.style.overscrollBehavior = 'none'
      }
    }

    const handleTouchEnd = () => {
      // Reset after touch ends
      document.body.style.overscrollBehavior = ''
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [])

  return null
}
