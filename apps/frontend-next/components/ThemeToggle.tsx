'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * ThemeToggle - CSS-only animated theme toggle component
 * 
 * Uses checkbox input with :checked pseudo-class for all state management.
 * All animations are CSS transitions via Tailwind + custom CSS, no JavaScript animations.
 */
export default function ThemeToggle() {
  // #region agent log
  useEffect(() => {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:14',message:'ThemeToggle component start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
    } catch(e) {}
  }, []);
  // #endregion

  const { isDark, toggleTheme } = useTheme()
  
  // #region agent log
  useEffect(() => {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:24',message:'useTheme called successfully',data:{isDark,toggleThemeExists:typeof toggleTheme === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'F'})}).catch(()=>{});
    } catch(e) {}
  }, [isDark, toggleTheme]);
  // #endregion
  
  // #region agent log
  useEffect(() => {
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:24',message:'useTheme called successfully',data:{isDark,toggleThemeExists:typeof toggleTheme === 'function'},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
    } catch(e) {}
  }, [isDark, toggleTheme]);
  // #endregion
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Sync checkbox state with theme context
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = isDark
    }
  }, [isDark])

  // Handle checkbox change to sync with theme context
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only toggle if state actually changed (to avoid infinite loops)
    if (e.target.checked !== isDark) {
      toggleTheme()
    }
  }

  // #region agent log
  useEffect(() => {
    try {
      const toggle = document.querySelector('label[aria-label="Переключить тему"]')
      const container = toggle?.querySelector('.theme-toggle-container')
      const knob = toggle?.querySelector('.theme-toggle-knob')
      const checkbox = toggle?.querySelector('.theme-toggle-checkbox')
      const parent = toggle?.parentElement
      const styles = toggle ? window.getComputedStyle(toggle) : null
      const containerStyles = container ? window.getComputedStyle(container) : null
      const parentStyles = parent ? window.getComputedStyle(parent) : null
      const rect = toggle?.getBoundingClientRect()
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:40',message:'ThemeToggle detailed DOM check',data:{exists:!!toggle,hasContainer:!!container,hasKnob:!!knob,hasCheckbox:!!checkbox,hasParent:!!parent,parentWidth:parentStyles?.width,parentHeight:parentStyles?.height,parentDisplay:parentStyles?.display,width:styles?.width,height:styles?.height,display:styles?.display,visibility:styles?.visibility,opacity:styles?.opacity,zIndex:styles?.zIndex,position:styles?.position,rect:rect?{x:rect.x,y:rect.y,width:rect.width,height:rect.height}:null,containerWidth:containerStyles?.width,containerHeight:containerStyles?.height,containerBg:containerStyles?.background,isDark,themeValue:{isDark,toggleThemeExists:typeof toggleTheme === 'function'}},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ThemeToggle.tsx:40',message:'ThemeToggle DOM check error',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    }
  }, [isDark, toggleTheme]);
  // #endregion

  return (
    <label
      className="relative inline-flex items-center w-20 h-10 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-800 rounded-full flex-shrink-0 z-10"
      style={{ minWidth: '80px', minHeight: '40px', display: 'inline-flex', position: 'relative' }}
      aria-label="Переключить тему"
      title={`Переключить на ${isDark ? 'светлую' : 'тёмную'} тему`}
      data-theme-toggle="true"
    >
      {/* Hidden checkbox - controls state via :checked */}
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={isDark}
        onChange={handleChange}
        className="sr-only theme-toggle-checkbox"
        aria-hidden="true"
      />

      {/* Toggle container - background with gradient */}
      <div className="theme-toggle-container relative w-full h-full rounded-full overflow-hidden transition-all duration-500 ease-in-out bg-gradient-to-br from-sky-400 via-blue-400 to-blue-500 shadow-inner">
        
        {/* Clouds layer - visible in day mode */}
        <div className="theme-toggle-clouds absolute inset-0 transition-all duration-500 ease-in-out opacity-100 translate-y-0">
          {/* Cloud 1 */}
          <div className="absolute top-2 left-3 w-8 h-3 bg-white/40 rounded-full blur-[1px]" />
          <div className="absolute top-1 left-2 w-4 h-4 bg-white/40 rounded-full blur-[1px]" />
          <div className="absolute top-1 left-6 w-4 h-4 bg-white/40 rounded-full blur-[1px]" />
          
          {/* Cloud 2 */}
          <div className="absolute top-6 right-4 w-6 h-2.5 bg-white/30 rounded-full blur-[1px]" />
          <div className="absolute top-5 right-3 w-3 h-3 bg-white/30 rounded-full blur-[1px]" />
          <div className="absolute top-5 right-6 w-3 h-3 bg-white/30 rounded-full blur-[1px]" />
        </div>

        {/* Stars layer - visible in night mode */}
        <div className="theme-toggle-stars absolute inset-0 transition-all duration-500 ease-in-out opacity-0 -translate-y-2">
          {/* Star 1 */}
          <svg
            className="absolute top-2 left-4 w-1.5 h-1.5 text-yellow-200 transition-all duration-700 ease-out"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>

          {/* Star 2 */}
          <svg
            className="absolute top-5 right-6 w-1 h-1 text-yellow-200 transition-all duration-700 ease-out delay-100"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>

          {/* Star 3 */}
          <svg
            className="absolute top-3 right-3 w-1 h-1 text-yellow-100 transition-all duration-700 ease-out delay-200"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>

          {/* Star 4 */}
          <svg
            className="absolute bottom-3 left-6 w-1.5 h-1.5 text-yellow-200 transition-all duration-700 ease-out delay-300"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>

          {/* Star 5 */}
          <svg
            className="absolute bottom-2 right-8 w-1 h-1 text-yellow-100 transition-all duration-700 ease-out delay-[400ms]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

        {/* Sliding knob - sun/moon icon */}
        <div className="theme-toggle-knob absolute top-1 left-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-500 ease-in-out flex items-center justify-center">
          {/* Sun icon - visible in day mode */}
          <div className="theme-toggle-sun absolute w-5 h-5 transition-all duration-500 ease-in-out opacity-100 scale-100 rotate-0">
            <svg
              className="w-full h-full text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Moon icon - visible in night mode */}
          <div className="theme-toggle-moon absolute w-5 h-5 transition-all duration-500 ease-in-out opacity-0 scale-0 -rotate-90">
            <svg
              className="w-full h-full text-slate-200"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          </div>
        </div>
      </div>
    </label>
  )
}
