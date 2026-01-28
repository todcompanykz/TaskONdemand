'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, usersApi, User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, firstName: string, lastName: string, password: string, confirmPassword: string, phoneNumber?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

// Helper function to check if user is admin
function checkIsAdmin(user: User | null): boolean {
  if (!user) return false
  // Check role from backend (preferred)
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return true
  }
  // Fallback to email-based check for backward compatibility
  const emailLower = user.email?.toLowerCase() || ''
  return (
    emailLower.includes('@admin.') ||
    emailLower.startsWith('admin@') ||
    emailLower === 'admin@tod.kz' ||
    emailLower === 'admin@example.com'
  )
}

// Helper function to check if user is super admin
function checkIsSuperAdmin(user: User | null): boolean {
  if (!user) return false
  return user.role === 'SUPER_ADMIN'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:34',message:'AuthContext useEffect start',data:{hasToken:!!localStorage.getItem('token'),hasStoredUser:!!localStorage.getItem('user')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
    // #endregion

    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:42',message:'AuthContext verifying token before setting user',data:{userId:parsedUser?.id,userEmail:parsedUser?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        } catch(e) {}
        // #endregion
        // Verify token is still valid BEFORE setting user
        usersApi.getMe().then((currentUser) => {
          // #region agent log
          try {
            fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:47',message:'AuthContext token verification success, setting user',data:{userId:currentUser?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          setUser(currentUser || parsedUser)
          setLoading(false)
        }).catch(() => {
          // #region agent log
          try {
            fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:52',message:'AuthContext token verification failed, clearing user',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
          setLoading(false)
        })
      } catch (error) {
        // #region agent log
        try {
          fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:60',message:'AuthContext parse error, clearing storage',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        } catch(e) {}
        // #endregion
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setLoading(false)
      }
    } else {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:68',message:'AuthContext no token or storedUser',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      setLoading(false)
    }
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

  const isAdmin = checkIsAdmin(user)
  const isSuperAdmin = checkIsSuperAdmin(user)

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuperAdmin, login, register, logout, updateUser }}>
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
