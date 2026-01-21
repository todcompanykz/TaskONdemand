'use client'

import React, { useState, useEffect } from 'react'
import { useI18n } from '@/contexts/I18nContext'

interface OnboardingModalProps {
  onComplete: () => void
}

interface Slide {
  title: string
  content: string
  icon: React.ReactNode
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { t } = useI18n()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides: Slide[] = [
    {
      title: t('onboarding.welcome.title'),
      content: t('onboarding.welcome.content'),
      icon: (
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      ),
    },
    {
      title: t('onboarding.localTasks.title'),
      content: t('onboarding.localTasks.content'),
      icon: (
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      ),
    },
    {
      title: t('onboarding.privacy.title'),
      content: t('onboarding.privacy.content'),
      icon: (
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ),
    },
    {
      title: t('onboarding.payment.title'),
      content: t('onboarding.payment.content'),
      icon: (
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
    },
    {
      title: t('onboarding.rules.title'),
      content: t('onboarding.rules.content'),
      icon: (
        <div className="w-20 h-20 bg-primary/10 dark:bg-primary-light/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true')
    onComplete()
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[10001] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentSlide + 1} / {slides.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary dark:bg-primary-light h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Slide content */}
        <div className="text-center mb-6">
          {slides[currentSlide].icon}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {slides[currentSlide].content}
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={handlePrevious}
              className="btn-outline flex-1"
            >
              {t('onboarding.previous')}
            </button>
          )}
          <button
            onClick={handleNext}
            className="btn-primary flex-1"
          >
            {currentSlide === slides.length - 1 ? t('onboarding.getStarted') : t('onboarding.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
