'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, usersApi, User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, firstName: string, lastName: string, password: string, confirmPassword: string, phoneNumber?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

// Helper function to check if user is admin
function checkIsAdmin(email: string | undefined): boolean {
  if (!email) return false
  const emailLower = email.toLowerCase()
  return (
    emailLower.includes('@admin.') ||
    emailLower.startsWith('admin@') ||
    emailLower === 'admin@tod.kz' ||
    emailLower === 'admin@example.com'
  )
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        // Verify token is still valid
        usersApi.getMe().catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const register = async (email: string, firstName: string, lastName: string, password: string, confirmPassword: string, phoneNumber?: string) => {
    const response = await authApi.register(email, firstName, lastName, password, confirmPassword, phoneNumber)
    localStorage.setItem('token', response.accessToken)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
  }

  const isAdmin = checkIsAdmin(user?.email)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
