'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'ru' | 'kk' | 'en'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Load translations statically (for Next.js standalone build)
import ruMessages from '@/messages/ru.json'
import kkMessages from '@/messages/kk.json'
import enMessages from '@/messages/en.json'

const translationsMap: Record<Language, Record<string, any>> = {
  ru: ruMessages,
  kk: kkMessages,
  en: enMessages,
}

const loadTranslations = async (lang: Language): Promise<Record<string, any>> => {
  return translationsMap[lang] || translationsMap.ru
}

// Get nested value from object by dot notation path
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key]
    } else {
      return path // Return path as fallback
    }
  }
  return typeof value === 'string' ? value : path
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru')
  const [translations, setTranslations] = useState<Record<string, any>>({})

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language | null
    const browserLang = navigator.language.split('-')[0]
    
    let initialLang: Language = 'ru' // Default
    
    if (storedLang && ['ru', 'kk', 'en'].includes(storedLang)) {
      initialLang = storedLang as Language
    } else if (browserLang === 'kk' || browserLang === 'en') {
      initialLang = browserLang as Language
    }
    
    setLanguageState(initialLang)
  }, [])

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(language).then(setTranslations)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    // Reload translations
    loadTranslations(lang).then(setTranslations)
  }

  const t = (key: string): string => {
    return getNestedValue(translations, key)
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
